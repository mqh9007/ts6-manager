import vm from 'node:vm';

type LxRequestOptions = { method?: string; headers?: Record<string, string>; body?: any; timeout?: number };
type LxRequestResult = { url: string; ok: boolean; statusCode?: number; error?: string };

const DEFAULT_SOURCE_REQUEST_TIMEOUT_MS = 25_000;
const MAX_SOURCE_REQUEST_TIMEOUT_MS = 30_000;
const SOURCE_RESOLVE_TIMEOUT_MS = 60_000;

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
  const method = (options.method || 'GET').toUpperCase();
  // Community sources commonly declare 8 seconds, which is too short for
  // cross-region music APIs. Treat a source value as a requested extension,
  // never as a shorter limit than the service baseline.
  const timeoutMs = Math.min(Math.max(options.timeout || 0, DEFAULT_SOURCE_REQUEST_TIMEOUT_MS), MAX_SOURCE_REQUEST_TIMEOUT_MS);
  const attempts = method === 'GET' || method === 'HEAD' ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(target, { method, headers: options.headers, body: options.body, signal: controller.signal, redirect: 'follow' });
      const text = await response.text();
      let body: unknown = text;
      try { body = JSON.parse(text); } catch { /* source may expect text */ }
      return { body, statusCode: response.status, headers: Object.fromEntries(response.headers.entries()) };
    } catch (error) {
      lastError = error;
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      clearTimeout(timer);
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new Error(`音乐源请求超时（${Math.round(timeoutMs / 1000)} 秒）`);
  }
  throw lastError;
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
  const sandbox = {
    btoa: globalThis.btoa,
    setTimeout,
    clearTimeout,
    lx: { EVENT_NAMES: eventNames, request, on: () => undefined, send: (event: string) => { if (event === eventNames.inited) initialized = true; }, env: { platform: 'server' } },
  };
  vm.runInNewContext(code, sandbox, { timeout: 1_500, filename: 'music-source.js' });
  await Promise.race([Promise.allSettled(pending), new Promise((resolve) => setTimeout(resolve, 12_500))]);
  return { initialized, requests };
}

/** Resolve a playable URL from an uploaded LX Music source. */
export async function resolveLxMusicUrl(code: string, platform: string, musicInfo: Record<string, unknown>, quality = '128k', action: 'musicUrl' | 'pic' = 'musicUrl'): Promise<string> {
  let requestHandler: ((payload: unknown) => unknown) | undefined;
  const eventNames = { inited: 'inited', request: 'request', updateAlert: 'updateAlert' };
  const request = (url: string, options: LxRequestOptions | ((err: Error | null, result?: unknown) => void) = {}, callback?: (err: Error | null, result?: unknown) => void) => {
    const actualOptions = typeof options === 'function' ? {} : options;
    const actualCallback = typeof options === 'function' ? options : callback;
    void sourceFetch(url, actualOptions).then((result) => actualCallback?.(null, result)).catch((error: Error) => actualCallback?.(error));
  };
  const sandbox = {
    btoa: globalThis.btoa,
    setTimeout,
    clearTimeout,
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
  let timer: ReturnType<typeof setTimeout> | undefined;
  let result: unknown;
  try {
    result = await Promise.race([
      Promise.resolve(requestHandler({ action, source: platform, info: { musicInfo, type: quality } })),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(action === 'pic' ? '音乐源获取封面超时' : '音乐源解析歌曲地址超时，请稍后重试')), action === 'pic' ? 5000 : SOURCE_RESOLVE_TIMEOUT_MS); }),
    ]);
  } finally { clearTimeout(timer); }
  if (typeof result !== 'string' || !result.startsWith('http')) throw new Error('Music source did not return a playable URL');
  return result;
}
