import { useChannelGroups, useChannelGroupMembers, useCreateChannelGroup, useCopyChannelGroup, useAddChannelGroupMember, useRemoveChannelGroupMember } from '@/hooks/use-groups';
import { useClientDatabase, useClients } from '@/hooks/use-clients';
import { useChannels } from '@/hooks/use-channels';
import { useServerStore } from '@/stores/server.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldCheck, Plus, UserPlus, UserMinus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from 'react-i18next';

export default function ChannelGroups() {
  const { t } = useTranslation();
  const { selectedConfigId, selectedSid } = useServerStore();
  const { data, isLoading } = useChannelGroups();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null); const [selectedChannel, setSelectedChannel] = useState<number | null>(null); const [newName, setNewName] = useState(''); const [showCreate, setShowCreate] = useState(false); const [templateKey, setTemplateKey] = useState(''); const [showAddMembers, setShowAddMembers] = useState(false); const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const createGroup = useCreateChannelGroup(); const copyGroup = useCopyChannelGroup(); const addMember = useAddChannelGroupMember(); const removeMember = useRemoveChannelGroupMember();
  const { data: channelData } = useChannels(); const { data: members } = useChannelGroupMembers(selectedGroup, selectedChannel); const { data: dbClients } = useClientDatabase(); const { data: online } = useClients();
  // Type 0 groups are built-in templates; only show manageable groups.
  const allGroups = Array.isArray(data) ? data : [];
  const groups = allGroups.filter((g: any) => Number(g.type) !== 0);
  const templates = allGroups.filter((g: any) => Number(g.type) === 0);
  const channels = Array.isArray(channelData) ? channelData : [];
  useEffect(() => {
    if (selectedGroup === null && groups.length > 0) setSelectedGroup(Number(groups[0].cgid));
  }, [groups, selectedGroup]);
  useEffect(() => {
    if (selectedChannel === null && channels.length > 0) setSelectedChannel(Number(channels[0].cid));
  }, [channels, selectedChannel]);

  if (!selectedConfigId || !selectedSid) return <EmptyState icon={ShieldCheck} title={t('channelGroups.noServer')} />;
  if (isLoading) return <PageLoader />;

  const onlineDbids = new Set((Array.isArray(online) ? online : []).map((c: any) => Number(c.client_database_id || c.cldbid)));
  const groupMembers = Array.isArray(members) ? members : (members as any)?.members || (members as any)?.clients || [];
  const memberIds = new Set(groupMembers.map((m: any) => Number(m.cldbid)));
  const databaseClientList = Array.isArray(dbClients)
    ? dbClients
    : (dbClients as any)?.clients || (dbClients as any)?.clientdb || (dbClients as any)?.client_database || [];
  const clients = (Array.isArray(databaseClientList) ? databaseClientList : []).slice().sort((a: any, b: any) => Number(onlineDbids.has(Number(b.cldbid))) - Number(onlineDbids.has(Number(a.cldbid))));
  const clientByDbid = new Map(clients.map((c: any) => [Number(c.cldbid), c]));

  const handleCreate = () => {
    const onSuccess = () => { setShowCreate(false); setNewName(''); setTemplateKey(''); };
    if (templateKey) copyGroup.mutate({ cgid: Number(templateKey), name: newName }, { onSuccess });
    else createGroup.mutate(newName, { onSuccess });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">{t('channelGroups.title')}</h1><Button size="sm" onClick={() => { setNewName(''); setTemplateKey(''); setShowCreate(true); }}><Plus className="h-3 w-3 mr-1" />{t('channelGroups.create')}</Button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('channelGroups.groupsCount', { count: groups.length })}</CardTitle></CardHeader><CardContent className="p-0"><ScrollArea className="h-[500px]"><div className="p-2 space-y-0.5">{groups.map((g: any) => <button type="button" key={g.cgid} onClick={() => setSelectedGroup(Number(g.cgid))} className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-left transition-colors ${selectedGroup === Number(g.cgid) ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}><span className="flex items-center gap-2 truncate"><ShieldCheck className="h-3.5 w-3.5 shrink-0" />{g.name}</span><Badge variant="secondary" className="text-[10px] font-mono-data">{g.cgid}</Badge></button>)}</div></ScrollArea></CardContent></Card>
        <Card className="lg:col-span-2"><CardHeader className="pb-2"><div className="flex items-center justify-between gap-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{t('channelGroups.members')}</CardTitle>{selectedGroup && <div className="flex gap-1"><select aria-label={t('channelGroups.selectChannel')} className="h-8 max-w-48 rounded-md border bg-background px-2 text-xs" value={selectedChannel ?? ''} onChange={(e) => setSelectedChannel(Number(e.target.value))}><option value="" disabled>{t('channelGroups.selectChannel')}</option>{channels.map((channel: any) => <option key={channel.cid} value={channel.cid}>{channel.channel_name || channel.name || channel.cid}</option>)}</select><Button size="sm" disabled={selectedChannel === null} onClick={() => { setSelectedMembers([]); setShowAddMembers(true); }}><UserPlus className="h-3 w-3 mr-1" />{t('channelGroups.addMembers')}</Button></div>}</div></CardHeader><CardContent><ScrollArea className="h-[440px]">{!selectedGroup ? <p className="py-12 text-center text-sm text-muted-foreground">{t('channelGroups.selectGroup')}</p> : selectedChannel === null ? <p className="py-12 text-center text-sm text-muted-foreground">{t('channelGroups.noChannel')}</p> : groupMembers.map((m: any) => <div key={m.cldbid} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/30"><span className="text-sm">{m.client_nickname || clientByDbid.get(Number(m.cldbid))?.client_nickname || m.cldbid}</span><Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeMember.mutate({ cgid: selectedGroup, cldbid: Number(m.cldbid), cid: selectedChannel! })}><UserMinus className="h-3 w-3" /></Button></div>)}</ScrollArea></CardContent></Card>
      </div>
      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}><DialogContent><DialogHeader><DialogTitle>{t('channelGroups.addMembers')}</DialogTitle></DialogHeader><ScrollArea className="max-h-80 pr-2"><div className="space-y-1.5">{clients.filter((c: any) => !memberIds.has(Number(c.cldbid))).map((c: any) => { const id = Number(c.cldbid); const online = onlineDbids.has(id); const checked = selectedMembers.includes(id); return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${checked ? 'border-primary/40 bg-primary/5' : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/50'}`}><input className="h-4 w-4 accent-primary" type="checkbox" checked={checked} onChange={(e) => setSelectedMembers((current) => e.target.checked ? [...current, id] : current.filter((value) => value !== id))} /><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{(c.client_nickname || String(id)).slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{c.client_nickname || id}</span><span className={`text-xs ${online ? 'text-emerald-600' : 'text-muted-foreground'}`}>{online ? `● ${t('channelGroups.online')}` : `#${id}`}</span></label>; })}</div></ScrollArea><DialogFooter><Button variant="outline" onClick={() => setShowAddMembers(false)}>{t('common.cancel')}</Button><Button disabled={selectedMembers.length === 0 || addMember.isPending} onClick={() => { selectedMembers.forEach((cldbid) => addMember.mutate({ cgid: selectedGroup!, cldbid, cid: selectedChannel! })); setSelectedMembers([]); setShowAddMembers(false); }}>{t('channelGroups.addMembers')}</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogContent><DialogHeader><DialogTitle>{t('channelGroups.create')}</DialogTitle></DialogHeader><div><label className="text-xs font-medium">{t('groups.server.dialog.nameLabel')}</label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('channelGroups.newName')} autoFocus /></div><div><label className="text-xs font-medium">{t('groups.server.dialog.templateLabel')}</label><select className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}><option value="">{t('groups.server.dialog.emptyTemplate')}</option>{templates.map((template: any) => <option key={template.cgid} value={template.cgid}>{template.name}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">{templateKey ? t('groups.server.dialog.templateHint') : t('groups.server.dialog.emptyTemplateHint')}</p></div><DialogFooter><Button variant="outline" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button><Button disabled={!newName.trim() || createGroup.isPending || copyGroup.isPending} onClick={handleCreate}>{t('channelGroups.create')}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
