import { useState, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/bots.api';
import { authApi } from '@/api/auth.api';
import { serversApi } from '@/api/servers.api';
import { settingsApi } from '@/api/settings.api';
import { useAuthStore } from '@/stores/auth.store';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Users, Server, Plus, Trash2, Pencil, TestTube, Check, X, Lock, KeyRound, Youtube, Video, Upload, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">{t('settings.title')}</h1>

      <Tabs defaultValue="connections">
        <TabsList>
          {isAdmin && <TabsTrigger value="connections"><Server className="h-3.5 w-3.5 mr-1" /> {t('settings.tabs.connections')}</TabsTrigger>}
          <TabsTrigger value="account"><Lock className="h-3.5 w-3.5 mr-1" /> {t('settings.tabs.account')}</TabsTrigger>
          {isAdmin && <TabsTrigger value="users"><Users className="h-3.5 w-3.5 mr-1" /> {t('settings.tabs.users')}</TabsTrigger>}
          {isAdmin && <TabsTrigger value="video-cookies"><Video className="h-3.5 w-3.5 mr-1" /> {t('settings.tabs.videoCookies')}</TabsTrigger>}
          <TabsTrigger value="about"><Info className="h-3.5 w-3.5 mr-1" /> {t('settings.tabs.about')}</TabsTrigger>
        </TabsList>

        {isAdmin && (
          <TabsContent value="connections" className="mt-4">
            <ConnectionsTab />
          </TabsContent>
        )}

        <TabsContent value="about" className="mt-4">
          <AboutTab />
        </TabsContent>

        <TabsContent value="account" className="mt-4">
          <AccountTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-4">
            <UsersTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="video-cookies" className="mt-4">
            <VideoCookieTab />
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}

function AboutTab() {
  const { t } = useTranslation();
  const version = import.meta.env.VITE_APP_VERSION || 'dev';
  return <Card className="max-w-md"><CardHeader><CardTitle className="flex items-center gap-2 text-sm font-medium"><Info className="h-4 w-4 text-primary" />{t('settings.about.title')}</CardTitle></CardHeader><CardContent><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">{t('settings.about.version')}</span><Badge variant="secondary" className="font-mono-data">{version}</Badge></div></CardContent></Card>;
}

