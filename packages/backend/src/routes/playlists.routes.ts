import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/rbac.js';
import { AppError } from '../middleware/error-handler.js';
import { config } from '../config.js';
import { downloadVideo } from '../voice/audio/video-source.js';
import { MusicSourceService } from '../voice/music-sources/music-source-service.js';

export const playlistRoutes: Router = Router();

playlistRoutes.use(requireRole('admin'));

type ImportFailure = { title: string; reason: string };

async function runPlaylistImport(prisma: any, playlistId: number, url: string, serverConfigId: number): Promise<void> {
  const failures: ImportFailure[] = [];
  try {
    const service = new MusicSourceService(prisma);
    const external = await service.playlist(url);
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { name: external.title, platform: external.platform, importTotal: external.tracks.length },
    });

    let importedCount = 0;
    for (const track of external.tracks) {
      try {
        const streamUrl = await service.resolve(track, true);
        const downloaded = await downloadVideo(streamUrl, config.musicDir);
        const song = await prisma.song.create({
          data: {
            title: track.title, artist: track.artist || null,
            duration: track.duration || downloaded.info.duration || null,
            filePath: downloaded.filePath, source: 'music-source', sourceUrl: streamUrl,
            fileSize: null, serverConfigId,
            musicMetadata: JSON.stringify(track),
          },
        });
        await prisma.playlistSong.create({ data: { playlistId, songId: song.id, position: importedCount } });
        importedCount += 1;
      } catch (error: any) {
        const reason = String(error?.message || error || '未知错误').replace(/\s+/g, ' ').trim();
        failures.push({ title: track.title, reason });
        console.warn(`[PlaylistImport] Skipped ${track.title}: ${reason}`);
      }
      await prisma.playlist.update({
        where: { id: playlistId },
        data: { importCompleted: { increment: 1 }, importSkipped: failures.length, importFailures: JSON.stringify(failures) },
      });
    }
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { importStatus: importedCount ? 'completed' : 'failed', importError: importedCount ? null : '没有可播放歌曲' },
    });
  } catch (error: any) {
    const reason = String(error?.message || error || '未知错误').replace(/\s+/g, ' ').trim();
    console.error(`[PlaylistImport] Playlist ${playlistId} failed: ${reason}`);
    await prisma.playlist.update({
      where: { id: playlistId },
      data: { importStatus: 'failed', importError: reason, importFailures: JSON.stringify(failures) },
    }).catch((updateError: any) => console.error(`[PlaylistImport] Failed to save error: ${updateError.message}`));
  }
}

// GET / — List playlists
playlistRoutes.get('/', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const musicBotId = req.query.musicBotId ? parseInt(String(req.query.musicBotId)) : undefined;
    const playlists = await prisma.playlist.findMany({
      where: musicBotId ? { musicBotId } : undefined,
      include: { _count: { select: { songs: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(playlists.map((p: any) => ({
      id: p.id,
      name: p.name,
      platform: p.platform,
      sourceUrl: p.sourceUrl,
      importStatus: p.importStatus,
      importTotal: p.importTotal,
      importCompleted: p.importCompleted,
      importSkipped: p.importSkipped,
      importError: p.importError,
      importFailures: p.importFailures ? JSON.parse(p.importFailures) : [],
      musicBotId: p.musicBotId,
      songCount: p._count.songs,
      createdAt: p.createdAt,
    })));
  } catch (err) { next(err); }
});

// GET /:id — Get playlist with songs
playlistRoutes.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const id = parseInt(req.params.id as string);
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        songs: {
          include: { song: true },
          orderBy: { position: 'asc' },
        },
      },
    });
    if (!playlist) throw new AppError(404, 'Playlist not found');

    res.json({
      id: playlist.id,
      name: playlist.name,
      platform: playlist.platform,
      sourceUrl: playlist.sourceUrl,
      importStatus: playlist.importStatus,
      importTotal: playlist.importTotal,
      importCompleted: playlist.importCompleted,
      importSkipped: playlist.importSkipped,
      importError: playlist.importError,
      importFailures: playlist.importFailures ? JSON.parse(playlist.importFailures) : [],
      musicBotId: playlist.musicBotId,
      songCount: playlist.songs.length,
      createdAt: playlist.createdAt,
      songs: playlist.songs.map((ps: any) => ({
        id: ps.song.id,
        title: ps.song.title,
        artist: ps.song.artist,
        duration: ps.song.duration,
        source: ps.song.source,
        sourceUrl: ps.song.sourceUrl,
        fileSize: ps.song.fileSize,
        createdAt: ps.song.createdAt,
        position: ps.position,
      })),
    });
  } catch (err) { next(err); }
});

