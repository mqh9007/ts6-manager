import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBots, useCreateBot, useToggleBot } from '@/hooks/use-bots';
import { useServerStore } from '@/stores/server.store';
import { botsApi } from '@/api/bots.api';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, Pencil, Trash2, Play, Clock, AlertTriangle, LayoutTemplate } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TemplateGallery } from '@/components/bots/TemplateGallery';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeAgo } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function BotList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { selectedConfigId, selectedSid } = useServerStore();
  const { data, isLoading } = useBots();
  const createBot = useCreateBot();
  const toggleBot = useToggleBot();
  const deleteBot = useMutation({ mutationFn: (id: number) => botsApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }) });

  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const bots = Array.isArray(data) ? data : [];

  if (isLoading) return <PageLoader />;

  const handleCreate = () => {
    if (!selectedConfigId) {
      toast.error(t('bots.toast.selectServerFirst'));
      return;
    }
    createBot.mutate({ name: newName, description: newDesc, serverConfigId: selectedConfigId, virtualServerId: selectedSid || 1, flowData: { nodes: [], edges: [] } }, {
      onSuccess: (bot: any) => { toast.success(t('bots.toast.created', { name: newName })); setShowCreate(false); setNewName(''); setNewDesc(''); navigate(`/bots/${bot.id}`); },
      onError: () => toast.error(t('bots.toast.createFailed')),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('bots.title')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)}><LayoutTemplate className="h-4 w-4 mr-1" /> {t('bots.fromTemplate')}</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> {t('bots.newBot')}</Button>
        </div>
      </div>

      {bots.length === 0 ? (
        <EmptyState icon={Bot} title={t('bots.empty.title')} description={t('bots.empty.description')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bots.map((bot: any) => (
            <Card key={bot.id} className="group hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium truncate">{bot.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={bot.enabled}
                      onCheckedChange={(enabled) => toggleBot.mutate({ id: bot.id, enabled }, {
                        onSuccess: () => toast.success(enabled ? t('bots.toast.enabled') : t('bots.toast.disabled')),
                      })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{bot.description || t('bots.noDescription')}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={bot.enabled ? 'default' : 'secondary'} className="text-[10px]">
                    {bot.enabled ? t('bots.status.active') : t('bots.status.inactive')}
                  </Badge>
                  {bot.serverConfigId && (
                    <Badge variant="outline" className="text-[10px]">{t('bots.server', { id: bot.serverConfigId })}</Badge>
                  )}
                </div>

                {bot.updatedAt && (
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {t('bots.updated')} {timeAgo(new Date(bot.updatedAt).getTime() / 1000)}
                  </p>
                )}

                <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => navigate(`/bots/${bot.id}`)}>
                    <Pencil className="h-3 w-3 mr-1" /> {t('bots.editFlow')}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(bot.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('bots.dialog.createTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">{t('bots.dialog.name')}</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('bots.dialog.namePlaceholder')} /></div>
            <div><Label className="text-xs">{t('bots.dialog.description')}</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder={t('bots.dialog.descriptionPlaceholder')} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newName || !selectedConfigId || createBot.isPending}>{t('bots.dialog.submit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Gallery */}
      <TemplateGallery
        open={showTemplates}
        onOpenChange={setShowTemplates}
        onSelect={(name, description, flowData) => {
          if (!selectedConfigId) {
            toast.error(t('bots.toast.selectServerFirst'));
            return;
          }
          createBot.mutate({ name, description, serverConfigId: selectedConfigId, virtualServerId: selectedSid || 1, flowData }, {
            onSuccess: (bot: any) => { toast.success(t('bots.toast.createdFromTemplate', { name })); navigate(`/bots/${bot.id}`); },
            onError: () => toast.error(t('bots.toast.createFromTemplateFailed')),
          });
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title={t('bots.dialog.deleteTitle')}
        description={t('bots.dialog.deleteDescription')}
        onConfirm={() => {
          if (deleteId) deleteBot.mutate(deleteId, { onSuccess: () => { toast.success(t('bots.toast.deleted')); setDeleteId(null); } });
        }}
        destructive
      />
    </div>
  );
}
