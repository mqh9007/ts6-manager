import api from './client';

export type MusicSourceConfig = {
  id: string;
  name: string;
  enabled: boolean;
  fileName: string;
  platforms: { id: string; name: string; qualitys: string[]; actions: string[] }[];
  createdAt: string;
};

export type MusicSourceSettings = { sources: MusicSourceConfig[]; preferredPlatform: string };

export const settingsApi = {
  getMusicSources: () => api.get<MusicSourceSettings>('/settings/music-sources').then((r) => r.data),
  uploadMusicSource: (file: File) => {
    const form = new FormData();
    form.append('source', file);
    return api.post<MusicSourceConfig>('/settings/music-sources', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  updateMusicSource: (id: string, data: { enabled: boolean }) => api.patch<MusicSourceConfig>(`/settings/music-sources/${id}`, data).then((r) => r.data),
  testMusicSource: (id: string) => api.post<{ initialized: boolean; keyword: string; platforms: { id: string; name: string; ok: boolean; searchOk: boolean; playOk: boolean; message?: string }[]; requests: { url: string; ok: boolean; error?: string }[] }>(`/settings/music-sources/${id}/test`).then((r) => r.data),
  reorderMusicSources: (ids: string[]) => api.put<MusicSourceSettings>('/settings/music-sources/order', { ids }).then((r) => r.data),
  updateMusicSourcePreference: (preferredPlatform: string) => api.put<MusicSourceSettings>('/settings/music-sources/preference', { preferredPlatform }).then((r) => r.data),
  deleteMusicSource: (id: string) => api.delete(`/settings/music-sources/${id}`).then((r) => r.data),
  getVideoCookieStatus: (platform: string) => api.get('/settings/video-cookies', { params: { platform } }).then((r) => r.data),

  uploadVideoCookieFile: (platform: string, file: File) => {
    const formData = new FormData();
    formData.append('cookies', file);
    formData.append('platform', platform);
    return api.post('/settings/video-cookies', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },

  uploadVideoCookieText: (platform: string, text: string) =>
    api.post('/settings/video-cookies', { platform, text }).then((r) => r.data),

  deleteVideoCookies: (platform: string) => api.delete('/settings/video-cookies', { params: { platform } }).then((r) => r.data),
};
