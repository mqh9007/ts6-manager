import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '@/api/permissions.api';
import { useServerStore } from '@/stores/server.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import {
  Lock, Search, ChevronRight, ChevronDown, Shield, Users, Hash, User, Save,
  X, Check, Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { officialPermissionDescriptions } from '@/data/permission-descriptions';
import { officialChinesePermissionDescriptions } from '@/data/official-permission-descriptions';

// Permission category keys for i18n lookup
const PERM_CATEGORY_KEYS: Record<string, string> = {
  b_virtualserver: 'virtualServer',
  b_serverinstance: 'serverInstance',
  b_serverquery: 'serverQuery',
  b_channel: 'channel',
  b_client: 'client',
  b_group: 'group',
  b_ft: 'fileTransfer',
  i_channel: 'channelValues',
  i_group: 'groupValues',
  i_client: 'clientValues',
  i_ft: 'fileTransferValues',
  i_max: 'limits',
  i_needed: 'neededPowers',
};

function getCategoryKey(permsid: string): string {
  // Match longest prefix first
  const prefixes = Object.keys(PERM_CATEGORY_KEYS).sort((a, b) => b.length - a.length);
  for (const prefix of prefixes) {
    if (permsid.startsWith(prefix)) return prefix;
  }
  return 'other';
}

type PermLayer = 'server-group' | 'channel-group' | 'channel' | 'client';

interface PermDef {
  permid: number;
  permsid: string;
  permdesc: string;
}

const permissionTerms: Record<string, string> = {
  serverinstance: '服务器实例', virtualserver: '虚拟服务器', serverquery: '服务器查询', channel: '频道', client: '客户端',
  group: '组', permission: '权限', help: '帮助', info: '信息', list: '列表', search: '搜索', create: '创建', delete: '删除',
  start: '启动', stop: '停止', modify: '修改', manage: '管理', view: '查看', send: '发送', add: '添加', remove: '移除',
  join: '加入', password: '密码', name: '名称', description: '描述', topic: '主题', banner: '横幅', icon: '图标', log: '日志',
  channelgroup: '频道组', servergroup: '服务器组', power: '权限等级', needed: '所需', own: '自己的', ignore: '忽略', temporary: '临时',
  permanent: '永久', semi: '半永久', file: '文件', directory: '目录', upload: '上传', download: '下载', overview: '概览',
  textmessage: '文字消息', licensesign: '许可证签名', machine: '服务器机器', template: '模板', binding: '网络绑定',
  connectioninfo: '连接信息', canonical: '规范名称', antiflood: '防刷屏', codec: '编解码器', encryption: '加密',
  encryption_mode: '加密模式', maxclients: '最大客户端数', maxfamilyclients: '最大子频道客户端数', sortorder: '排序',
  welcomemessage: '欢迎消息', reserved: '预留名额', port: '端口', autostart: '自动启动', nickname: '昵称', integration: '集成',
  avatar: '头像', complain: '投诉', ban: '封禁', kick: '踢出', move: '移动', talk: '发言', poke: '戳一戳', whisper: '私聊',
  quota: '配额', quotas: '配额', filesize: '文件大小', storage: '存储空间', max: '最大', idletime: '空闲时间', clones: '连接数',
  subscription: '订阅', subscriptions: '订阅数', talker: '发言者', sticky: '固定频道', reserved_slots: '预留名额',
};

