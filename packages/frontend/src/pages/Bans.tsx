import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBans, useAddBan, useDeleteBan } from '@/hooks/use-bans';
import { useServerStore } from '@/stores/server.store';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDuration, timeAgo } from '@/lib/utils';
import { Ban, Plus, Trash2 } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export default function Bans() {
  const { t } = useTranslation();
  const { selectedConfigId, selectedSid } = useServerStore();
  const { data, isLoading } = useBans();
  const addBan = useAddBan();
  const deleteBan = useDeleteBan();
  const [showAdd, setShowAdd] = useState(false);
  const [banType, setBanType] = useState<'ip' | 'name' | 'uid'>('ip');
  const [banValue, setBanValue] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('3600');

  const bans = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const columns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: 'lastnickname', header: t('bans.col.lastNickname'), cell: ({ getValue }) => <span className="font-medium">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'ip', header: t('bans.ip'), cell: ({ getValue }) => <span className="font-mono-data text-xs">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'uid', header: t('bans.col.uid'), cell: ({ getValue }) => <span className="font-mono-data text-xs truncate max-w-[120px] block">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'reason', header: t('bans.reason'), cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '-'}</span> },
    { accessorKey: 'duration', header: t('bans.duration'), cell: ({ getValue }) => <span className="font-mono-data text-xs">{formatDuration(getValue() as number)}</span> },
    { accessorKey: 'created', header: t('bans.created'), cell: ({ getValue }) => <span className="text-xs text-muted-foreground">{timeAgo(getValue() as number)}</span> },
    { accessorKey: 'invokername', header: t('bans.col.by'), cell: ({ getValue }) => <span className="text-xs">{(getValue() as string) || '-'}</span> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => {
          deleteBan.mutate(row.original.banid, { onSuccess: () => toast.success(t('bans.toast.removed')) });
        }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [deleteBan]);

  if (!selectedConfigId || !selectedSid) return <EmptyState icon={Ban} title={t('bans.noServer')} />;
  if (isLoading) return <PageLoader />;

  const handleAdd = () => {
    const params: any = { time: parseInt(banDuration), banreason: banReason };
    params[banType] = banValue;
    addBan.mutate(params, {
      onSuccess: () => { toast.success(t('bans.toast.added')); setShowAdd(false); setBanValue(''); setBanReason(''); },
      onError: () => toast.error(t('bans.toast.addFailed')),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('bans.title')}</h1>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> {t('bans.add')}</Button>
      </div>

      <DataTable columns={columns} data={bans} searchKey="lastnickname" searchPlaceholder={t('bans.search')} />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('bans.add')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{t('bans.form.type')}</Label>
              <Select value={banType} onValueChange={(v: any) => setBanType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ip">{t('bans.form.typeIp')}</SelectItem>
                  <SelectItem value="name">{t('bans.form.typeName')}</SelectItem>
                  <SelectItem value="uid">{t('bans.form.typeUid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('bans.form.value')}</Label><Input value={banValue} onChange={(e) => setBanValue(e.target.value)} placeholder={banType === 'ip' ? t('bans.form.valuePlaceholderIp') : banType === 'name' ? t('bans.form.valuePlaceholderName') : t('bans.form.valuePlaceholderUid')} /></div>
            <div><Label className="text-xs">{t('bans.reason')}</Label><Input value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder={t('bans.form.reasonPlaceholder')} /></div>
            <div>
              <Label className="text-xs">{t('bans.duration')}</Label>
              <Select value={banDuration} onValueChange={setBanDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3600">{t('bans.form.duration1h')}</SelectItem>
                  <SelectItem value="86400">{t('bans.form.duration1d')}</SelectItem>
                  <SelectItem value="604800">{t('bans.form.duration1w')}</SelectItem>
                  <SelectItem value="2592000">{t('bans.form.duration30d')}</SelectItem>
                  <SelectItem value="0">{t('bans.permanent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAdd} disabled={!banValue}>{t('bans.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
