import type { PrismaClient } from '../../generated/prisma/index.js';
import { VoiceBotManager } from './voice-bot-manager.js';
import type { VoiceBot } from './voice-bot.js';
import type { QueueItem } from './playlist/queue.js';
import { downloadYouTube, downloadBilibili } from './audio/youtube.js';
import { MusicSourceService } from './music-sources/music-source-service.js';
import { config } from '../config.js';

const MUSIC_DIR = config.musicDir;
const CMD_PREFIX = '!';

const MUSIC_COMMANDS = new Set([
  'radio', 'play', 'bv', 'playlist', 'stop', 'pause', 'skip', 'next', 'prev',
  'vol', 'volume', 'np', 'nowplaying', 'queue', 'add',
  'stream', 'stopstream', 'viewers',
]);

/**
 * Handles text-based music commands (!radio, !play, !stop, etc.)
 * by listening directly on each VoiceBot's TS3 connection.
 *
 * The bot receives `notifytextmessage` in its own channel —
 * no SSH EventBridge needed.
 */
export class MusicCommandHandler {
  private registeredBots = new Set<number>();

  constructor(
    private prisma: PrismaClient,
    private voiceBotManager: VoiceBotManager,
  ) {}

  /**
   * Register text message listener on a VoiceBot instance.
   * Called by VoiceBotManager whenever a bot is created/started.
   */
  registerBot(botId: number, bot: VoiceBot): void {
    if (this.registeredBots.has(botId)) return;
    this.registeredBots.add(botId);

    bot.on('textMessage', (data: Record<string, string>) => {
      this.onTextMessage(botId, bot, data).catch(err => {
        console.error(`[MusicCmd] Error processing text message on bot ${botId}: ${err.message}`);
      });
    });

    console.log(`[MusicCmd] Registered text command listener on bot ${botId}`);
  }

  unregisterBot(botId: number): void {
    this.registeredBots.delete(botId);
  }

  private async onTextMessage(botId: number, bot: VoiceBot, data: Record<string, string>): Promise<void> {
    const msg = (data.msg || '').trim();
    if (!msg.startsWith(CMD_PREFIX)) return;

    const parts = msg.substring(CMD_PREFIX.length).split(/\s+/);
    const command = parts[0].toLowerCase();
    if (!MUSIC_COMMANDS.has(command)) return;

    const args = parts.slice(1).join(' ').trim();
    const userClid = parseInt(data.invokerid || '0');
    if (!userClid) return;

    // Ignore messages from ourselves (the bot)
    if (userClid === bot.ts3ClientId) return;

    console.log(`[MusicCmd] Bot ${botId}: !${command} ${args} (from clid=${userClid})`);

    try {
      switch (command) {
        case 'radio':
          await this.handleRadio(botId, bot, userClid, args);
          break;
        case 'play':
          await this.handlePlay(botId, bot, userClid, args);
          break;
        case 'bv':
          await this.handleBilibili(bot, userClid, args);
          break;
        case 'playlist':
          await this.handlePlaylist(bot, userClid, args);
          break;
        case 'stop':
          this.handleStop(bot, userClid);
          break;
        case 'pause':
          this.handlePause(bot, userClid);
          break;
        case 'skip':
        case 'next':
          await this.handleSkip(bot, userClid);
          break;
        case 'prev':
          await this.handlePrev(bot, userClid);
          break;
        case 'vol':
        case 'volume':
          this.handleVolume(bot, userClid, args);
          break;
        case 'np':
        case 'nowplaying':
          this.handleNowPlaying(bot, userClid);
          break;
        case 'queue':
        case 'add':
          await this.handleQueue(bot, userClid, args);
          break;
        case 'stream':
          await this.handleStream(bot, userClid, args);
          break;
        case 'stopstream':
          await this.handleStopStream(bot, userClid);
          break;
        case 'viewers':
          this.handleViewers(bot, userClid);
          break;
      }
    } catch (err: any) {
      console.error(`[MusicCmd] Error handling !${command}: ${err.message}`);
      this.reply(bot, userClid, `Error: ${err.message}`);
    }
  }