const descriptionTranslations: Array<[string, string]> = [
  ['Retrieve information about ServerQuery commands', '查看 ServerQuery 命令帮助'],
  ['Retrieve global server information', '查看服务器实例信息'],
  ['List virtual servers stored in the database', '查看数据库中的虚拟服务器列表'],
  ['List active IP bindings on multi-homed machines', '查看服务器机器上的网络绑定'],
  ['List permissions available available on the server instance', '查看服务器实例支持的权限列表'],
  ['Search permission assignments by name or ID', '按名称或 ID 搜索权限分配'],
  ['List server query logins', '查看 ServerQuery 登录账号列表'],
  ['Login to ServerQuery', '登录 ServerQuery'],
  ['Send text messages to all virtual servers at once', '向所有虚拟服务器发送文字消息'],
  ['Retrieve global server log', '查看服务器全局日志'],
  ['Write to global server log', '写入服务器全局日志'],
  ['Shutdown the server process', '关闭服务器进程'],
  ['Find permissions', '搜索权限'],
  ['List clients online on a virtual server', '查看虚拟服务器中的在线客户端'],
  ['List client identities known by the virtual server', '查看虚拟服务器中的客户端身份列表'],
  ['Retrieve client information', '查看客户端信息'],
  ['Create virtual servers', '创建虚拟服务器'],
  ['Delete virtual servers', '删除虚拟服务器'],
  ['Start own virtual server', '启动自己的虚拟服务器'],
  ['Stop own virtual server', '停止自己的虚拟服务器'],
  ['Start any virtual server in the server instance', '启动服务器实例中的任意虚拟服务器'],
  ['Stop any virtual server in the server instance', '停止服务器实例中的任意虚拟服务器'],
];

function translateDescription(description: string) {
  const exact = descriptionTranslations.find(([source]) => source === description);
  if (exact) return exact[1];
  let result = description;
  const replacements: Array<[RegExp, string]> = [
    [/Retrieve information about /, '查看'], [/Retrieve /, '查看'], [/List /, '查看'], [/Search /, '搜索'],
    [/Create /, '创建'], [/Delete /, '删除'], [/Start /, '启动'], [/Stop /, '停止'], [/Shutdown /, '关闭'],
    [/Modify /, '修改'], [/Edit /, '编辑'], [/Manage /, '管理'], [/Send /, '发送'], [/Write /, '写入'],
    [/Join /, '加入'], [/Ignore /, '忽略'], [/Allow /, '允许'], [/Change /, '修改'], [/Make /, '设为'],
    [/virtual server/gi, '虚拟服务器'], [/server instance/gi, '服务器实例'], [/ServerQuery/gi, 'ServerQuery'],
    [/clients?/gi, '客户端'], [/channels?/gi, '频道'], [/channel groups?/gi, '频道组'], [/server groups?/gi, '服务器组'],
    [/permissions?/gi, '权限'], [/permission assignments?/gi, '权限分配'], [/information/gi, '信息'], [/available/gi, '可用的'],
    [/database/gi, '数据库'], [/password/gi, '密码'], [/settings?/gi, '设置'], [/power/gi, '权限等级'],
    [/own/gi, '自己的'], [/global/gi, '全局'], [/online/gi, '在线'], [/list/gi, '列表'], [/log/gi, '日志'],
    [/text messages?/gi, '文字消息'], [/file transfers?/gi, '文件传输'], [/file/gi, '文件'], [/directory/gi, '目录'],
    [/with a /gi, '，使用'], [/with /gi, '，使用'], [/ and /gi, '和'], [/ to /gi, ''],
  ];
  for (const [pattern, replacement] of replacements) result = result.replace(pattern, replacement);
  return result.replace(/\s+/g, ' ').replace(/\s+([，。])/g, '$1').trim();
}

function getPermissionDescription(perm: PermDef, language: string) {
  const official = officialPermissionDescriptions[perm.permid];
  if (language.toLowerCase().startsWith('en')) return official?.en || perm.permdesc || perm.permsid;
  if (official?.zh) return official.zh;
  if (officialChinesePermissionDescriptions[perm.permsid]) return officialChinesePermissionDescriptions[perm.permsid];
  if (perm.permdesc) return translateDescription(perm.permdesc);
  const name = perm.permsid;
  if (name.startsWith('i_needed_modify_power_')) {
    const target = name.slice('i_needed_modify_power_'.length);
    const targetDescription = officialChinesePermissionDescriptions[`b_${target}`] || officialChinesePermissionDescriptions[`i_${target}`];
    if (targetDescription) return `修改“${targetDescription}”所需的权限等级`;
    return `修改「${target.split('_').map((part) => permissionTerms[part] || part).join('')}」所需的权限等级`;
  }
  const translated = name.replace(/^[bi]_/, '').split('_').filter(Boolean).map((part) => permissionTerms[part] || part).join('');
  return name.startsWith('b_') ? `允许${translated}` : (translated || perm.permdesc || perm.permsid);
}

