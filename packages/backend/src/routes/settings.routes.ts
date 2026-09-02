/**
 * Settings routes — app-wide configuration (admin only).
 * Handles app-wide settings such as yt-dlp cookies and music source configuration.
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/error-handler.js';
import { setVideoCookieFile, getVideoCookieFile, type VideoPlatform } from '../voice/audio/video-source.js';
import { parseLxMusicSource, type LxSourcePlatform } from '../voice/music-sources/lx-source-parser.js';
import { testLxMusicSource } from '../voice/music-sources/lx-source-runtime.js';

const settingsRoutes: Router = Router();

// Cookie file stored in the backend data directory (persisted in Docker volume)
const COOKIE_DIR = path.resolve('data');
const VIDEO_PLATFORMS: VideoPlatform[] = ['youtube', 'bilibili', 'twitch'];
const COOKIE_PATHS: Record<VideoPlatform, string> = {
  youtube: path.join(COOKIE_DIR, 'youtube-cookies.txt'),
  bilibili: path.join(COOKIE_DIR, 'bilibili-cookies.txt'),
  twitch: path.join(COOKIE_DIR, 'twitch-cookies.txt'),
};
const LEGACY_COOKIE_PATH = path.join(COOKIE_DIR, 'video-cookies.txt');
const MUSIC_SOURCES_KEY = 'music.sources';
const MUSIC_SOURCE_DIR = path.join(COOKIE_DIR, 'music-sources');

type MusicSourceConfig = {
  id: string;
  name: string;
  enabled: boolean;
  fileName: string;
  platforms: LxSourcePlatform[];
  createdAt: string;
};

type MusicSourceSettings = { sources: MusicSourceConfig[]; preferredPlatform: string };
const DEFAULT_MUSIC_SOURCE_SETTINGS: MusicSourceSettings = { sources: [], preferredPlatform: 'auto' };

function defaultMusicSourceSettings(): MusicSourceSettings {
  return { sources: [], preferredPlatform: DEFAULT_MUSIC_SOURCE_SETTINGS.preferredPlatform };
}

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  storage: multer.memoryStorage(),
});
const sourceUpload = multer({ limits: { fileSize: 512 * 1024 }, storage: multer.memoryStorage() });

// Admin-only guard
function requireAdmin(req: Request, _res: Response, next: Function) {
  if ((req as any).user?.role !== 'admin') {
    return next(new AppError(403, 'Admin access required'));
  }
  next();
}

async function getMusicSourceSettings(req: Request): Promise<MusicSourceSettings> {
  const prisma = req.app.locals.prisma;
  const setting = await prisma.appSetting.findUnique({ where: { key: MUSIC_SOURCES_KEY } });
  if (!setting) return defaultMusicSourceSettings();
  try {
    const parsed = JSON.parse(setting.value);
    if (!Array.isArray(parsed?.sources)) return defaultMusicSourceSettings();
    return { sources: parsed.sources, preferredPlatform: typeof parsed.preferredPlatform === 'string' ? parsed.preferredPlatform : 'auto' };
  } catch { return defaultMusicSourceSettings(); }
}

async function saveMusicSourceSettings(req: Request, settings: MusicSourceSettings): Promise<void> {
  await req.app.locals.prisma.appSetting.upsert({
    where: { key: MUSIC_SOURCES_KEY },
    create: { key: MUSIC_SOURCES_KEY, value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
}

settingsRoutes.get('/music-sources', requireAdmin, async (req: Request, res: Response, next) => {
  try { res.json(await getMusicSourceSettings(req)); } catch (err) { next(err); }
});

settingsRoutes.post('/music-sources', requireAdmin, sourceUpload.single('source'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file || !req.file.originalname.toLowerCase().endsWith('.js')) throw new AppError(400, 'Upload a .js music source file');
    const code = req.file.buffer.toString('utf8');
    const fallbackName = path.basename(req.file.originalname, '.js').slice(0, 80);
    const parsed = parseLxMusicSource(code, fallbackName);
    const settings = await getMusicSourceSettings(req);
    if (settings.sources.length >= 20) throw new AppError(400, 'At most 20 music sources are allowed');
    const id = randomUUID();
    const fileName = `${id}.js`;
    fs.mkdirSync(MUSIC_SOURCE_DIR, { recursive: true });
    fs.writeFileSync(path.join(MUSIC_SOURCE_DIR, fileName), code, { mode: 0o600 });
    const source: MusicSourceConfig = { id, name: parsed.name, enabled: true, fileName, platforms: parsed.platforms, createdAt: new Date().toISOString() };
    settings.sources.push(source);
    await saveMusicSourceSettings(req, settings);
    res.status(201).json(source);
  } catch (err) { next(err); }
});

settingsRoutes.patch('/music-sources/:id', requireAdmin, async (req: Request, res: Response, next) => {
  try {
    const settings = await getMusicSourceSettings(req);
    const source = settings.sources.find((item) => item.id === req.params.id);
    if (!source) throw new AppError(404, 'Music source not found');
    if (typeof req.body?.enabled === 'boolean') source.enabled = req.body.enabled;
    await saveMusicSourceSettings(req, settings);
    res.json(source);
  } catch (err) { next(err); }
});

settingsRoutes.post('/music-sources/:id/test', requireAdmin, async (req: Request, res: Response, next) => {
  try {
    const settings = await getMusicSourceSettings(req);
    const source = settings.sources.find((item) => item.id === req.params.id);
    if (!source) throw new AppError(404, 'Music source not found');
    const filePath = path.join(MUSIC_SOURCE_DIR, path.basename(source.fileName));
    if (!fs.existsSync(filePath)) throw new AppError(404, 'Music source script file not found');
    const result = await testLxMusicSource(fs.readFileSync(filePath, 'utf8'));
    res.json(result);
  } catch (err) { next(err); }
});

settingsRoutes.put('/music-sources/order', requireAdmin, async (req: Request, res: Response, next) => {
  try {
    if (!Array.isArray(req.body?.ids)) throw new AppError(400, 'ids must be an array');
    const settings = await getMusicSourceSettings(req);
    const ids = req.body.ids.map(String);
    if (ids.length !== settings.sources.length || new Set(ids).size !== ids.length || !settings.sources.every((source) => ids.includes(source.id))) throw new AppError(400, 'ids must contain every music source exactly once');
    settings.sources.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    await saveMusicSourceSettings(req, settings);
    res.json(settings);
  } catch (err) { next(err); }
});

settingsRoutes.put('/music-sources/preference', requireAdmin, async (req: Request, res: Response, next) => {
  try {
    const settings = await getMusicSourceSettings(req);
    const preferredPlatform = String(req.body?.preferredPlatform || 'auto');
    const allowed = settings.sources.flatMap((source) => source.platforms.map((platform) => `${source.id}:${platform.id}`));
    if (preferredPlatform !== 'auto' && !allowed.includes(preferredPlatform)) throw new AppError(400, 'Unknown music source platform');
    settings.preferredPlatform = preferredPlatform;
    await saveMusicSourceSettings(req, settings);
    res.json(settings);
  } catch (err) { next(err); }
});

settingsRoutes.delete('/music-sources/:id', requireAdmin, async (req: Request, res: Response, next) => {
  try {
    const settings = await getMusicSourceSettings(req);
    const index = settings.sources.findIndex((source) => source.id === req.params.id);
    if (index < 0) throw new AppError(404, 'Music source not found');
    const [source] = settings.sources.splice(index, 1);
    const filePath = path.join(MUSIC_SOURCE_DIR, source.fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (settings.preferredPlatform.startsWith(`${source.id}:`)) settings.preferredPlatform = 'auto';
    await saveMusicSourceSettings(req, settings);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/settings/video-cookies — Check cookie file status
settingsRoutes.get('/video-cookies', requireAdmin, (req: Request, res: Response) => {
  const platform = String(req.query.platform || 'youtube') as VideoPlatform;
  if (!VIDEO_PLATFORMS.includes(platform)) throw new AppError(400, 'Unknown video platform');
  const cookiePath = COOKIE_PATHS[platform];
  const legacyPath = platform === 'youtube' ? LEGACY_COOKIE_PATH : null;
  const storedPath = fs.existsSync(cookiePath) ? cookiePath : legacyPath && fs.existsSync(legacyPath) ? legacyPath : cookiePath;
  const exists = fs.existsSync(storedPath);
  const activePath = getVideoCookieFile(platform);
  res.json({
    platform,
    active: exists && !!activePath,
    exists,
    size: exists ? fs.statSync(storedPath).size : 0,
    path: activePath,
  });
});

// POST /api/settings/video-cookies — Upload cookie file
settingsRoutes.post('/video-cookies', requireAdmin, upload.single('cookies'), (req: Request, res: Response, next) => {
  try {
    const platform = String(req.body?.platform || req.query.platform || 'youtube') as VideoPlatform;
    if (!VIDEO_PLATFORMS.includes(platform)) throw new AppError(400, 'Unknown video platform');
    const cookiePath = COOKIE_PATHS[platform];
    if (!req.file) {
      // Check if raw text was sent in body
      const text = req.body?.text;
      if (!text || typeof text !== 'string') {
        throw new AppError(400, 'No cookie file or text provided');
      }
      fs.mkdirSync(COOKIE_DIR, { recursive: true });
      fs.writeFileSync(cookiePath, text, 'utf-8');
    } else {
      fs.mkdirSync(COOKIE_DIR, { recursive: true });
      fs.writeFileSync(cookiePath, req.file.buffer);
    }

    setVideoCookieFile(platform, cookiePath);
    const size = fs.statSync(cookiePath).size;
    console.log(`[yt-dlp] Cookie file uploaded (${size} bytes)`);
    res.json({ success: true, size });
  } catch (err) { next(err); }
});

// DELETE /api/settings/video-cookies — Remove cookie file
settingsRoutes.delete('/video-cookies', requireAdmin, (req: Request, res: Response, next) => {
  try {
    const platform = String(req.query.platform || 'youtube') as VideoPlatform;
    if (!VIDEO_PLATFORMS.includes(platform)) throw new AppError(400, 'Unknown video platform');
    const cookiePath = COOKIE_PATHS[platform];
    if (fs.existsSync(cookiePath)) {
      fs.unlinkSync(cookiePath);
    }
    setVideoCookieFile(platform, null);
    console.log('[yt-dlp] Cookie file removed');
    res.json({ success: true });
  } catch (err) { next(err); }
});

export { settingsRoutes };