  private reply(bot: VoiceBot, targetClid: number, msg: string): void {
    try {
      bot.sendTextMessage(targetClid, msg);
    } catch (err: any) {
      console.error(`[MusicCmd] Failed to send reply: ${err.message}`);
    }
  }

  // ─── Command Handlers ───────────────────────────────────────

  private async handleRadio(botId: number, bot: VoiceBot, userClid: number, args: string): Promise<void> {
    // Get serverConfigId for this bot from DB
    const dbBot = await this.prisma.musicBot.findUnique({ where: { id: botId }, select: { serverConfigId: true } });
    if (!dbBot) {
      this.reply(bot, userClid, 'Bot config not found.');
      return;
    }

    const stations = await this.prisma.radioStation.findMany({
      where: { serverConfigId: dbBot.serverConfigId },
      orderBy: { name: 'asc' },
    });

    if (stations.length === 0) {
      this.reply(bot, userClid, 'No radio stations configured.');
      return;
    }

    // No argument — list stations
    if (!args) {
      const lines = stations.map((s: any) => `[${s.id}] ${s.name}${s.genre ? ` (${s.genre})` : ''}`);
      this.reply(bot, userClid, 'Radio Stations:\n' + lines.join('\n'));
      return;
    }

    // Argument — play station by ID
    const stationId = parseInt(args);
    if (isNaN(stationId)) {
      this.reply(bot, userClid, 'Usage: !radio <id> — Use !radio to list stations.');
      return;
    }

    const station = stations.find((s: any) => s.id === stationId);
    if (!station) {
      this.reply(bot, userClid, `Station #${stationId} not found. Use !radio to list stations.`);
      return;
    }

    const queueItem: QueueItem = {
      id: `radio_${station.id}`,
      title: station.name,
      artist: station.genre ?? 'Radio',
      filePath: '',
      source: 'radio',
      streamUrl: station.url,
    };

    await bot.playStream(queueItem);
    this.reply(bot, userClid, `Now playing: ${station.name}`);
  }

  private async handlePlay(botId: number, bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args) {
      if (bot.status === 'paused') {
        bot.resume();
        this.reply(bot, userClid, 'Resumed.');
        return;
      }
      this.reply(bot, userClid, 'Usage: !play <song name or URL>');
      return;
    }

    if (args.startsWith('http://') || args.startsWith('https://')) {
      this.reply(bot, userClid, 'Use !bv <Bilibili BV link> for video links. !play is for music search.');
      return;
    }

    this.reply(bot, userClid, 'Loading...');

