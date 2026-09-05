import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createConnection } from 'node:net';
import type { Ts3Client } from '../tslib/client.js';
import { buildCommand, type ParsedCommand } from '../tslib/commands.js';
import { validateUrl } from '../../utils/url-validator.js';

export async function coverImage(url: string): Promise<Buffer> {
  if (!(await validateUrl(url)).valid) throw new Error('Invalid cover URL');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok || !response.body) throw new Error(`Cover HTTP ${response.status}`);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 5 * 1024 * 1024) { await response.body.cancel().catch(() => {}); throw new Error('Cover exceeds 5 MB'); }
    chunks.push(Buffer.from(chunk));
  }
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-vf', 'scale=256:256:force_original_aspect_ratio=decrease', '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'mjpeg', 'pipe:1']);
    const output: Buffer[] = [];
    const timer = setTimeout(() => { proc.kill('SIGKILL'); reject(new Error('Cover conversion timed out')); }, 10000);
    proc.stdout.on('data', chunk => output.push(chunk));
    proc.stderr.resume();
    proc.stdin.on('error', () => {});
    proc.once('error', err => { clearTimeout(timer); reject(err); });
    proc.once('close', code => {
      clearTimeout(timer);
      const image = Buffer.concat(output);
      if (code || !image.length || image.length > 200000) reject(new Error('Cover conversion failed or avatar exceeds 200 KB'));
      else resolve(image);
    });
    proc.stdin.end(Buffer.concat(chunks));
  });
}

let transferId = 10000;
export async function uploadCoverAvatar(client: Ts3Client, host: string, image: Buffer, isCurrent: () => boolean): Promise<void> {
  const id = ++transferId % 65535;
  const info = await new Promise<Record<string, string>>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); client.off('command', listener); };
    const listener = (cmd: ParsedCommand) => {
      const p = cmd.params;
      if (Number(p.clientftfid) === id && p.ftkey) { cleanup(); resolve(p); }
      else if ((p.return_code === `avatar_${id}` || Number(p.clientftfid) === id) && Number(p.id || p.status)) {
        cleanup(); reject(new Error(`Avatar upload rejected: ${p.msg || p.status} (permission ${p.failed_permid || 'unknown'})`));
      }
    };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Avatar upload initialization timed out')); }, 10000);
    client.on('command', listener);
    client.sendCommand(buildCommand('ftinitupload', { cid: 0, name: '/avatar', cpw: '', clientftfid: id, size: image.length, overwrite: 1, resume: 0, return_code: `avatar_${id}` }));
  });
  if (!isCurrent()) return;
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({ host: info.ip || host, port: Number(info.port) });
    socket.setTimeout(10000, () => socket.destroy(new Error('Avatar transfer timed out')));
    socket.once('error', reject);
    socket.once('connect', () => socket.end(Buffer.concat([Buffer.from(info.ftkey), image])));
    socket.once('close', hadError => { if (!hadError) resolve(); });
  });
  if (isCurrent()) client.sendCommand(buildCommand('clientupdate', { client_flag_avatar: createHash('md5').update(image).digest('hex'), return_code: `avatar_${id}` }));
}
