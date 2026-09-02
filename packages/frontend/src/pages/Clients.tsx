import { useMemo, useState } from 'react';
import { useClients, useClientInfo, useKickClient, useBanClient, usePokeClient } from '@/hooks/use-clients';
import { useChannels } from '@/hooks/use-channels';
import { useServerStore } from '@/stores/server.store';
import { useAuthStore } from '@/stores/auth.store';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatUptime } from '@/lib/utils';
import { Users, MoreHorizontal, LogOut, Ban, MessageSquare, Zap, Copy } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function countryFlag(country: string | undefined) {
  const code = String(country || '').trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) {
    let label = code;
    try { label = new Intl.DisplayNames(['zh-CN'], { type: 'region' }).of(code) || code; } catch { /* unsupported browser locale data */ }
    return { flag: String.fromCodePoint(...[...code].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)), label };
  }
  return { flag: '', label: code || '-' };
}

export default function Clients() {
  const { t } = useTranslation();
  const { selectedConfigId, selectedSid } = useServerStore();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data, isLoading } = useClients();
  const kickClient = useKickClient();
  const banClient = useBanClient();
  const pokeClient = usePokeClient();
  const { data: channelData } = useChannels();
  const [detailClient, setDetailClient] = useState<any | null>(null);
  const { data: detail, isLoading: detailLoading } = useClientInfo(detailClient?.clid ?? null);
  const detailClientData = Array.isArray(detail) ? detail[0] : detail;
  const copyIp = (ip: string) => { void navigator.clipboard.writeText(ip).then(() => toast.success(t('clients.ipCopied'))); };

  const [pokeTarget, setPokeTarget] = useState<{ clid: number; name: string } | null>(null);
  const [pokeMsg, setPokeMsg] = useState('');

  const clients = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter((c: any) => String(c.client_type) === '0');
  }, [data]);
  const channelNames = useMemo(() => new Map((Array.isArray(channelData) ? channelData : []).map((c: any) => [Number(c.cid), c.channel_name])), [channelData]);

  const columns: ColumnDef<any>[] = useMemo(() => {
    const cols: ColumnDef<any>[] = [
      {
        id: 'index',
        header: t('clients.col.index'),
        cell: ({ row }) => <span className="font-mono-data text-xs text-muted-foreground">{row.index + 1}</span>,
      },
      {
        accessorKey: 'client_nickname',
        header: t('clients.col.nickname'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono-data text-primary">
              {row.original.client_nickname?.[0]?.toUpperCase() || '?'}
            </div>
            <button type="button" className="font-medium hover:text-primary hover:underline" onClick={() => setDetailClient(row.original)}>{row.original.client_nickname}</button>
          </div>
        ),
      },
      ...(isAdmin ? [{
        accessorKey: 'connection_client_ip',
        header: t('clients.col.ip'),
        cell: ({ row }: any) => {
          const ip = row.original.connection_client_ip || '-';
          const country = countryFlag(row.original.client_country);
          return <div className="flex items-center gap-1"><span className="text-sm leading-none" title={country.label}>{country.flag || country.label}</span><span className="font-mono-data text-xs">{ip}</span>{ip !== '-' && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100" aria-label={t('clients.copyIp')} onClick={() => copyIp(ip)}><Copy className="h-3 w-3" /></Button>}</div>;
        },
      }] : []),
      {
        id: 'platformVersion',
        header: t('clients.col.platformVersion'),
        accessorFn: (row: any) => row.client_platform && row.client_version ? `${row.client_platform}-${row.client_version}` : '',
        cell: ({ row }: any) => <span className="font-mono-data text-xs">{row.original.client_platform && row.original.client_version ? `${row.original.client_platform}-${row.original.client_version}` : '-'}</span>,
      },
      {
        accessorKey: 'cid',
        header: t('clients.col.channel'),
        cell: ({ row }) => <span className="text-xs">{channelNames.get(Number(row.original.cid)) || `#${row.original.cid}`}</span>,
      },
      {
        accessorKey: 'client_idle_time',
        header: t('clients.col.idle'),
        cell: ({ getValue }) => <span className="font-mono-data text-xs text-muted-foreground">{formatUptime(Math.floor((getValue() as number) / 1000))}</span>,
      },
      {
        accessorKey: 'client_away',
        header: t('clients.col.status'),
        cell: ({ row }) => {
          if (Number(row.original.client_output_muted) && Number(row.original.client_away)) return <Badge className="bg-orange-500/15 text-orange-700 text-[10px]">{t('clients.status.speakerAway')}</Badge>;
          if (Number(row.original.client_output_muted) && Number(row.original.client_input_muted)) return <Badge className="bg-orange-500/15 text-orange-700 text-[10px]">{t('clients.status.speakerMicMuted')}</Badge>;
          if (Number(row.original.client_output_muted)) return <Badge className="bg-orange-500/15 text-orange-700 text-[10px]">{t('clients.status.speakerMuted')}</Badge>;
          if (Number(row.original.client_away)) return <Badge variant="warning" className="text-[10px]">{t('clients.status.away')}</Badge>;
          if (Number(row.original.client_input_muted)) return <Badge variant="secondary" className="text-[10px]">{t('clients.status.micMuted')}</Badge>;
          return <Badge variant="success" className="text-[10px]">{t('clients.status.active')}</Badge>;
        },
      },
    ];
    if (isAdmin) {
      cols.push({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const c = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setPokeTarget({ clid: c.clid, name: c.client_nickname }); setPokeMsg(''); }}>
                  <Zap className="mr-2 h-4 w-4" /> {t('clients.action.poke')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  kickClient.mutate({ clid: c.clid, reasonid: 5, reasonmsg: t('clients.kickReason') });
                  toast.success(t('clients.kicked', { name: c.client_nickname }));
                }}>
                  <LogOut className="mr-2 h-4 w-4" /> {t('clients.action.kick')}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                  banClient.mutate({ clid: c.clid, time: 3600, banreason: t('clients.banReason') });
                  toast.success(t('clients.banned', { name: c.client_nickname }));
                }}>
                  <Ban className="mr-2 h-4 w-4" /> {t('clients.action.ban1h')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      });
    }
    return cols;
  }, [t, isAdmin, kickClient, banClient, channelNames]);

  if (!selectedConfigId || !selectedSid) return <EmptyState icon={Users} title={t('clients.noServer')} />;
  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('clients.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('clients.online', { count: clients.length })}</p>
        </div>
      </div>

      <DataTable columns={columns} data={clients} searchKey="client_nickname" searchPlaceholder={t('clients.search')} />

      <Dialog open={!!detailClient} onOpenChange={(open) => !open && setDetailClient(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{t('clients.details.title', { name: detailClient?.client_nickname })}</DialogTitle></DialogHeader>
          {detailLoading ? <PageLoader /> : <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 text-sm">{[
            ['clid', t('clients.details.clid')], ['client_database_id', t('clients.details.cldbid')], ['client_nickname', t('clients.details.nickname')], ['client_unique_identifier', t('clients.details.uniqueId')], ['client_version', t('clients.details.version')], ['client_platform', t('clients.details.platform')], ['client_login_name', t('clients.details.loginName')], ['client_totalconnections', t('clients.details.totalConnections')], ['client_description', t('clients.details.description')], ['client_month_bytes_uploaded', t('clients.details.monthUploaded')], ['client_month_bytes_downloaded', t('clients.details.monthDownloaded')], ['client_total_bytes_uploaded', t('clients.details.totalUploaded')], ['client_total_bytes_downloaded', t('clients.details.totalDownloaded')], ['connection_connected_time', t('clients.details.connectedTime')], ['connection_bandwidth_sent_last_second_total', t('clients.details.sentBandwidth')], ['connection_bandwidth_received_last_second_total', t('clients.details.receivedBandwidth')],
          ].map(([key, label]) => { const value = String(detailClientData?.[key] ?? '-'); return <div key={key} className="flex min-w-0 justify-between gap-3 rounded-md bg-muted/30 px-3 py-2"><span className="text-muted-foreground">{label}</span><span className="max-w-[65%] truncate text-right font-mono-data" title={value}>{value}</span></div>; })}</div>}
        </DialogContent>
      </Dialog>

      {/* Poke Dialog */}
      <Dialog open={!!pokeTarget} onOpenChange={() => setPokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clients.poke.title', { name: pokeTarget?.name })}</DialogTitle>
          </DialogHeader>
          <div>
            <Label className="text-xs">{t('clients.poke.message')}</Label>
            <Input value={pokeMsg} onChange={(e) => setPokeMsg(e.target.value)} placeholder={t('clients.poke.placeholder')} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPokeTarget(null)}>{t('clients.poke.cancel')}</Button>
            <Button onClick={() => {
              if (pokeTarget && pokeMsg) {
                pokeClient.mutate({ clid: pokeTarget.clid, msg: pokeMsg });
                toast.success(t('clients.poked', { name: pokeTarget.name }));
                setPokeTarget(null);
              }
            }}>
              <Zap className="h-4 w-4 mr-1" /> {t('clients.poke.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