    try {
      if (!args.startsWith('http://') && !args.startsWith('https://')) {
        const sourceService = new MusicSourceService(this.prisma);
        const results = await sourceService.search(args);
        const song = results[0];
        if (!song) throw new Error('No matching song found');
        const streamUrl = await sourceService.resolve(song);
        const { filePath } = await downloadYouTube(streamUrl, MUSIC_DIR);
        const queueItem: QueueItem = {
          id: `source_${botId}_${Date.now()}`,
          title: song.title,
          artist: song.artist,
          duration: song.duration || undefined,
          filePath,
          source: 'music-source',
          sourceUrl: streamUrl,
        };
        await this.enqueueOrPlay(bot, userClid, queueItem);
        return;
      }

      throw new Error('Use !bv <Bilibili BV link> for video links.');
    } catch (err: any) {
      this.reply(bot, userClid, `Failed to play: ${err.message}`);
    }
  }

  private async handleBilibili(bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args) {
      this.reply(bot, userClid, 'Usage: !bv <Bilibili BV link>');
      return;
    }
    this.reply(bot, userClid, 'Loading Bilibili audio...');
    try {
      const { filePath, info } = await downloadBilibili(args, MUSIC_DIR);
      await this.enqueueOrPlay(bot, userClid, { id: `bv_${info.id}`, title: info.title, artist: info.artist, duration: info.duration, filePath, source: 'bilibili', sourceUrl: args });
    } catch (err: any) {
      this.reply(bot, userClid, `Failed to play Bilibili link: ${err.message}`);
    }
  }

  private async handlePlaylist(bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args || !/^https?:\/\//i.test(args)) {
      this.reply(bot, userClid, 'Usage: !playlist <网易云或酷我歌单链接>');
      return;
    }
    this.reply(bot, userClid, '正在解析歌单，请稍候...');
    try {
      const service = new MusicSourceService(this.prisma);
      const playlist = await service.playlist(args);
      const downloadSong = async (index: number): Promise<QueueItem> => {
        const song = playlist.tracks[index];
        const streamUrl = await service.resolve(song);
        const { filePath } = await downloadYouTube(streamUrl, MUSIC_DIR);
        return { id: `playlist_${Date.now()}_${index}`, title: song.title, artist: song.artist, duration: song.duration || undefined, filePath, source: 'music-source', sourceUrl: streamUrl };
      };
      const preloadCount = Math.min(4, playlist.tracks.length);
      // Prepare only the first track plus three look-ahead tracks before starting.
      const firstResults = await Promise.allSettled(Array.from({ length: preloadCount }, (_, index) => downloadSong(index)));
      const firstBatch = firstResults.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      if (!firstBatch.length) throw new Error('歌单前几首歌曲均无法获取音频');
      const firstSkipped = firstResults.length - firstBatch.length;
      bot.queue.clear();
      bot.queue.addMany(firstBatch);
      bot.queue.playAt(0);
      await bot.play(firstBatch[0]);
      this.reply(bot, userClid, `已开始播放歌单「${playlist.title}」，已预载 ${firstBatch.length - 1} 首，共 ${playlist.tracks.length} 首${firstSkipped ? `，已跳过 ${firstSkipped} 首不可用歌曲` : ''}`);

      // Continue filling the queue in order while playback is running.
      void (async () => {
        try {
          for (let start = preloadCount; start < playlist.tracks.length; start += 3) {
            const results = await Promise.allSettled(
              Array.from({ length: Math.min(3, playlist.tracks.length - start) }, (_, offset) => downloadSong(start + offset)),
            );
            const batch = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
            bot.queue.addMany(batch);
            const skipped = results.length - batch.length;
            if (skipped) this.reply(bot, userClid, `歌单预载：跳过 ${skipped} 首无法获取音频的歌曲，继续播放后续歌曲`);
          }
        } catch (error: any) {
          console.error(`[MusicCmd] Playlist background preload failed: ${error.message}`);
          this.reply(bot, userClid, `歌单后续歌曲预载失败：${error.message}`);
        }
      })();
    } catch (err: any) {
      this.reply(bot, userClid, `歌单播放失败：${err.message}`);
    }
  }

  private async enqueueOrPlay(bot: VoiceBot, userClid: number, queueItem: QueueItem): Promise<void> {
    bot.queue.add(queueItem);
    this.saveMusicRequest(bot, queueItem);
    if (bot.status === 'playing' || bot.status === 'paused') {
      this.reply(bot, userClid, `Queued: ${queueItem.artist ? `${queueItem.artist} - ` : ''}${queueItem.title} (position #${bot.queue.length})`);
    } else {
      bot.queue.playAt(bot.queue.length - 1);
      await bot.play(queueItem);
      this.reply(bot, userClid, `Now playing: ${queueItem.artist ? `${queueItem.artist} - ` : ''}${queueItem.title}`);
    }
  }

  private showQueue(bot: VoiceBot, userClid: number): void {
    const items = bot.queue.getAll();
    if (items.length === 0) {
      this.reply(bot, userClid, 'Queue is empty.');
      return;
    }

    const currentIdx = bot.queue.index;
    const lines = items.slice(0, 15).map((item, i) => {
      const marker = i === currentIdx ? '▶ ' : '  ';
      const artist = item.artist ? `${item.artist} - ` : '';
      const dur = item.duration ? ` [${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, '0')}]` : '';
      return `${marker}${i + 1}. ${artist}${item.title}${dur}`;
    });
    if (items.length > 15) lines.push(`  ... and ${items.length - 15} more`);
    this.reply(bot, userClid, `Queue (${items.length} tracks):\n${lines.join('\n')}`);
  }

  private async handleQueue(bot: VoiceBot, userClid: number, args: string): Promise<void> {
    // No args or "show" — display current queue
    if (!args || args.toLowerCase() === 'show') {
      this.showQueue(bot, userClid);
      return;
    }

    // !queue remove <index>
    if (args.toLowerCase().startsWith('remove ')) {
      const idx = parseInt(args.substring(7).trim()) - 1; // 1-based to 0-based
      const items = bot.queue.getAll();
      if (isNaN(idx) || idx < 0 || idx >= items.length) {
        this.reply(bot, userClid, `Invalid index. Queue has ${items.length} tracks.`);
        return;
      }
      const removed = items[idx];
      bot.queue.remove(removed.id);
      this.reply(bot, userClid, `Removed #${idx + 1}: ${removed.title}`);
      return;
    }

    // !queue play <index>
    if (args.toLowerCase().startsWith('play ')) {
      const idx = parseInt(args.substring(5).trim()) - 1; // 1-based to 0-based
      const item = bot.queue.playAt(idx);
      if (!item) {
        this.reply(bot, userClid, `Invalid index. Queue has ${bot.queue.length} tracks.`);
        return;
      }
      if (item.streamUrl) {
        await bot.playStream(item);
      } else {
        await bot.play(item);
      }
      this.reply(bot, userClid, `Playing #${idx + 1}: ${item.title}`);
      return;
    }

    // !queue clear
    if (args.toLowerCase() === 'clear') {
      bot.queue.clear();
      this.reply(bot, userClid, 'Queue cleared.');
      return;
    }

    // Bilibili URL provided — add to queue without interrupting
    if (!args.startsWith('http://') && !args.startsWith('https://')) {
      this.reply(bot, userClid, 'Usage: !queue [show|play <n>|remove <n>|clear|<Bilibili url>]');
      return;
    }

    this.reply(bot, userClid, 'Loading...');

    try {
      const { filePath, info } = await downloadBilibili(args, MUSIC_DIR);

      const queueItem: QueueItem = {
        id: `bv_${info.id}`,
        title: info.title,
        artist: info.artist,
        duration: info.duration,
        filePath,
        source: 'bilibili',
        sourceUrl: args,
      };

      bot.queue.add(queueItem);

      // Save to MusicRequest history
      this.saveMusicRequest(bot, queueItem);

      // If nothing is playing, start playing the queued item
      if (bot.status !== 'playing' && bot.status !== 'paused') {
        bot.queue.playAt(bot.queue.length - 1);
        await bot.play(queueItem);
        this.reply(bot, userClid, `Now playing: ${info.artist} - ${info.title}`);
      } else {
        this.reply(bot, userClid, `Queued: ${info.artist} - ${info.title} (position #${bot.queue.length})`);
      }
    } catch (err: any) {
      this.reply(bot, userClid, `Failed to queue: ${err.message}`);
    }
  }

  private handleStop(bot: VoiceBot, userClid: number): void {
    bot.stopAudio();
    this.reply(bot, userClid, 'Playback stopped.');
  }

  private handlePause(bot: VoiceBot, userClid: number): void {
    if (bot.status === 'paused') {
      bot.resume();
      this.reply(bot, userClid, 'Resumed.');
    } else if (bot.status === 'playing') {
      bot.pause();
      this.reply(bot, userClid, 'Paused.');
    } else {
      this.reply(bot, userClid, 'Nothing is playing.');
    }
  }

  private async handleSkip(bot: VoiceBot, userClid: number): Promise<void> {
    const next = bot.queue.next();
    if (next) {
      if (next.streamUrl) {
        await bot.playStream(next);
      } else {
        await bot.play(next);
      }
      this.reply(bot, userClid, `Skipped to: ${next.title}`);
    } else {
      bot.stopAudio();
      this.reply(bot, userClid, 'Queue empty — playback stopped.');
    }
  }

  private async handlePrev(bot: VoiceBot, userClid: number): Promise<void> {
    const prev = bot.queue.previous();
    if (prev) {
      if (prev.streamUrl) {
        await bot.playStream(prev);
      } else {
        await bot.play(prev);
      }
      this.reply(bot, userClid, `Previous: ${prev.title}`);
    } else {
      this.reply(bot, userClid, 'No previous track.');
    }
  }

  private handleVolume(bot: VoiceBot, userClid: number, args: string): void {
    if (!args) {
      const vol = bot.currentConfig.volume;
      this.reply(bot, userClid, `Volume: ${vol}%`);
      return;
    }

    const vol = parseInt(args);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      this.reply(bot, userClid, 'Usage: !vol <0-100>');
      return;
    }

    bot.setVolume(vol);
    this.reply(bot, userClid, `Volume set to ${vol}%.`);
  }

  private handleNowPlaying(bot: VoiceBot, userClid: number): void {
    const np = bot.nowPlaying;
    if (!np) {
      this.reply(bot, userClid, 'Nothing is playing.');
      return;
    }

    const artist = np.artist ? `${np.artist} - ` : '';
    this.reply(bot, userClid, `Now playing: ${artist}${np.title}`);
  }

  // ─── Video Streaming Commands ─────────────────────────────

  private async handleStream(bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args) {
      this.reply(bot, userClid, 'Usage: !stream <url> [preset]  — Presets: 480p, 720p, 1080p');
      return;
    }

    const parts = args.split(/\s+/);
    const url = parts[0];
    const preset = parts[1] || undefined;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.reply(bot, userClid, 'Please provide a valid URL.');
      return;
    }

    if (bot.videoStreaming) {
      // Change source if already streaming
      try {
        await bot.setVideoSource(url);
        this.reply(bot, userClid, `Stream source changed to: ${url}`);
      } catch (err: any) {
        this.reply(bot, userClid, `Error: ${err.message}`);
      }
      return;
    }

    this.reply(bot, userClid, 'Starting video stream...');
    try {
      await bot.startVideoStream(url, preset);
      this.reply(bot, userClid, `Video stream started: ${url}`);
    } catch (err: any) {
      this.reply(bot, userClid, `Failed to start stream: ${err.message}`);
    }
  }

  private async handleStopStream(bot: VoiceBot, userClid: number): Promise<void> {
    if (!bot.videoStreaming) {
      this.reply(bot, userClid, 'No active video stream.');
      return;
    }
    await bot.stopVideoStream();
    this.reply(bot, userClid, 'Video stream stopped.');
  }

  private handleViewers(bot: VoiceBot, userClid: number): void {
    const status = bot.videoStreamStatus;
    if (!status.streaming) {
      this.reply(bot, userClid, 'No active video stream.');
      return;
    }
    if (status.viewers.length === 0) {
      this.reply(bot, userClid, 'No viewers connected.');
      return;
    }
    const lines = status.viewers.map((v) => {
      const duration = Math.floor((Date.now() - v.joinedAt) / 1000);
      return `  clid=${v.clid} (${duration}s)`;
    });
    this.reply(bot, userClid, `Viewers (${status.viewerCount}):\n${lines.join('\n')}`);
  }

  private saveMusicRequest(bot: VoiceBot, item: QueueItem): void {
    if (!item.sourceUrl || !bot.currentConfig.serverConfigId) return;
    this.prisma.musicRequest.upsert({
      where: {
        serverConfigId_url: {
          serverConfigId: bot.currentConfig.serverConfigId,
          url: item.sourceUrl,
        },
      },
      update: {
        requestedAt: new Date(),
        title: item.title || 'Unknown Title',
      },
      create: {
        serverConfigId: bot.currentConfig.serverConfigId,
        url: item.sourceUrl,
        title: item.title || 'Unknown Title',
        requestedAt: new Date(),
      },
    }).catch((err) => {
      console.error('[MusicCmd] Failed to save music request history:', err.message);
    });
  }
}
