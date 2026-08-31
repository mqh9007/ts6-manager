import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useServerGroups, useServerGroupMembers, useCreateServerGroup, useDeleteServerGroup, useAddServerGroupMember, useRemoveServerGroupMember } from '@/hooks/use-groups';
import { useClientDatabase, useClients } from '@/hooks/use-clients';
import { useServerStore } from '@/stores/server.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Shield, Plus, Trash2, Users, ChevronRight, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

export default function ServerGroups() {
  const { t } = useTranslation();
  const { selectedConfigId, selectedSid } = useServerStore();
  const { data, isLoading } = useServerGroups();
  const createGroup = useCreateServerGroup();
  const deleteGroup = useDeleteServerGroup();
  const addMember = useAddServerGroupMember(); const removeMember = useRemoveServerGroupMember();
  const { data: databaseClients } = useClientDatabase(); const { data: onlineClients } = useClients();
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const { data: members } = useServerGroupMembers(selectedGroup);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ sgid: number; name: string } | null>(null);
  const [newName, setNewName] = useState('');

  if (!selectedConfigId || !selectedSid) return <EmptyState icon={Shield} title={t('groups.server.noServer')} />;
  if (isLoading) return <PageLoader />;

  // Type 0 groups are built-in templates; only show manageable groups.
  const groups = (Array.isArray(data) ? data : []).filter((g: any) => Number(g.type) !== 0);
  const onlineDbids = new Set((Array.isArray(onlineClients) ? onlineClients : []).map((c: any) => Number(c.client_database_id || c.cldbid)));
  const databaseClientList = Array.isArray(databaseClients)
    ? databaseClients
    : (databaseClients as any)?.clients || (databaseClients as any)?.clientdb || (databaseClients as any)?.client_database || [];
  const availableClients = (Array.isArray(databaseClientList) ? databaseClientList : []).slice().sort((a: any, b: any) => Number(onlineDbids.has(Number(b.cldbid))) - Number(onlineDbids.has(Number(a.cldbid))));
  const memberIds = new Set((Array.isArray(members) ? members : []).map((m: any) => Number(m.cldbid)));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('groups.server.title')}</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> {t('groups.server.create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Group List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('groups.server.groupsCount', { count: groups.length })}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-0.5">
                {groups.map((g: any) => (
                  <button
                    key={g.sgid}
                    onClick={() => setSelectedGroup(g.sgid)}
                    className={cn(
                      'flex items-center justify-between w-full rounded-md px-3 py-2 text-sm transition-colors text-left',
                      selectedGroup === g.sgid ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5" />
                      <span className="truncate">{g.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono-data">{g.sgid}</Badge>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </button>
                ))}
                {groups.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">{t('groups.server.noGroups')}</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Members */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {t('groups.server.members')}
                {selectedGroup && <Badge variant="default" className="font-mono-data text-[10px]">{t('groups.server.sgid', { id: selectedGroup })}</Badge>}
              </CardTitle>
              {selectedGroup && (
                <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setSelectedMembers([]); setShowAddMembers(true); }}><UserPlus className="h-3 w-3 mr-1" />{t('groups.server.addMembers')}</Button><Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                  const g = groups.find((g: any) => g.sgid === selectedGroup);
                  if (g) setDeleteTarget({ sgid: g.sgid, name: g.name });
                }}>
                  <Trash2 className="h-3 w-3 mr-1" /> {t('groups.server.deleteGroup')}
                </Button></div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedGroup ? (
              <p className="text-sm text-muted-foreground text-center py-12">{t('groups.server.selectGroupHint')}</p>
            ) : (
              <ScrollArea className="h-[440px]">
                <div className="space-y-1">
                  {Array.isArray(members) && members.length > 0 ? (
                    members.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono-data text-primary">
                            {m.client_nickname?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm">{m.client_nickname || t('groups.server.dbid', { id: m.cldbid })}</span>
                        </div>
                        <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground font-mono-data">{t('groups.server.dbid', { id: m.cldbid })}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" aria-label={t('groups.server.removeMember')} onClick={() => removeMember.mutate({ sgid: selectedGroup!, cldbid: Number(m.cldbid) })}><UserMinus className="h-3 w-3" /></Button></div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">{t('groups.server.noMembers')}</p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent><DialogHeader><DialogTitle>{t('groups.server.addMembers')}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-80 pr-2"><div className="space-y-1.5">{availableClients.filter((c: any) => !memberIds.has(Number(c.cldbid))).map((c: any) => { const id = Number(c.cldbid); const online = onlineDbids.has(id); const checked = selectedMembers.includes(id); return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${checked ? 'border-primary/40 bg-primary/5' : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'}`}><input className="h-4 w-4 accent-primary" type="checkbox" checked={checked} onChange={(e) => setSelectedMembers((current) => e.target.checked ? [...current, id] : current.filter((value) => value !== id))} /><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{(c.client_nickname || String(id)).slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{c.client_nickname || id}</span><span className={`text-xs ${online ? 'text-emerald-600' : 'text-muted-foreground'}`}>{online ? `● ${t('groups.server.online')}` : `#${id}`}</span></label>; })}</div></ScrollArea>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddMembers(false)}>{t('common.cancel')}</Button><Button disabled={selectedMembers.length === 0 || addMember.isPending} onClick={() => { selectedMembers.forEach((cldbid) => addMember.mutate({ sgid: selectedGroup!, cldbid })); setSelectedMembers([]); setShowAddMembers(false); }}>{t('groups.server.addMembers')}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('groups.server.dialog.create')}</DialogTitle></DialogHeader>
          <div><Label className="text-xs">{t('groups.server.dialog.nameLabel')}</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('groups.server.dialog.namePlaceholder')} autoFocus /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => { createGroup.mutate(newName, { onSuccess: () => { toast.success(t('groups.server.toast.created')); setShowCreate(false); setNewName(''); } }); }}>{t('groups.server.dialog.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title={t('groups.server.delete.title')} description={t('groups.server.delete.description', { name: deleteTarget?.name })} confirmLabel={t('groups.server.delete.confirm')} destructive onConfirm={() => { if (deleteTarget) deleteGroup.mutate(deleteTarget.sgid, { onSuccess: () => { toast.success(t('groups.server.toast.deleted')); setDeleteTarget(null); setSelectedGroup(null); } }); }} />
    </div>
  );
}
