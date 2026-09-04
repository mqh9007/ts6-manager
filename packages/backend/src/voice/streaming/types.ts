/**
 * Video streaming types and quality presets
 */

export interface VideoStreamPreset {
  label: string;
  width: number;
  height: number;
  bitrate: string;
  framerate: number;
}

export const STREAM_PRESETS: Record<string, VideoStreamPreset> = {
  '480p': { label: '480p', width: 854, height: 480, bitrate: '900k', framerate: 24 },
  '720p': { label: '720p', width: 1280, height: 720, bitrate: '2500k', framerate: 30 },
  '1080p': { label: '1080p', width: 1920, height: 1080, bitrate: '4500k', framerate: 30 },
};

// 480p is the safe real-time default for ARM/Linux Sidecars.
export const DEFAULT_PRESET = '480p';

export interface VideoViewerInfo {
  clid: number;
  joinedAt: number;
  iceState: string;
}

export interface VideoStreamStatus {
  streaming: boolean;
  streamId: string | null;
  source: string | null;
  preset: string;
  framerate: number;
  bitrate: string;
  startedAt: number | null;
  viewerCount: number;
  viewers: VideoViewerInfo[];
  sidecar: { videoPort: number; audioPort: number } | null;
}
