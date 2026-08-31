import { useState } from 'react';
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
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<MusicSourceConfig | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { initialized: boolean; requests: { ok: boolean }[] }>>({});
  const { data, isLoading } = useQuery({ queryKey: ['music-sources'], queryFn: settingsApi.getMusicSources });
  const sources = data?.sources || [];
  const reload = () => qc.invalidateQueries({ queryKey: ['music-sources'] });

  const upload = useMutation({
    mutationFn: settingsApi.uploadMusicSource,
    onSuccess: () => { toast.success('Music source installed'); reload(); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Music source validation failed'),
  });
  const update = useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => settingsApi.updateMusicSource(id, { enabled }), onSuccess: reload, onError: () => toast.error('Failed to update music source') });
  const test = useMutation({ mutationFn: settingsApi.testMusicSource, onSuccess: (result, id) => { setTestResult((current) => ({ ...current, [id]: result })); if (result.initialized && result.requests.some((request) => request.ok)) toast.success('Music source is reachable'); else toast.error('Music source could not reach its services'); }, onError: () => toast.error('Music source test failed') });
  const reorder = useMutation({ mutationFn: settingsApi.reorderMusicSources, onSuccess: reload, onError: () => toast.error('Failed to save source order') });
  const preference = useMutation({ mutationFn: settingsApi.updateMusicSourcePreference, onSuccess: reload, onError: () => toast.error('Failed to update playback preference') });
  const remove = useMutation({ mutationFn: settingsApi.deleteMusicSource, onSuccess: () => { toast.success('Music source removed'); setDeleteTarget(null); reload(); }, onError: () => toast.error('Failed to remove music source') });

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
          <CardTitle className="flex items-center gap-2 text-sm font-medium"><Music2 className="h-4 w-4" /> Music source scripts</CardTitle>
          <CardDescription>Install LX Music-compatible JavaScript sources. The selected source/platform is used when the bot resolves a requested song.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>Only install trusted scripts. Scripts can make network requests to their configured music services; restricted or paid tracks may remain unavailable.</span>
          </div>

          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">Install a music source</p><p className="text-xs text-muted-foreground">Upload one LX Music source JavaScript file, up to 512 KB.</p></div>
            <input id="music-source-file" type="file" accept=".js,application/javascript,text/javascript" className="hidden" onChange={handleUpload} />
            <Button variant="outline" onClick={() => document.getElementById('music-source-file')?.click()} disabled={upload.isPending}><Upload /> {upload.isPending ? 'Validating...' : 'Upload .js source'}</Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Platform preference for !play</Label>
            <Select value={data?.preferredPlatform || 'auto'} onValueChange={(preferredPlatform) => preference.mutate(preferredPlatform)} disabled={!platforms.length || preference.isPending}>
              <SelectTrigger><SelectValue placeholder="Automatic" /></SelectTrigger>
              <SelectContent><SelectItem value="auto">Automatic — use enabled sources by priority</SelectItem>{platforms.map((platform) => <SelectItem key={platform.value} value={platform.value}>{platform.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {isLoading ? <p className="text-sm text-muted-foreground">Loading music sources...</p> : sources.length === 0 ? <div className="rounded-lg border border-border p-8 text-center"><FileCode2 className="mx-auto mb-2 h-7 w-7 text-muted-foreground" /><p className="text-sm font-medium">No music sources installed</p><p className="mt-1 text-xs text-muted-foreground">Upload an LX Music JavaScript source to begin.</p></div> : sources.map((source, index) => (
            <div key={source.id} className="rounded-lg border border-border bg-background/40 p-4">
              <div className="flex flex-wrap items-center gap-3"><Switch checked={source.enabled} onCheckedChange={(enabled) => update.mutate({ id: source.id, enabled })} aria-label={`Enable ${source.name}`} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-medium text-sm">{source.name}</span><Badge variant="outline" className="text-[10px]">Priority {index + 1}</Badge></div><p className="mt-0.5 text-xs text-muted-foreground">{source.fileName}</p></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => test.mutate(source.id)} disabled={test.isPending} aria-label="Test source"><PlayCircle /></Button><Button variant="ghost" size="icon" onClick={() => move(index, -1)} disabled={index === 0 || reorder.isPending} aria-label="Move source up"><ArrowUp /></Button><Button variant="ghost" size="icon" onClick={() => move(index, 1)} disabled={index === sources.length - 1 || reorder.isPending} aria-label="Move source down"><ArrowDown /></Button><Button variant="ghost" size="icon" onClick={() => setDeleteTarget(source)} aria-label="Remove source"><Trash2 className="text-destructive" /></Button></div></div>
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