interface PermValue {
  permsid: string;
  permvalue: number;
  permnegated: number;
  permskip: number;
}

interface PendingChange {
  permsid: string;
  permvalue: number;
  permnegated: number;
  permskip: number;
  action: 'set' | 'remove';
}

const LAYER_KEYS: { key: PermLayer; labelKey: string; icon: React.ElementType }[] = [
  { key: 'server-group', labelKey: 'serverGroup', icon: Shield },
  { key: 'channel-group', labelKey: 'channelGroup', icon: Users },
  { key: 'channel', labelKey: 'channel', icon: Hash },
  { key: 'client', labelKey: 'client', icon: User },
];

export default function Permissions() {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const { selectedConfigId: c, selectedSid: s } = useServerStore();
  const qc = useQueryClient();

  const [layer, setLayer] = useState<PermLayer>('server-group');
  const [entityId, setEntityId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [changes, setChanges] = useState<Map<string, PendingChange>>(new Map());

  // Fetch all permission definitions
  const { data: permDefs, isLoading: loadingDefs } = useQuery({
    queryKey: ['perm-defs', c, s],
    queryFn: () => permissionsApi.list(c!, s!),
    enabled: !!c && !!s,
  });

  // Fetch entity lists for selectors
  const { data: serverGroups } = useQuery({
    queryKey: ['server-groups', c, s],
    queryFn: () => permissionsApi.serverGroups(c!, s!),
    enabled: !!c && !!s && layer === 'server-group',
  });
  const { data: channelGroups } = useQuery({
    queryKey: ['channel-groups', c, s],
    queryFn: () => permissionsApi.channelGroups(c!, s!),
    enabled: !!c && !!s && layer === 'channel-group',
  });
  const { data: channels } = useQuery({
    queryKey: ['channels-for-perms', c, s],
    queryFn: () => permissionsApi.channels(c!, s!),
    enabled: !!c && !!s && layer === 'channel',
  });
  const { data: clients } = useQuery({
    queryKey: ['clients-for-perms', c, s],
    queryFn: () => permissionsApi.clients(c!, s!),
    enabled: !!c && !!s && layer === 'client',
  });

  // Fetch current entity permissions
  const { data: entityPerms, isLoading: loadingPerms } = useQuery({
    queryKey: ['entity-perms', c, s, layer, entityId],
    queryFn: () => {
      if (!c || !s || !entityId) return [];
      switch (layer) {
        case 'server-group': return permissionsApi.serverGroupPerms(c, s, entityId);
        case 'channel-group': return permissionsApi.channelGroupPerms(c, s, entityId);
        case 'channel': return permissionsApi.channelPerms(c, s, entityId);
        case 'client': return permissionsApi.clientPerms(c, s, entityId);
      }
    },
    enabled: !!c && !!s && !!entityId,
  });

  // Reset entity when layer changes
  useEffect(() => { setEntityId(null); setChanges(new Map()); }, [layer]);

  // Parse permission definitions into categorized structure
  // TS WebQuery returns { permid, permname, permdesc } — NOT permsid
  const allPerms: PermDef[] = useMemo(() => {
    if (!permDefs || !Array.isArray(permDefs)) return [];
    return permDefs.map((p: any) => ({
      permid: Number(p.permid),
      permsid: p.permname || p.permsid || `permid_${p.permid}`,
      permdesc: p.permdesc || '',
    }));
  }, [permDefs]);

  // Build permid → permname lookup (entity perms only return numeric permid)
  const permIdToName = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of allPerms) {
      map.set(p.permid, p.permsid);
    }
    return map;
  }, [allPerms]);

  // Current perm values as map (keyed by permname/permsid)
  const currentPerms = useMemo(() => {
    const map = new Map<string, PermValue>();
    if (!entityPerms || !Array.isArray(entityPerms)) return map;
    for (const p of entityPerms) {
      // Entity perms may have permsid, permname, or only numeric permid
      const name = p.permsid || p.permname || permIdToName.get(Number(p.permid)) || `permid_${p.permid}`;
      map.set(name, {
        permsid: name,
        permvalue: Number(p.permvalue) || 0,
        permnegated: Number(p.permnegated) || 0,
        permskip: Number(p.permskip) || 0,
      });
    }
    return map;
  }, [entityPerms, permIdToName]);

  // Categorize permissions
  const categories = useMemo(() => {
    const catMap = new Map<string, PermDef[]>();
    const filtered = search
      ? allPerms.filter((p) => p.permsid.toLowerCase().includes(search.toLowerCase()) || p.permdesc.toLowerCase().includes(search.toLowerCase()))
      : allPerms;

    for (const perm of filtered) {
      const cat = getCategoryKey(perm.permsid);
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(perm);
    }
    return catMap;
  }, [allPerms, search]);

  const toggleCat = useCallback((cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const getEffectiveValue = useCallback((permsid: string): PendingChange | null => {
    if (changes.has(permsid)) return changes.get(permsid)!;
    const current = currentPerms.get(permsid);
    if (current) return { ...current, action: 'set' };
    return null;
  }, [changes, currentPerms]);

  const setPermValue = useCallback((permsid: string, value: number, negated: number, skip: number) => {
    setChanges((prev) => {
      const next = new Map(prev);
      next.set(permsid, { permsid, permvalue: value, permnegated: negated, permskip: skip, action: 'set' });
      return next;
    });
  }, []);

  const removePerm = useCallback((permsid: string) => {
    setChanges((prev) => {
      const next = new Map(prev);
      if (currentPerms.has(permsid)) {
        next.set(permsid, { permsid, permvalue: 0, permnegated: 0, permskip: 0, action: 'remove' });
      } else {
        next.delete(permsid);
      }
      return next;
    });
  }, [currentPerms]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!c || !s || !entityId) return;
      const toSet = [...changes.values()].filter((ch) => ch.action === 'set');
      const toRemove = [...changes.values()].filter((ch) => ch.action === 'remove');

      for (const perm of toSet) {
        const data = { permsid: perm.permsid, permvalue: perm.permvalue, permnegated: perm.permnegated, permskip: perm.permskip };
        switch (layer) {
          case 'server-group': await permissionsApi.addServerGroupPerm(c, s, entityId, data); break;
          case 'channel-group': await permissionsApi.addChannelGroupPerm(c, s, entityId, data); break;
          case 'channel': await permissionsApi.addChannelPerm(c, s, entityId, data); break;
          case 'client': await permissionsApi.addClientPerm(c, s, entityId, data); break;
        }
      }
      for (const perm of toRemove) {
        const data = { permsid: perm.permsid };
        switch (layer) {
          case 'server-group': await permissionsApi.delServerGroupPerm(c, s, entityId, data); break;
          case 'channel-group': await permissionsApi.delChannelGroupPerm(c, s, entityId, data); break;
          case 'channel': await permissionsApi.delChannelPerm(c, s, entityId, data); break;
          case 'client': await permissionsApi.delClientPerm(c, s, entityId, data); break;
        }
      }
    },
    onSuccess: () => {
      toast.success(t('permissions.toast.saved'));
      setChanges(new Map());
      qc.invalidateQueries({ queryKey: ['entity-perms', c, s, layer, entityId] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || t('permissions.toast.saveFailed')),
  });

  if (!c || !s) return <EmptyState icon={Lock} title={t('permissions.noServer')} />;
  if (loadingDefs) return <PageLoader />;

  const currentLayer = LAYER_KEYS.find((l) => l.key === layer);
  const entities = (() => {
    switch (layer) {
      case 'server-group':
        return (Array.isArray(serverGroups) ? serverGroups : []).filter((g: any) => Number(g.type) !== 0).map((g: any) => ({
          id: Number(g.sgid), name: g.name, type: Number(g.type),
        }));
      case 'channel-group':
        return (Array.isArray(channelGroups) ? channelGroups : []).filter((g: any) => Number(g.type) !== 0).map((g: any) => ({
          id: Number(g.cgid), name: g.name, type: Number(g.type),
        }));
      case 'channel':
        return (Array.isArray(channels) ? channels : []).map((ch: any) => ({
          id: Number(ch.cid), name: ch.channel_name, type: 0,
        }));
      case 'client':
        return (Array.isArray(clients) ? clients : [])
          .filter((cl: any) => String(cl.client_type) === '0')
          .map((cl: any) => ({
            id: Number(cl.client_database_id), name: cl.client_nickname, type: 0,
          }));
      default: return [];
    }
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('permissions.title')}</h1>
        {changes.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono-data">{t('permissions.pendingChanges', { count: changes.size })}</Badge>
            <Button variant="outline" size="sm" onClick={() => setChanges(new Map())}>
              <X className="h-3.5 w-3.5 mr-1" /> {t('permissions.discard')}
            </Button>
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" /> {t('common.save')}
            </Button>
          </div>
        )}
      </div>

      {/* Layer Tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        {LAYER_KEYS.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setLayer(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              layer === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {t(`permissions.layer.${labelKey}`)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Entity Selector */}
        <Card className="col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('permissions.selectEntity', { entity: currentLayer ? t(`permissions.layer.${currentLayer.labelKey}`).replace(/s$/, '') : '' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-2 space-y-0.5">
                {entities.map((ent: any) => (
                  <button
                    key={ent.id}
                    onClick={() => { setEntityId(ent.id); setChanges(new Map()); }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between',
                      entityId === ent.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/50',
                    )}
                  >
                    <span className="truncate">{ent.name}</span>
                    <span className="text-[10px] font-mono-data text-muted-foreground ml-1">#{ent.id}</span>
                  </button>
                ))}
                {entities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">{t('permissions.noEntities')}</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Permission Editor */}
        <Card className="col-span-9">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {entityId ? t('permissions.title') : t('permissions.selectEntityPrompt')}
              </CardTitle>
              {entityId && (
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t('permissions.search')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {!entityId ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-sm text-muted-foreground">{t('permissions.selectEntityHint')}</p>
                </div>
              ) : loadingPerms ? (
                <div className="flex items-center justify-center h-[400px]">
                  <PageLoader />
                </div>
              ) : (
                <div className="px-3 pb-3">
                  {[...categories.entries()].map(([catKey, perms]) => (
                    <div key={catKey} className="mb-1">
                      <button
                        onClick={() => toggleCat(catKey)}
                        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded"
                      >
                        {expandedCats.has(catKey) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {catKey === 'other' ? t('permissions.category.other') : t(`permissions.category.${PERM_CATEGORY_KEYS[catKey]}`)}
                        <Badge variant="secondary" className="text-[9px] h-4 ml-1">{perms.length}</Badge>
                      </button>
                      {expandedCats.has(catKey) && (
                        <div className="ml-4 border-l border-border/50 pl-2">
                          {/* Header */}
                          <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                            <div className="col-span-5">{t('permissions.col.name')} / {t('permissions.col.description')}</div>
                            <div className="col-span-2 text-center">{t('permissions.col.value')}</div>
                            <div className="col-span-1 text-center">{t('permissions.col.skip')}</div>
                            <div className="col-span-1 text-center">{t('permissions.col.negate')}</div>
                            <div className="col-span-3"></div>
                          </div>
                          {perms.map((perm) => {
                            const effective = getEffectiveValue(perm.permsid);
                            const isSet = effective !== null && effective.action !== 'remove';
                            const isChanged = changes.has(perm.permsid);
                            const isBoolean = perm.permsid.startsWith('b_');

                            return (
                              <div
                                key={perm.permsid}
                                className={cn(
                                  'grid grid-cols-12 gap-2 px-2 py-1 rounded text-xs items-center group',
                                  isChanged && 'bg-primary/5',
                                  isSet ? 'text-foreground' : 'text-muted-foreground',
                                )}
                              >
                                <div className="col-span-5 min-w-0" title={perm.permdesc || perm.permsid}>
                                  <div className="font-mono-data text-[11px] truncate">{perm.permsid}</div>
                                  <div className="text-[10px] leading-4 text-muted-foreground/80 truncate">{getPermissionDescription(perm, i18n.language)}</div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                  {isBoolean ? (
                                    <button
                                      onClick={() => {
                                        if (isSet) removePerm(perm.permsid);
                                        else setPermValue(perm.permsid, 1, 0, 0);
                                      }}
                                      className={cn(
                                        'h-5 w-5 rounded border flex items-center justify-center transition-colors',
                                        isSet
                                          ? 'bg-primary border-primary text-primary-foreground'
                                          : 'border-border hover:border-primary/50',
                                      )}
                                    >
                                      {isSet && <Check className="h-3 w-3" />}
                                    </button>
                                  ) : (
                                    <Input
                                      type="number"
                                      className="h-6 w-20 text-xs text-center font-mono-data px-1"
                                      value={effective?.permvalue ?? ''}
                                      placeholder={t('permissions.valueUnset')}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) {
                                          setPermValue(perm.permsid, val, effective?.permnegated || 0, effective?.permskip || 0);
                                        } else if (e.target.value === '') {
                                          removePerm(perm.permsid);
                                        }
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  {!isBoolean && (
                                    <button
                                      onClick={() => {
                                        if (!isSet) return;
                                        const newSkip = (effective?.permskip || 0) ? 0 : 1;
                                        setPermValue(perm.permsid, effective?.permvalue || 0, effective?.permnegated || 0, newSkip);
                                      }}
                                      className={cn(
                                        'h-4 w-4 rounded border flex items-center justify-center text-[9px] transition-colors',
                                        isSet && effective?.permskip
                                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                          : 'border-border/50',
                                      )}
                                      title={t('permissions.action.skip')}
                                    >
                                      {isSet && effective?.permskip ? 'S' : ''}
                                    </button>
                                  )}
                                </div>
                                <div className="col-span-1 flex justify-center">
                                  {!isBoolean && (
                                    <button
                                      onClick={() => {
                                        if (!isSet) return;
                                        const newNeg = (effective?.permnegated || 0) ? 0 : 1;
                                        setPermValue(perm.permsid, effective?.permvalue || 0, newNeg, effective?.permskip || 0);
                                      }}
                                      className={cn(
                                        'h-4 w-4 rounded border flex items-center justify-center text-[9px] transition-colors',
                                        isSet && effective?.permnegated
                                          ? 'bg-destructive/20 border-destructive text-destructive'
                                          : 'border-border/50',
                                      )}
                                      title={t('permissions.action.negate')}
                                    >
                                      {isSet && effective?.permnegated ? 'N' : ''}
                                    </button>
                                  )}
                                </div>
                                <div className="col-span-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isSet && (
                                    <button
                                      onClick={() => removePerm(perm.permsid)}
                                      className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                      title={t('permissions.action.remove')}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                  )}
                                  {isChanged && (
                                    <span className="text-[9px] text-primary font-mono-data">{t('permissions.modified')}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  {categories.size === 0 && (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-sm text-muted-foreground">{t('permissions.noMatch')}</p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