function AccountTab() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
  });

  const handleSubmit = () => {
    if (newPassword.length < 6) {
      toast.error(t('settings.account.toast.minLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.account.toast.mismatch'));
      return;
    }
    changePassword.mutate(undefined, {
      onSuccess: () => {
        toast.success(t('settings.account.toast.changed'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || t('settings.account.toast.failed');
        toast.error(msg);
      },
    });
  };

  return (
    <div className="max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('settings.account.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">{t('settings.account.currentPassword')}</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t('settings.account.currentPasswordPlaceholder')} />
          </div>
          <div>
            <Label className="text-xs">{t('settings.account.newPassword')}</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('settings.account.newPasswordPlaceholder')} />
          </div>
          <div>
            <Label className="text-xs">{t('settings.account.confirmNewPassword')}</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('settings.account.confirmPasswordPlaceholder')} />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!currentPassword || !newPassword || !confirmPassword || changePassword.isPending}
            className="w-full mt-1"
          >
            {changePassword.isPending ? t('settings.account.changing') : t('settings.account.submit')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ConnectionsTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: servers, isLoading } = useQuery({ queryKey: ['servers'], queryFn: serversApi.list });
  const createServer = useMutation({ mutationFn: (data: any) => serversApi.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }) });
  const updateServer = useMutation({ mutationFn: ({ id, data }: any) => serversApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }) });
  const deleteServer = useMutation({ mutationFn: (id: number) => serversApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['servers'] }) });
  const testServer = useMutation({ mutationFn: (id: number) => serversApi.test(id) });

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', host: '', webqueryPort: '10080', apiKey: '', useHttps: false, sshPort: '10022', sshUsername: '', sshPassword: '' });

  const serverList = useMemo(() => (Array.isArray(servers) ? servers : []), [servers]);

  if (isLoading) return <PageLoader />;

  const resetForm = () => setForm({ name: '', host: '', webqueryPort: '10080', apiKey: '', useHttps: false, sshPort: '10022', sshUsername: '', sshPassword: '' });

  const handleSave = () => {
    const payload = { ...form, webqueryPort: parseInt(form.webqueryPort), sshPort: parseInt(form.sshPort) };
    if (editId) {
      updateServer.mutate({ id: editId, data: payload }, {
        onSuccess: () => { toast.success(t('settings.connections.toast.updated')); setEditId(null); setShowAdd(false); resetForm(); },
        onError: () => toast.error(t('settings.connections.toast.updateFailed')),
      });
    } else {
      createServer.mutate(payload, {
        onSuccess: () => { toast.success(t('settings.connections.toast.added')); setShowAdd(false); resetForm(); },
        onError: () => toast.error(t('settings.connections.toast.createFailed')),
      });
    }
  };

  const openEdit = (server: any) => {
    setForm({
      name: server.name || '',
      host: server.host || '',
      webqueryPort: String(server.webqueryPort || 10080),
      apiKey: server.apiKey || '',
      useHttps: server.useHttps || false,
      sshPort: String(server.sshPort || 10022),
      sshUsername: server.sshUsername || '',
      sshPassword: server.sshPassword || '',
    });
    setEditId(server.id);
    setShowAdd(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.connections.subtitle')}</p>
        <Button size="sm" onClick={() => { resetForm(); setEditId(null); setShowAdd(true); }}><Plus className="h-4 w-4 mr-1" /> {t('settings.connections.add')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serverList.map((server: any) => (
          <Card key={server.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{server.name}</CardTitle>
                <Badge variant={server.enabled ? 'default' : 'secondary'} className="text-[10px]">
                  {server.enabled ? t('settings.connections.enabled') : t('settings.connections.disabled')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">{t('settings.connections.host')}</span>
                <span className="font-mono-data">{server.host}:{server.webqueryPort}</span>
                <span className="text-muted-foreground">{t('settings.connections.protocol')}</span>
                <span>{server.useHttps ? 'HTTPS' : 'HTTP'}</span>
                <span className="text-muted-foreground">{t('settings.connections.ssh')}</span>
                <span className="font-mono-data">{server.sshPort || '-'}</span>
              </div>
              <div className="flex items-center gap-1 pt-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => testServer.mutate(server.id, {
                  onSuccess: () => toast.success(t('settings.connections.toast.testSuccess')),
                  onError: () => toast.error(t('settings.connections.toast.testFailed')),
                })}>
                  <TestTube className="h-3 w-3 mr-1" /> {t('settings.connections.test')}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(server)}>
                  <Pencil className="h-3 w-3 mr-1" /> {t('settings.connections.edit')}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(server.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={(v) => { if (!v) { setShowAdd(false); setEditId(null); resetForm(); } else setShowAdd(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editId ? t('settings.connections.editTitle') : t('settings.connections.addTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">{t('settings.connections.name')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('settings.connections.namePlaceholder')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">{t('settings.connections.hostLabel')}</Label><Input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} placeholder={t('settings.connections.hostPlaceholder')} /></div>
              <div><Label className="text-xs">{t('settings.connections.webqueryPort')}</Label><Input type="number" value={form.webqueryPort} onChange={(e) => setForm({ ...form, webqueryPort: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs">{t('settings.connections.apiKey')}</Label>
              <Input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder={editId ? t('settings.connections.apiKeyPlaceholderEdit') : t('settings.connections.apiKeyPlaceholder')} type="password" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.useHttps} onCheckedChange={(v) => setForm({ ...form, useHttps: v })} />
              <Label className="text-xs">{t('settings.connections.useHttps')}</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">{t('settings.connections.sshPort')}</Label><Input type="number" value={form.sshPort} onChange={(e) => setForm({ ...form, sshPort: e.target.value })} /></div>
              <div><Label className="text-xs">{t('settings.connections.sshUser')}</Label><Input value={form.sshUsername} onChange={(e) => setForm({ ...form, sshUsername: e.target.value })} placeholder={t('settings.connections.sshUserPlaceholder')} /></div>
              <div><Label className="text-xs">{t('settings.connections.sshPassword')}</Label><Input type="password" value={form.sshPassword} onChange={(e) => setForm({ ...form, sshPassword: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditId(null); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.host || !form.apiKey}>{editId ? t('settings.connections.update') : t('settings.connections.addSubmit')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title={t('settings.connections.deleteTitle')}
        description={t('settings.connections.deleteDescription')}
        onConfirm={() => { if (deleteId) deleteServer.mutate(deleteId, { onSuccess: () => { toast.success(t('settings.connections.toast.deleted')); setDeleteId(null); } }); }}
        destructive
      />
    </div>
  );
}

function UsersTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const createUser = useMutation({ mutationFn: (data: any) => usersApi.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) });
  const updateUser = useMutation({ mutationFn: ({ id, data }: { id: number; data: any }) => usersApi.update(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) });
  const deleteUser = useMutation({ mutationFn: (id: number) => usersApi.delete(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }) });

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resetPwUserId, setResetPwUserId] = useState<number | null>(null);
  const [resetPwValue, setResetPwValue] = useState('');
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'viewer' });

  const userList = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  if (isLoading) return <PageLoader />;

  const handleCreate = () => {
    createUser.mutate(form, {
      onSuccess: () => { toast.success(t('settings.users.toast.created')); setShowAdd(false); setForm({ username: '', password: '', displayName: '', role: 'viewer' }); },
      onError: () => toast.error(t('settings.users.toast.createFailed')),
    });
  };

  const handleRoleChange = (userId: number, role: string) => {
    updateUser.mutate({ id: userId, data: { role } }, {
      onSuccess: () => toast.success(t('settings.users.toast.roleUpdated')),
      onError: () => toast.error(t('settings.users.toast.roleUpdateFailed')),
    });
  };

  const handleToggleEnabled = (userId: number, enabled: boolean) => {
    updateUser.mutate({ id: userId, data: { enabled } }, {
      onSuccess: () => toast.success(enabled ? t('settings.users.toast.enabled') : t('settings.users.toast.disabled')),
      onError: () => toast.error(t('settings.users.toast.statusUpdateFailed')),
    });
  };

  const handleResetPassword = () => {
    if (!resetPwUserId || resetPwValue.length < 6) {
      toast.error(t('settings.users.toast.minLength'));
      return;
    }
    updateUser.mutate({ id: resetPwUserId, data: { password: resetPwValue } }, {
      onSuccess: () => { toast.success(t('settings.users.toast.passwordReset')); setResetPwUserId(null); setResetPwValue(''); },
      onError: () => toast.error(t('settings.users.toast.resetFailed')),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t('settings.users.subtitle')}</p>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> {t('settings.users.add')}</Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="h-10 px-3 text-left font-medium text-muted-foreground">{t('settings.users.username')}</th>
              <th className="h-10 px-3 text-left font-medium text-muted-foreground">{t('settings.users.displayName')}</th>
              <th className="h-10 px-3 text-left font-medium text-muted-foreground">{t('settings.users.role')}</th>
              <th className="h-10 px-3 text-left font-medium text-muted-foreground">{t('settings.users.status')}</th>
              <th className="h-10 px-3 text-right font-medium text-muted-foreground">{t('settings.users.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u: any) => {
              const isProtected = u.username === 'admin';
              return (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5 font-mono-data text-xs">{u.username}</td>
                  <td className="px-3 py-2.5">{u.displayName}</td>
                  <td className="px-3 py-2.5">
                    {isProtected ? (
                      <Badge variant="default" className="text-[10px] capitalize">{u.role}</Badge>
                    ) : (
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                        <SelectTrigger className="h-7 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">{t('settings.users.roleAdmin')}</SelectItem>
                          <SelectItem value="viewer">{t('settings.users.roleViewer')}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {isProtected ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="h-3 w-3" /> {t('settings.users.active')}
                      </span>
                    ) : (
                      <Switch
                        checked={u.enabled}
                        onCheckedChange={(v) => handleToggleEnabled(u.id, v)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title={t('settings.users.resetPassword')} onClick={() => { setResetPwUserId(u.id); setResetPwValue(''); }}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(u.id)} disabled={isProtected}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('settings.users.addTitle')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">{t('settings.users.username')}</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder={t('settings.users.usernamePlaceholder')} /></div>
            <div><Label className="text-xs">{t('settings.users.displayName')}</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder={t('settings.users.displayNamePlaceholder')} /></div>
            <div><Label className="text-xs">{t('settings.users.password')}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t('settings.users.passwordPlaceholder')} /></div>
            <div>
              <Label className="text-xs">{t('settings.users.role')}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('settings.users.roleAdmin')}</SelectItem>
                  <SelectItem value="viewer">{t('settings.users.roleViewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={!form.username || !form.password}>{t('settings.users.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwUserId !== null} onOpenChange={(v) => { if (!v) { setResetPwUserId(null); setResetPwValue(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{t('settings.users.resetTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              <Trans
                i18nKey="settings.users.setNewPasswordFor"
                values={{ username: userList.find((u: any) => u.id === resetPwUserId)?.username }}
                components={{ strong: <span className="font-medium text-foreground" /> }}
              />
            </p>
            <div>
              <Label className="text-xs">{t('settings.users.newPassword')}</Label>
              <Input type="password" value={resetPwValue} onChange={(e) => setResetPwValue(e.target.value)} placeholder={t('settings.users.newPasswordPlaceholder')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPwUserId(null); setResetPwValue(''); }}>{t('common.cancel')}</Button>
            <Button onClick={handleResetPassword} disabled={resetPwValue.length < 6 || updateUser.isPending}>
              {updateUser.isPending ? t('settings.users.resetting') : t('settings.users.resetSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title={t('settings.users.deleteTitle')}
        description={t('settings.users.deleteDescription')}
        onConfirm={() => { if (deleteId) deleteUser.mutate(deleteId, { onSuccess: () => { toast.success(t('settings.users.toast.deleted')); setDeleteId(null); } }); }}
        destructive
      />
    </div>
  );
}

function VideoCookieTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [cookiePlatform, setCookiePlatform] = useState<'youtube' | 'bilibili' | 'twitch'>('youtube');
  const platformName = cookiePlatform === 'youtube' ? 'YouTube' : cookiePlatform === 'bilibili' ? 'Bilibili' : 'Twitch';
  const [pasteMode, setPasteMode] = useState(false);
  const [cookieText, setCookieText] = useState('');

  const { data: status, isLoading } = useQuery({
    queryKey: ['video-cookie-status', cookiePlatform],
    queryFn: () => settingsApi.getVideoCookieStatus(cookiePlatform),
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => settingsApi.uploadVideoCookieFile(cookiePlatform, file),
    onSuccess: () => {
      toast.success(t('settings.videoCookies.toast.uploaded'));
      qc.invalidateQueries({ queryKey: ['video-cookie-status', cookiePlatform] });
    },
    onError: () => toast.error(t('settings.videoCookies.toast.uploadFailed')),
  });

  const uploadText = useMutation({
    mutationFn: (text: string) => settingsApi.uploadVideoCookieText(cookiePlatform, text),
    onSuccess: () => {
      toast.success(t('settings.videoCookies.toast.saved'));
      setCookieText('');
      setPasteMode(false);
      qc.invalidateQueries({ queryKey: ['video-cookie-status', cookiePlatform] });
    },
    onError: () => toast.error(t('settings.videoCookies.toast.saveFailed')),
  });

  const deleteCookies = useMutation({
    mutationFn: () => settingsApi.deleteVideoCookies(cookiePlatform),
    onSuccess: () => {
      toast.success(t('settings.videoCookies.toast.removed'));
      qc.invalidateQueries({ queryKey: ['video-cookie-status', cookiePlatform] });
    },
    onError: () => toast.error(t('settings.videoCookies.toast.removeFailed')),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile.mutate(file);
    e.target.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="max-w-lg space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">{t('settings.videoCookies.platformLabel')}</Label>
        <Select value={cookiePlatform} onValueChange={(value: 'youtube' | 'bilibili' | 'twitch') => { setCookiePlatform(value); setPasteMode(false); setCookieText(''); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="bilibili">Bilibili</SelectItem>
            <SelectItem value="twitch">Twitch</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('settings.videoCookies.title', { platform: platformName })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {t('settings.videoCookies.description', { platform: platformName })}{' '}
            <span className="font-medium">{t('settings.videoCookies.extensionName')}</span> (Chrome/Firefox).
          </p>

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status?.active ? 'bg-green-500' : 'bg-zinc-500'}`} />
            <span className="text-sm">
              {isLoading ? t('settings.videoCookies.loading') : status?.active
                ? t('settings.videoCookies.active', { size: formatSize(status.size) })
                : t('settings.videoCookies.noCookies')}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <input
              type="file"
              accept=".txt,.cookies"
              className="hidden"
              id="cookie-file-input"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('cookie-file-input')?.click()}
              disabled={uploadFile.isPending}
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              {uploadFile.isPending ? t('settings.videoCookies.uploading') : t('settings.videoCookies.upload')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasteMode(!pasteMode)}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              {t('settings.videoCookies.paste')}
            </Button>
            {status?.active && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteCookies.mutate()}
                disabled={deleteCookies.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t('settings.videoCookies.remove')}
              </Button>
            )}
          </div>

          {/* Paste mode */}
          {pasteMode && (
            <div className="space-y-2">
              <textarea
                className="w-full h-32 rounded-md border border-border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={t('settings.videoCookies.pastePlaceholder', { domain: cookiePlatform === 'bilibili' ? 'bilibili.com' : `${cookiePlatform}.com` })}
                value={cookieText}
                onChange={(e) => setCookieText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => uploadText.mutate(cookieText)}
                  disabled={!cookieText.trim() || uploadText.isPending}
                >
                  {uploadText.isPending ? t('settings.videoCookies.saving') : t('settings.videoCookies.save')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setPasteMode(false); setCookieText(''); }}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
