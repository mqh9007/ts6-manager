import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { PrismaClient } from '../../../generated/prisma/index.js';
import { resolveLxMusicUrl } from './lx-source-runtime.js';

const MUSIC_SOURCES_KEY = 'music.sources';
const MUSIC_SOURCE_DIR = path.resolve('data', 'music-sources');

type SavedSource = { id: string; enabled: boolean; fileName: string; platforms: { id: string; name?: string }[] };
type SavedSettings = { sources: SavedSource[]; preferredPlatform: string };

export type MusicSearchResult = {
  title: string;
  artist: string;
  duration: number;
  platform: 'kg' | 'kw' | 'mg' | 'wy';
  musicInfo: Record<string, unknown>;
};

export type MusicPlaylist = {
  title: string;
  platform: MusicSearchResult['platform'];
  tracks: MusicSearchResult[];
};

export type MusicSourcePlatformTest = { id: string; name: string; ok: boolean; searchOk: boolean; playOk: boolean; message?: string };

async function fetchJson(url: string): Promise<any> {
  return fetchJsonWithHeaders(url);
}

async function fetchJsonWithHeaders(url: string, headers: Record<string, string> = {}): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'TS6-MusicBot/1.0', ...headers } });
    if (!response.ok) throw new Error(`Search service returned HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

async function searchKugou(query: string): Promise<MusicSearchResult[]> {
  const url = `https://songsearch.kugou.com/song_search_v2?keyword=${encodeURIComponent(query)}&page=1&pagesize=10&userid=0&clientver=&platform=WebFilter&filter=2&iscorrection=1&privilege_filter=0&area_code=1`;
  const data = await fetchJson(url);
  if (data?.error_code !== 0 || !Array.isArray(data?.data?.lists)) throw new Error('Kugou search returned no results');
  return data.data.lists.slice(0, 10).map((item: any) => ({
    title: String(item.SongName || '').replace(/<[^>]*>/g, ''),
    artist: String(item.SingerName || item.Singers?.[0]?.name || 'Unknown').replace(/<[^>]*>/g, ''),
    duration: Number(item.Duration || 0),
    platform: 'kg' as const,
    musicInfo: {
      name: item.SongName,
      singer: item.SingerName,
      songmid: item.Audioid,
      albumName: item.AlbumName,
      albumId: item.AlbumID,
      interval: item.Duration,
      hash: item.FileHash,
      _types: {
        '128k': { hash: item.FileHash },
        ...(item.HQFileHash ? { '320k': { hash: item.HQFileHash } } : {}),
        ...(item.SQFileHash ? { flac: { hash: item.SQFileHash } } : {}),
        ...(item.ResFileHash ? { flac24bit: { hash: item.ResFileHash } } : {}),
      },
    },
  })).filter((item: MusicSearchResult) => item.title && item.musicInfo.hash);
}

async function searchKuwo(query: string): Promise<MusicSearchResult[]> {
  const url = `http://search.kuwo.cn/r.s?client=kt&all=${encodeURIComponent(query)}&pn=0&rn=10&uid=794762570&ver=kwplayer_ar_9.2.2.1&vipver=1&show_copyright_off=1&newver=1&ft=music&cluster=0&strategy=2012&encoding=utf8&rformat=json&vermerge=1&mobi=1&issubtitle=1`;
  const data = await fetchJson(url);
  if (!Array.isArray(data?.abslist)) throw new Error('Kuwo search returned no results');
  return data.abslist.map((item: any) => ({
    title: String(item.SONGNAME || '').replace(/<[^>]*>/g, ''),
    artist: String(item.ARTIST || 'Unknown').replace(/<[^>]*>/g, ''),
    duration: Number(item.DURATION || 0),
    platform: 'kw' as const,
    musicInfo: { name: item.SONGNAME, singer: item.ARTIST, songmid: String(item.MUSICRID || '').replace(/^MUSIC_/, ''), albumName: item.ALBUM, albumId: item.ALBUMID, interval: item.DURATION },
  })).filter((item: MusicSearchResult) => item.title && item.musicInfo.songmid);
}

