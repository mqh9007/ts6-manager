import vm from 'node:vm';

type LxRequestOptions = { method?: string; headers?: Record<string, string>; body?: any; timeout?: number };
type LxRequestResult = { url: string; ok: boolean; statusCode?: number; error?: string };

function safeUrl(input: string): URL {
  const url = new URL(input);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Only HTTP(S) music source requests are allowed');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    throw new Error('Music source requests to local networks are not allowed');
  }
  return url;
}

async function sourceFetch(url: string, options: LxRequestOptions = {}): Promise<{ body: unknown; statusCode: number; headers: Record<string, string> }> {
  const target = safeUrl(url);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(Math.max(options.timeout || 8_000, 500), 12_000));
  try {
    const response = await fetch(target, { method: options.method || 'GET', headers: options.headers, body: options.body, signal: controller.signal, redirect: 'follow' });
    const text = await response.text();
    let body: unknown = text;
    try { body = JSON.parse(text); } catch { /* source may expect text */ }
    return { body, statusCode: response.status, headers: Object.fromEntries(response.headers.entries()) };
  } finally { clearTimeout(timer); }
}

/** Runs the LX Music source initialization and reports its externally reachable services. */
export async function testLxMusicSource(code: string): Promise<{ initialized: boolean; requests: LxRequestResult[] }> {
  const requests: LxRequestResult[] = [];
  const pending: Promise<void>[] = [];
  let initialized = false;
  const eventNames = { inited: 'inited', request: 'request', updateAlert: 'updateAlert' };
  const request = (url: string, options: LxRequestOptions | ((err: Error | null, result?: unknown) => void) = {}, callback?: (err: Error | null, result?: unknown) => void) => {
    const actualOptions = typeof options === 'function' ? {} : options;
    const actualCallback = typeof options === 'function' ? options : callback;
    const task = sourceFetch(url, actualOptions).then((result) => {
      requests.push({ url, ok: result.statusCode >= 200 && result.statusCode < 400, statusCode: result.statusCode });
      actualCallback?.(null, result);
    }).catch((error: Error) => {
      requests.push({ url, ok: false, error: error.message });
      actualCallback?.(error);
    });
    pending.push(task);
  };
  const sandbox = { btoa: globalThis.btoa, lx: { EVENT_NAMES: eventNames, request, on: () => undefined, send: (event: string) => { if (event === eventNames.inited) initialized = true; }, env: { platform: 'server' } } };
  vm.runInNewContext(code, sandbox, { timeout: 1_500, filename: 'music-source.js' });
  await Promise.race([Promise.allSettled(pending), new Promise((resolve) => setTimeout(resolve, 12_500))]);
  return { initialized, requests };
}

/** Resolve a playable URL from an uploaded LX Music source. */
export async function resolveLxMusicUrl(code: string, platform: string, musicInfo: Record<string, unknown>, quality = '128k'): Promise<string> {
  let requestHandler: ((payload: unknown) => unknown) | undefined;
  const eventNames = { inited: 'inited', request: 'request', updateAlert: 'updateAlert' };
  const request = (url: string, options: LxRequestOptions | ((err: Error | null, result?: unknown) => void) = {}, callback?: (err: Error | null, result?: unknown) => void) => {
    const actualOptions = typeof options === 'function' ? {} : options;
    const actualCallback = typeof options === 'function' ? options : callback;
    void sourceFetch(url, actualOptions).then((result) => actualCallback?.(null, result)).catch((error: Error) => actualCallback?.(error));
  };
  const sandbox = {
    btoa: globalThis.btoa,
    lx: {
      EVENT_NAMES: eventNames,
      request,
      on: (event: string, handler: (payload: unknown) => unknown) => { if (event === eventNames.request) requestHandler = handler; },
      send: () => undefined,
      env: { platform: 'server' },
    },
  };
  vm.runInNewContext(code, sandbox, { timeout: 1_500, filename: 'music-source.js' });
  if (!requestHandler) throw new Error('Music source does not provide a request handler');
  const result = await Promise.race([
    Promise.resolve(requestHandler({ action: 'musicUrl', source: platform, info: { musicInfo, type: quality } })),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Music source request timed out')), 15_000)),
  ]);
  if (typeof result !== 'string' || !result.startsWith('http')) throw new Error('Music source did not return a playable URL');
  return result;
}
