import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, FileCode2, Info, Music2, PlayCircle, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi, type MusicSourceConfig } from '@/api/settings.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function MusicSourcesTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<MusicSourceConfig | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { initialized: boolean; requests: { ok: boolean }[] }>>({});
  const { data, isLoading } = useQuery({ queryKey: ['music-sources'], queryFn: settingsApi.getMusicSources });
  const sources = data?.sources || [];
  const reload = () => qc.invalidateQueries({ queryKey: ['music-sources'] });

  const upload = useMutation({
    mutationFn: settingsApi.uploadMusicSource,
    onSuccess: () => { toast.success(t('music.sources.installed')); reload(); },
    onError: (err: any) => toast.error(err?.response?.data?.error || t('music.sources.validationFailed')),
  });
  const update = useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => settingsApi.updateMusicSource(id, { enabled }), onSuccess: reload, onError: () => toast.error(t('music.sources.updateFailed')) });
  const test = useMutation({ mutationFn: settingsApi.testMusicSource, onSuccess: (result, id) => { setTestResult((current) => ({ ...current, [id]: result })); if (result.initialized && result.requests.some((request) => request.ok)) toast.success(t('music.sources.reachable')); else toast.error(t('music.sources.unreachable')); }, onError: () => toast.error(t('music.sources.testFailed')) });
  const reorder = useMutation({ mutationFn: settingsApi.reorderMusicSources, onSuccess: reload, onError: () => toast.error(t('music.sources.orderFailed')) });
  const preference = useMutation({ mutationFn: settingsApi.updateMusicSourcePreference, onSuccess: reload, onError: () => toast.error(t('music.sources.preferenceFailed')) });
  const remove = useMutation({ mutationFn: settingsApi.deleteMusicSource, onSuccess: () => { toast.success(t('music.sources.removed')); setDeleteTarget(null); reload(); }, onError: () => toast.error(t('music.sources.removeFailed')) });

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= sources.length) return;
    const ids = sources.map((source) => source.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) upload.mutate(file);
    event.target.value = '';
  };

  const platforms = sources.flatMap((source) => source.platforms.map((platform) => ({ value: `${source.id}:${platform.id}`, label: `${source.name} · ${platform.name}` })));

  return (
    <div className="max-w-3xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium"><Music2 className="h-4 w-4" /> {t('music.sources.title')}</CardTitle>
          <CardDescription>{t('music.sources.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>{t('music.sources.warning')}</span>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t('music.sources.install')}</p><p className="text-xs text-muted-foreground">{t('music.sources.uploadHelp')}</p></div>
            <input id="music-source-file" type="file" accept=".js,application/javascript,text/javascript" className="hidden" onChange={handleUpload} />
            <Button variant="outline" onClick={() => document.getElementById('music-source-file')?.click()} disabled={upload.isPending}><Upload /> {upload.isPending ? t('music.sources.validating') : t('music.sources.upload')}</Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t('music.sources.preference')}</Label>
            <Select value={data?.preferredPlatform || 'auto'} onValueChange={(preferredPlatform) => preference.mutate(preferredPlatform)} disabled={!platforms.length || preference.isPending}>
              <SelectTrigger><SelectValue placeholder={t('music.sources.automatic')} /></SelectTrigger>
              <SelectContent><SelectItem value="auto">{t('music.sources.automaticPriority')}</SelectItem>{platforms.map((platform) => <SelectItem key={platform.value} value={platform.value}>{platform.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {isLoading ? <p className="text-sm text-muted-foreground">{t('music.sources.loading')}</p> : sources.length === 0 ? <div className="rounded-lg border border-border p-8 text-center"><FileCode2 className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">{t('music.sources.empty')}</p><p className="mt-1 text-xs text-muted-foreground">{t('music.sources.emptyHelp')}</p></div> : sources.map((source, index) => (
            <div key={source.id} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex flex-wrap items-center gap-3"><Switch checked={source.enabled} onCheckedChange={(enabled) => update.mutate({ id: source.id, enabled })} aria-label={t('music.sources.enable', { name: source.name })} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-medium text-sm">{source.name}</span><Badge variant="outline" className="text-[10px]">{t('music.sources.priority', { count: index + 1 })}</Badge></div><p className="mt-0.5 text-xs text-muted-foreground">{source.fileName}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => test.mutate(source.id)} disabled={test.isPending} aria-label={t('music.sources.test')}><PlayCircle /></Button><Button variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0 || reorder.isPending} aria-label={t('music.sources.moveUp')}><ArrowUp /></Button><Button variant="ghost" size="icon" onClick={() => move(index, 1)} disabled={index === sources.length - 1 || reorder.isPending} aria-label={t('music.sources.moveDown')}><ArrowDown /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(source)} aria-label={t('music.sources.remove')}><Trash2 className="text-destructive" /></Button></div></div>
              <div className="mt-3 flex flex-wrap gap-1.5">{source.platforms.map((platform) => <Badge key={platform.id} variant="secondary" className="gap-1 text-[10px]"><Music2 className="h-3 w-3" />{platform.name}</Badge>)}</div>
              {testResult[source.id] && <p className={`mt-3 text-xs ${testResult[source.id].initialized && testResult[source.id].requests.some((request) => request.ok) ? 'text-emerald-600' : 'text-destructive'}`}>{testResult[source.id].initialized ? 'Initialization succeeded' : 'Initialization failed'} · {testResult[source.id].requests.filter((request) => request.ok).length}/{testResult[source.id].requests.length} service requests reachable</p>}
            </div>
          ))}
        </CardContent>
      </Card>
      <ConfirmDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Remove music source?" description={`This permanently removes ${deleteTarget?.name || 'this source'} and its uploaded JavaScript file.`} destructive onConfirm={() => { if (deleteTarget) remove.mutate(deleteTarget.id); }} />
    </div>
  );
}