async function searchMigu(query: string): Promise<MusicSearchResult[]> {
  const timestamp = Date.now().toString();
  const deviceId = '963B7AA0D21511ED807EE5846EC87D20';
  const signature = createHash('md5').update(`${query}6cdc72a439cef99a3418d2a78aa28c73yyapp2d16148780a1dcc7408e06336b98cfd50${deviceId}${timestamp}`).digest('hex');
  const url = `https://jadeite.migu.cn/music_search/v3/search/searchAll?isCorrect=0&isCopyright=1&searchSwitch=%7B%22song%22%3A1%2C%22album%22%3A0%2C%22singer%22%3A0%2C%22tagSong%22%3A1%2C%22mvSong%22%3A0%2C%22bestShow%22%3A1%2C%22songlist%22%3A0%2C%22lyricSong%22%3A0%7D&pageSize=10&text=${encodeURIComponent(query)}&pageNo=1&sort=0&sid=USS`;
  const data = await fetchJsonWithHeaders(url, { uiVersion: 'A_music_3.6.1', deviceId, timestamp, sign: signature, channel: '0146921', 'User-Agent': 'Mozilla/5.0 (Linux; Android 11)' });
  if (data?.code !== '000000' || !Array.isArray(data?.songResultData?.resultList)) throw new Error('Migu search returned no results');
  return data.songResultData.resultList.flat().map((item: any) => ({
    title: String(item.name || ''), artist: Array.isArray(item.singerList) ? item.singerList.map((s: any) => s.name).join('、') : String(item.singerName || 'Unknown'), duration: Number(item.duration || 0), platform: 'mg' as const,
    musicInfo: { name: item.name, singer: Array.isArray(item.singerList) ? item.singerList.map((s: any) => s.name).join('、') : item.singerName, songmid: item.songId, albumName: item.album, albumId: item.albumId, interval: item.duration },
  })).filter((item: MusicSearchResult) => item.title && item.musicInfo.songmid);
}

async function searchNetease(query: string): Promise<MusicSearchResult[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://music.163.com/api/search/get/web?csrf_token=', {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'TS6-MusicBot/1.0' },
      body: new URLSearchParams({ s: query, type: '1', offset: '0', total: 'true', limit: '10' }),
    });
    if (!response.ok) throw new Error(`NetEase search returned HTTP ${response.status}`);
    const data: any = await response.json();
    if (!Array.isArray(data?.result?.songs)) throw new Error('NetEase search returned no results');
    return data.result.songs.map((item: any) => ({
      title: String(item.name || ''), artist: Array.isArray(item.artists) ? item.artists.map((artist: any) => artist.name).join('、') : 'Unknown', duration: Math.round(Number(item.duration || 0) / 1000), platform: 'wy' as const,
      musicInfo: { name: item.name, singer: Array.isArray(item.artists) ? item.artists.map((artist: any) => artist.name).join('、') : '', songmid: item.id, albumName: item.album?.name || '', albumId: item.album?.id || '', interval: Math.round(Number(item.duration || 0) / 1000) },
    })).filter((item: MusicSearchResult) => item.title && item.musicInfo.songmid);
  } finally { clearTimeout(timer); }
}

function playlistId(url: string, pattern: RegExp): string | null {
  return url.match(pattern)?.[1] || null;
}

