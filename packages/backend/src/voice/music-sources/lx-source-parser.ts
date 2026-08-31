import vm from 'node:vm';

export type LxSourcePlatform = {
  id: string;
  name: string;
  qualitys: string[];
  actions: string[];
};

export type ParsedLxSource = { name: string; platforms: LxSourcePlatform[] };

/** Validates an LX Music source by running only its synchronous initialization. */
export function parseLxMusicSource(code: string, fallbackName: string): ParsedLxSource {
  let initialized: unknown;
  const eventNames = { inited: 'inited', request: 'request', updateAlert: 'updateAlert' };
  const sandbox = {
    lx: {
      EVENT_NAMES: eventNames,
      env: { platform: 'server' },
      on: () => undefined,
      send: (event: string, payload: unknown) => { if (event === eventNames.inited) initialized = payload; },
      request: (_url: string, _options: unknown, callback: (err: Error) => void) => callback(new Error('Network disabled while validating music source')),
    },
  };
  vm.runInNewContext(code, sandbox, { timeout: 1_500, filename: `${fallbackName}.js` });
  const result = initialized as { status?: boolean; sources?: Record<string, { name?: string; qualitys?: unknown; actions?: unknown }> } | undefined;
  if (!result?.status || !result.sources || typeof result.sources !== 'object') throw new Error('Not a compatible LX Music source: missing initialization metadata');
  const platforms = Object.entries(result.sources).map(([id, source]) => ({
    id,
    name: source.name || id,
    qualitys: Array.isArray(source.qualitys) ? source.qualitys.filter((item): item is string => typeof item === 'string') : [],
    actions: Array.isArray(source.actions) ? source.actions.filter((item): item is string => typeof item === 'string') : [],
  }));
  if (!platforms.length) throw new Error('The music source does not expose any platforms');
  const declaredName = code.match(/^\s*\*?\s*@name\s+(.+)\s*$/m)?.[1]?.trim();
  return { name: declaredName || fallbackName, platforms };
}
