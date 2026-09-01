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
      this.reply(bot, userClid, `错误：${err.message}`);
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
      this.reply(bot, userClid, '未找到机器人配置。');
      return;
    }

    const stations = await this.prisma.radioStation.findMany({
      where: { serverConfigId: dbBot.serverConfigId },
      orderBy: { name: 'asc' },
    });

    if (stations.length === 0) {
      this.reply(bot, userClid, '尚未配置电台。');
      return;
    }

    // No argument — list stations
    if (!args) {
      const lines = stations.map((s: any) => `[${s.id}] ${s.name}${s.genre ? ` (${s.genre})` : ''}`);
      this.reply(bot, userClid, '电台列表：\n' + lines.join('\n'));
      return;
    }

    // Argument — play station by ID
    const stationId = parseInt(args);
    if (isNaN(stationId)) {
      this.reply(bot, userClid, '用法：!radio <编号> —— 输入 !radio 查看电台列表。');
      return;
    }

    const station = stations.find((s: any) => s.id === stationId);
    if (!station) {
      this.reply(bot, userClid, `未找到电台 #${stationId}，请输入 !radio 查看电台列表。`);
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
    this.reply(bot, userClid, `正在播放：${station.name}`);
  }

  private async handlePlay(botId: number, bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args) {
      if (bot.status === 'paused') {
        bot.resume();
        this.reply(bot, userClid, '已恢复播放。');
        return;
      }
      this.reply(bot, userClid, '用法：!play <歌曲名称>');
      return;
    }

    if (args.startsWith('http://') || args.startsWith('https://')) {
      this.reply(bot, userClid, '视频链接请使用 !bv <B站链接>，!play 用于搜索音乐。');
      return;
    }

    this.reply(bot, userClid, '正在搜索并加载音乐，请稍候...');

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
      this.reply(bot, userClid, `播放失败：${err.message}`);
    }
  }

  private async handleBilibili(bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args) {
      this.reply(bot, userClid, '用法：!bv <BV号或B站链接>');
      return;
    }
      this.reply(bot, userClid, '正在加载 B 站音频，请稍候...');
    try {
      const { filePath, info } = await downloadBilibili(args, MUSIC_DIR);
      await this.enqueueOrPlay(bot, userClid, { id: `bv_${info.id}`, title: info.title, artist: info.artist, duration: info.duration, filePath, source: 'bilibili', sourceUrl: args });
    } catch (err: any) {
      this.reply(bot, userClid, `B 站链接播放失败：${err.message}`);
    }
  }

  private async handlePlaylist(bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args || !/^https?:\/\//i.test(args)) {
      this.reply(bot, userClid, '用法：!playlist <网易云或酷我歌单链接>');
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
      this.reply(bot, userClid, `已加入队列：${queueItem.artist ? `${queueItem.artist} - ` : ''}${queueItem.title}（队列位置 #${bot.queue.length}）`);
    } else {
      bot.queue.playAt(bot.queue.length - 1);
      await bot.play(queueItem);
      this.reply(bot, userClid, `正在播放：${queueItem.artist ? `${queueItem.artist} - ` : ''}${queueItem.title}`);
    }
  }

  private showQueue(bot: VoiceBot, userClid: number): void {
    const items = bot.queue.getAll();
    if (items.length === 0) {
      this.reply(bot, userClid, '队列为空。');
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
    this.reply(bot, userClid, `播放队列（共 ${items.length} 首）：\n${lines.join('\n')}`);
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
        this.reply(bot, userClid, `编号无效，当前队列有 ${items.length} 首歌曲。`);
        return;
      }
      const removed = items[idx];
      bot.queue.remove(removed.id);
      this.reply(bot, userClid, `已移除第 ${idx + 1} 首：${removed.title}`);
      return;
    }

    // !queue play <index>
    if (args.toLowerCase().startsWith('play ')) {
      const idx = parseInt(args.substring(5).trim()) - 1; // 1-based to 0-based
      const item = bot.queue.playAt(idx);
      if (!item) {
        this.reply(bot, userClid, `编号无效，当前队列有 ${bot.queue.length} 首歌曲。`);
        return;
      }
      if (item.streamUrl) {
        await bot.playStream(item);
      } else {
        await bot.play(item);
      }
      this.reply(bot, userClid, `正在播放第 ${idx + 1} 首：${item.title}`);
      return;
    }

    // !queue clear
    if (args.toLowerCase() === 'clear') {
      bot.queue.clear();
      this.reply(bot, userClid, '队列已清空。');
      return;
    }

    // Bilibili URL provided — add to queue without interrupting
    if (!args.startsWith('http://') && !args.startsWith('https://')) {
      this.reply(bot, userClid, '用法：!queue [show|play <编号>|remove <编号>|clear|<B站链接>]');
      return;
    }

    this.reply(bot, userClid, '正在加载，请稍候...');

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
        this.reply(bot, userClid, `正在播放：${info.artist} - ${info.title}`);
      } else {
        this.reply(bot, userClid, `已加入队列：${info.artist} - ${info.title}（队列位置 #${bot.queue.length}）`);
      }
    } catch (err: any) {
      this.reply(bot, userClid, `加入队列失败：${err.message}`);
    }
  }

  private handleStop(bot: VoiceBot, userClid: number): void {
    bot.stopAudio();
    this.reply(bot, userClid, '播放已停止。');
  }

  private handlePause(bot: VoiceBot, userClid: number): void {
    if (bot.status === 'paused') {
      bot.resume();
      this.reply(bot, userClid, '已恢复播放。');
    } else if (bot.status === 'playing') {
      bot.pause();
      this.reply(bot, userClid, '已暂停播放。');
    } else {
      this.reply(bot, userClid, '当前没有正在播放的音乐。');
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
      this.reply(bot, userClid, `已切换到：${next.title}`);
    } else {
      bot.stopAudio();
      this.reply(bot, userClid, '队列为空，播放已停止。');
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
      this.reply(bot, userClid, `上一首：${prev.title}`);
    } else {
      this.reply(bot, userClid, '没有上一首歌曲。');
    }
  }

  private handleVolume(bot: VoiceBot, userClid: number, args: string): void {
    if (!args) {
      const vol = bot.currentConfig.volume;
      this.reply(bot, userClid, `当前音量：${vol}%`);
      return;
    }

    const vol = parseInt(args);
    if (isNaN(vol) || vol < 0 || vol > 100) {
      this.reply(bot, userClid, '用法：!vol <0-100>');
      return;
    }

    bot.setVolume(vol);
    this.reply(bot, userClid, `音量已设置为 ${vol}%。`);
  }

  private handleNowPlaying(bot: VoiceBot, userClid: number): void {
    const np = bot.nowPlaying;
    if (!np) {
      this.reply(bot, userClid, '当前没有正在播放的音乐。');
      return;
    }

    const artist = np.artist ? `${np.artist} - ` : '';
      this.reply(bot, userClid, `正在播放：${artist}${np.title}`);
  }

  // ─── Video Streaming Commands ─────────────────────────────

  private async handleStream(bot: VoiceBot, userClid: number, args: string): Promise<void> {
    if (!args) {
      this.reply(bot, userClid, '用法：!stream <链接> [清晰度] —— 可选清晰度：480p、720p、1080p');
      return;
    }

    const parts = args.split(/\s+/);
    const url = parts[0];
    const preset = parts[1] || undefined;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      this.reply(bot, userClid, '请提供有效的链接。');
      return;
    }

    if (bot.videoStreaming) {
      // Change source if already streaming
      try {
        await bot.setVideoSource(url);
        this.reply(bot, userClid, `推流源已切换为：${url}`);
      } catch (err: any) {
        this.reply(bot, userClid, `错误：${err.message}`);
      }
      return;
    }

    this.reply(bot, userClid, '正在启动视频推流，请稍候...');
    try {
      await bot.startVideoStream(url, preset);
      this.reply(bot, userClid, `视频推流已启动：${url}`);
    } catch (err: any) {
      this.reply(bot, userClid, `启动推流失败：${err.message}`);
    }
  }

  private async handleStopStream(bot: VoiceBot, userClid: number): Promise<void> {
    if (!bot.videoStreaming) {
      this.reply(bot, userClid, '当前没有正在运行的视频推流。');
      return;
    }
    await bot.stopVideoStream();
    this.reply(bot, userClid, '视频推流已停止。');
  }

  private handleViewers(bot: VoiceBot, userClid: number): void {
    const status = bot.videoStreamStatus;
    if (!status.streaming) {
      this.reply(bot, userClid, '当前没有正在运行的视频推流。');
      return;
    }
    if (status.viewers.length === 0) {
      this.reply(bot, userClid, '当前没有观看者。');
      return;
    }
    const lines = status.viewers.map((v) => {
      const duration = Math.floor((Date.now() - v.joinedAt) / 1000);
      return `  clid=${v.clid} (${duration}s)`;
    });
    this.reply(bot, userClid, `观看者（${status.viewerCount} 人）：\n${lines.join('\n')}`);
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