async function getNeteasePlaylist(url: string): Promise<MusicPlaylist> {
  const id = playlistId(url, /[#?&]id=(\d+)/i) || playlistId(url, /playlist[\\/]([0-9]+)/i);
  if (!id) throw new Error('网易云歌单链接中未找到歌单 ID');
  const data = await fetchJson(`https://music.163.com/api/v6/playlist/detail?id=${id}&n=1000&s=8`);
  const playlist = data?.playlist;
  if (!playlist) throw new Error('网易云歌单接口未返回歌单信息');
  let rawTracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
  const trackIds = Array.isArray(playlist.trackIds) ? playlist.trackIds.map((item: any) => item.id).filter(Boolean) : [];
  if (trackIds.length > rawTracks.length) {
    const detail = await fetchJson(`https://music.163.com/api/song/detail?ids=${encodeURIComponent(JSON.stringify(trackIds))}`);
    if (Array.isArray(detail?.songs)) rawTracks = detail.songs;
  }
  if (!rawTracks.length) throw new Error('网易云歌单未返回歌曲列表');
  const tracks = rawTracks.map((item: any) => ({
    title: String(item.name || ''),
    artist: Array.isArray(item.ar) ? item.ar.map((artist: any) => artist.name).join('、') : 'Unknown',
    duration: Math.round(Number(item.dt || 0) / 1000),
    platform: 'wy' as const,
    musicInfo: { name: item.name, singer: Array.isArray(item.ar) ? item.ar.map((artist: any) => artist.name).join('、') : '', songmid: item.id, albumName: item.al?.name || '', albumId: item.al?.id || '', interval: Math.round(Number(item.dt || 0) / 1000) },
  })).filter((item: MusicSearchResult) => item.title && item.musicInfo.songmid);
  if (!tracks.length) throw new Error('网易云歌单为空或歌曲列表不可用');
  return { title: String(playlist.name || '网易云歌单'), platform: 'wy', tracks };
}

async function getKuwoPlaylist(url: string): Promise<MusicPlaylist> {
  const id = playlistId(url, /(?:playlist|list)[\\/]?(\d+)/i) || playlistId(url, /[?&](?:pid|id)=(\d+)/i);
  if (!id) throw new Error('酷我歌单链接中未找到歌单 ID');
  const data = await fetchJson(`https://www.kuwo.cn/api/www/playlist/playpage?pid=${id}&pn=1&rn=1000&httpsStatus=1`);
  const raw = data?.data?.musicList || data?.data?.musiclist;
  if (!Array.isArray(raw)) throw new Error('酷我歌单接口未返回完整歌曲列表');
  const tracks = raw.map((item: any) => ({
    title: String(item.name || item.songName || ''),
    artist: String(item.artist || item.artistName || 'Unknown'),
    duration: Number(item.duration || item.songDuration || 0),
    platform: 'kw' as const,
    musicInfo: { name: item.name || item.songName, singer: item.artist || item.artistName, songmid: String(item.rid || item.musicRid || item.id || ''), albumName: item.album || item.albumName || '', albumId: item.albumid || '', interval: item.duration || item.songDuration },
  })).filter((item: MusicSearchResult) => item.title && item.musicInfo.songmid);
  if (!tracks.length) throw new Error('酷我歌单为空或歌曲列表不可用');
  return { title: '酷我歌单', platform: 'kw', tracks };
}

export class MusicSourceService {
  constructor(private prisma: PrismaClient) {}

  async search(query: string): Promise<MusicSearchResult[]> {
    const config = await this.getSettings();
    if (config.preferredPlatform === 'auto') {
      const available = ['kg', 'kw', 'mg', 'wy'].filter((platform) => config.sources.some((source) => source.enabled && source.platforms.some((item) => item.id === platform)));
      let lastError: Error | undefined;
      for (const platform of available) {
        try {
          const result = platform === 'kg' ? await searchKugou(query) : platform === 'kw' ? await searchKuwo(query) : platform === 'mg' ? await searchMigu(query) : await searchNetease(query);
          if (result.length) return result;
        } catch (error: any) { lastError = error; }
      }
      throw lastError || new Error('No enabled music source search provider is available');
    }
    const selectedPlatform = config.preferredPlatform.split(':')[1];
    if (!['kg', 'kw', 'mg', 'wy'].includes(selectedPlatform)) throw new Error('Search is not available for this platform yet. Select 自动、网易云、酷狗、酷我 or 咪咕。');
    if (!config.sources.some((source) => source.enabled && source.platforms.some((platform) => platform.id === selectedPlatform))) throw new Error('No enabled music source supports the selected platform');
    if (selectedPlatform === 'kw') return searchKuwo(query);
    if (selectedPlatform === 'mg') return searchMigu(query);
    if (selectedPlatform === 'wy') return searchNetease(query);
    return searchKugou(query);
  }

  async resolve(result: MusicSearchResult): Promise<string> {
    const config = await this.getSettings();
    let candidates = config.sources.filter((source) => source.enabled && source.platforms.some((platform) => platform.id === result.platform));
    const preferred = config.preferredPlatform;
    if (preferred !== 'auto') {
      const [sourceId, platform] = preferred.split(':');
      candidates = platform === result.platform ? candidates.filter((source) => source.id === sourceId) : [];
    }
    let lastError: Error | undefined;
    for (const source of candidates) {
      try {
        const filePath = path.join(MUSIC_SOURCE_DIR, path.basename(source.fileName));
        if (!fs.existsSync(filePath)) continue;
        return await resolveLxMusicUrl(fs.readFileSync(filePath, 'utf8'), result.platform, result.musicInfo);
      } catch (error: any) { lastError = error; }
    }
    throw lastError || new Error('No enabled music source supports the selected platform');
  }

  async testSource(source: SavedSource): Promise<{ keyword: string; platforms: MusicSourcePlatformTest[] }> {
    const keyword = (process.env.MUSIC_SOURCE_TEST_KEYWORD || 'summer').trim() || 'summer';
    const filePath = path.join(MUSIC_SOURCE_DIR, path.basename(source.fileName));
    const code = fs.readFileSync(filePath, 'utf8');
    const results: MusicSourcePlatformTest[] = [];
    for (const platform of source.platforms) {
      const item: MusicSourcePlatformTest = { id: platform.id, name: platform.name || platform.id, ok: false, searchOk: false, playOk: false };
      try {
        const search = platform.id === 'kg' ? await searchKugou(keyword) : platform.id === 'kw' ? await searchKuwo(keyword) : platform.id === 'mg' ? await searchMigu(keyword) : platform.id === 'wy' ? await searchNetease(keyword) : [];
        if (!search.length) throw new Error('未搜索到歌曲');
        item.searchOk = true;
        const playableUrl = await resolveLxMusicUrl(code, platform.id, search[0].musicInfo);
        const response = await fetch(playableUrl, { method: 'GET', headers: { Range: 'bytes=0-1023', 'User-Agent': 'TS6-MusicBot/1.0' }, signal: AbortSignal.timeout(15_000) });
        if (!response.ok && response.status !== 206) throw new Error(`播放地址返回 HTTP ${response.status}`);
        item.playOk = true;
        item.ok = true;
      } catch (error: any) { item.message = error?.message || '测试失败'; }
      results.push(item);
    }
    return { keyword, platforms: results };
  }

  async playlist(url: string): Promise<MusicPlaylist> {
    const normalized = url.trim();
    if (/music\.163\.com/i.test(normalized)) return getNeteasePlaylist(normalized);
    if (/kuwo\.cn/i.test(normalized)) return getKuwoPlaylist(normalized);
    throw new Error('暂不支持该歌单平台。当前支持网易云歌单和酷我歌单，且无需 Cookie。');
  }

  private async getSettings(): Promise<SavedSettings> {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: MUSIC_SOURCES_KEY } });
    if (!setting) throw new Error('No music source is configured');
    const config = JSON.parse(setting.value) as SavedSettings;
    if (!Array.isArray(config.sources)) throw new Error('Music source configuration is invalid');
    return config;
  }
}
