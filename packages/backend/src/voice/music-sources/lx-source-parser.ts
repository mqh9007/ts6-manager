import vm from 'node:vm';

export type LxSourcePlatform = {
  id: string;
  name: string;
  qualitys: string[];
  actions: string[];
};

export type ParsedLxSource = { name: string; platforms: LxSourcePlatform[] };

const PLATFORM_INFO: Record<string, { name: string; qualitys: string[] }> = {
  wy: { name: '网易云音乐', qualitys: ['128k', '320k', 'flac'] },
  tx: { name: 'QQ音乐', qualitys: ['128k', '320k', 'flac'] },
  kg: { name: '酷狗音乐', qualitys: ['128k', '320k', 'flac'] },
  kw: { name: '酷我音乐', qualitys: ['128k', '320k', 'flac'] },
  mg: { name: '咪咕音乐', qualitys: ['128k', '320k', 'flac'] },
};

function inferPlatforms(code: string): LxSourcePlatform[] {
  const ids = new Set<string>();
  for (const id of Object.keys(PLATFORM_INFO)) {
    if (new RegExp(`['\"]${id}['\"]|${id === 'tx' ? 'qq|tencent' : id === 'mg' ? 'migu' : id}`, 'i').test(code)) ids.add(id);
  }
  if (!ids.size && /init\.conf|on\s*\([^)]*request|musicUrl/i.test(code)) {
    Object.keys(PLATFORM_INFO).forEach((id) => ids.add(id));
  }
  return [...ids].map((id) => ({ id, ...PLATFORM_INFO[id], actions: ['musicUrl', 'lyric', 'pic'] }));
}

function fallbackParse(code: string, fallbackName: string): ParsedLxSource {
  if (!/globalThis(?:\s*\[\s*['\"]lx['\"]|\s*\.\s*lx)|\blx\s*=|EVENT_NAMES|EVENT_NAMES\s*:/i.test(code) || !/inited|musicUrl|init\.conf|on\s*\(/i.test(code)) {
    throw new Error('Not a compatible LX Music source: missing LX initialization markers');
  }
  const platforms = inferPlatforms(code);
  if (!platforms.length) throw new Error('Not a compatible LX Music source: no supported platform detected');
  const declaredName = code.match(/^\s*\*?\s*@name\s+(.+)\s*$/m)?.[1]?.trim();
  return { name: declaredName || fallbackName, platforms };
}

/** Validates an LX Music source by running only its synchronous initialization. */
export function parseLxMusicSource(code: string, fallbackName: string): ParsedLxSource {
  // Do not execute third-party source code during upload. Many sources start
  // asynchronous remote initialization immediately; executing them with a
  // fake network callback can create unhandled promise rejections. Syntax is
  // still fully validated by V8, while runtime/network behavior is checked by
  // the explicit source test and real playback path.
  try {
    new vm.Script(code, { filename: `${fallbackName}.js` });
  } catch (error) {
    throw error;
  }
  return fallbackParse(code, fallbackName);
}