// POST /import — Resolve and persist an external music playlist
playlistRoutes.post('/import', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const url = String(req.body?.url || '').trim();
    const serverConfigId = Number(req.body?.serverConfigId);
    const musicBotId = req.body?.musicBotId ? Number(req.body.musicBotId) : null;
    if (!/^https?:\/\//i.test(url)) throw new AppError(400, 'A playlist URL is required');
    if (!Number.isInteger(serverConfigId) || serverConfigId <= 0) {
      throw new AppError(400, 'serverConfigId is required');
    }
    const server = await prisma.tsServerConfig.findUnique({ where: { id: serverConfigId }, select: { id: true } });
    if (!server) throw new AppError(404, 'Server configuration not found');
    if (musicBotId) {
      const bot = await prisma.musicBot.findUnique({ where: { id: musicBotId }, select: { id: true } });
      if (!bot) throw new AppError(404, 'Music bot not found');
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: '导入中的歌单', sourceUrl: url, musicBotId, importStatus: 'importing',
        importTotal: 0, importCompleted: 0, importSkipped: 0,
      },
    });
    void runPlaylistImport(prisma, playlist.id, url, serverConfigId);
    res.status(202).json({ id: playlist.id, name: playlist.name, importStatus: playlist.importStatus });
  } catch (err) { next(err); }
});

// POST / — Create playlist
playlistRoutes.post('/', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const { name, musicBotId } = req.body;
    if (!name) throw new AppError(400, 'name is required');

    const playlist = await prisma.playlist.create({
      data: {
        name,
        musicBotId: musicBotId ? parseInt(musicBotId) : null,
      },
    });

    res.status(201).json({ id: playlist.id, name: playlist.name });
  } catch (err) { next(err); }
});

// PUT /:id — Update playlist
playlistRoutes.put('/:id', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const id = parseInt(req.params.id as string);
    const { name, musicBotId } = req.body;

    await prisma.playlist.update({
      where: { id },
      data: {
        ...(name != null && { name }),
        ...(musicBotId !== undefined && { musicBotId: musicBotId ? parseInt(musicBotId) : null }),
      },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /:id — Delete playlist
playlistRoutes.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    await prisma.playlist.delete({ where: { id: parseInt(req.params.id as string) } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /:id/songs — Add song to playlist
playlistRoutes.post('/:id/songs', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const playlistId = parseInt(req.params.id as string);
    const { songId } = req.body;
    if (!songId) throw new AppError(400, 'songId is required');

    // Get next position
    const maxPos = await prisma.playlistSong.aggregate({
      where: { playlistId },
      _max: { position: true },
    });
    const nextPosition = (maxPos._max.position ?? -1) + 1;

    await prisma.playlistSong.create({
      data: {
        playlistId,
        songId: parseInt(songId),
        position: nextPosition,
      },
    });

    res.status(201).json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /:id/songs/:songId — Remove song from playlist
playlistRoutes.delete('/:id/songs/:songId', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const playlistId = parseInt(req.params.id as string);
    const songId = parseInt(req.params.songId as string);

    await prisma.playlistSong.deleteMany({
      where: { playlistId, songId },
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

// PUT /:id/songs/reorder — Reorder songs
playlistRoutes.put('/:id/songs/reorder', async (req: Request, res: Response, next) => {
  try {
    const prisma = req.app.locals.prisma;
    const playlistId = parseInt(req.params.id as string);
    const { songIds } = req.body;
    if (!Array.isArray(songIds)) throw new AppError(400, 'songIds array is required');

    // Update positions in a transaction
    await prisma.$transaction(
      songIds.map((songId: number, index: number) =>
        prisma.playlistSong.updateMany({
          where: { playlistId, songId },
          data: { position: index },
        })
      )
    );

    res.json({ success: true });
  } catch (err) { next(err); }
});
