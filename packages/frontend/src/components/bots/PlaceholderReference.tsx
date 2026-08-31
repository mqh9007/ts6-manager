import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Tiny helper: one placeholder row                                  */
/* ------------------------------------------------------------------ */
function P({ code, descKey, example }: { code: string; descKey: string; example?: string }) {
  const { t } = useTranslation();
  return (
    <div className="py-1.5 grid grid-cols-[1fr_1.4fr_1.6fr] gap-2 items-start text-xs border-b border-border/40 last:border-0">
      <code className="text-[11px] font-mono text-emerald-400 break-all">{code}</code>
      <span className="text-muted-foreground">{t(descKey)}</span>
      {example ? (
        <code className="text-[10px] font-mono text-muted-foreground/70 bg-muted/40 rounded px-1.5 py-0.5 break-all">{example}</code>
      ) : <span />}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 mb-1.5 first:mt-0"><Badge variant="outline" className="text-[10px]">{children}</Badge></div>;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */
export function PlaceholderReference({ open, onOpenChange }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl !grid-rows-none !block p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-base">{t('placeholder.title')}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {t('placeholder.usage')}
          </p>
        </DialogHeader>

        <Tabs defaultValue="event" className="px-5 pb-5">
          <TabsList className="h-8 mb-3">
            <TabsTrigger value="event" className="text-xs px-2.5 h-6">{t('placeholder.tab.event')}</TabsTrigger>
            <TabsTrigger value="time" className="text-xs px-2.5 h-6">{t('placeholder.tab.time')}</TabsTrigger>
            <TabsTrigger value="var" className="text-xs px-2.5 h-6">{t('placeholder.tab.variables')}</TabsTrigger>
            <TabsTrigger value="temp" className="text-xs px-2.5 h-6">{t('placeholder.tab.temp')}</TabsTrigger>
            <TabsTrigger value="exec" className="text-xs px-2.5 h-6">{t('placeholder.tab.exec')}</TabsTrigger>
            <TabsTrigger value="filter" className="text-xs px-2.5 h-6">{t('placeholder.tab.filter')}</TabsTrigger>
            <TabsTrigger value="functions" className="text-xs px-2.5 h-6">{t('placeholder.tab.functions')}</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[58vh]">
            {/* ========== EVENT ========== */}
            <TabsContent value="event" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">{t('placeholder.eventDesc')}</p>

              <SectionHeader>{t('placeholder.event.clientConnected')}</SectionHeader>
              <P code="{{event.clid}}" descKey="placeholder.event.clientId" />
              <P code="{{event.client_nickname}}" descKey="placeholder.event.nickname" />
              <P code="{{event.client_database_id}}" descKey="placeholder.event.databaseId" />
              <P code="{{event.client_unique_identifier}}" descKey="placeholder.event.uniqueId" />
              <P code="{{event.client_type}}" descKey="placeholder.event.type" />
              <P code="{{event.client_servergroups}}" descKey="placeholder.event.servergroups" />
              <P code="{{event.connection_client_ip}}" descKey="placeholder.event.ip" />
              <P code="{{event.cid}}" descKey="placeholder.event.channelJoined" />

              <SectionHeader>{t('placeholder.event.clientDisconnected')}</SectionHeader>
              <P code="{{event.clid}}" descKey="placeholder.event.clientId" />
              <P code="{{event.cfid}}" descKey="placeholder.event.channelWasIn" />
              <P code="{{event.reasonid}}" descKey="placeholder.event.reasonId" />
              <P code="{{event.reasonmsg}}" descKey="placeholder.event.reasonMsg" />

              <SectionHeader>{t('placeholder.event.clientMoved')}</SectionHeader>
              <P code="{{event.clid}}" descKey="placeholder.event.clientId" />
              <P code="{{event.ctid}}" descKey="placeholder.event.targetChannelId" />
              <P code="{{event.cfid}}" descKey="placeholder.event.sourceChannelId" />
              <P code="{{event.reasonid}}" descKey="placeholder.event.reason" />

              <SectionHeader>{t('placeholder.event.textMessage')}</SectionHeader>
              <P code="{{event.clid}}" descKey="placeholder.event.senderClientId" />
              <P code="{{event.client_nickname}}" descKey="placeholder.event.senderNickname" />
              <P code="{{event.msg}}" descKey="placeholder.event.messageText" />
              <P code="{{event.targetmode}}" descKey="placeholder.event.target" />

              <SectionHeader>{t('placeholder.event.chatCommand')}</SectionHeader>
              <P code="{{event.command_name}}" descKey="placeholder.event.commandName" />
              <P code="{{event.command_args}}" descKey="placeholder.event.commandArgs" />
              <P code="{{event.clid}}" descKey="placeholder.event.senderClientId" />
              <P code="{{event.client_nickname}}" descKey="placeholder.event.senderNickname" />

              <SectionHeader>{t('placeholder.event.channelEvents')}</SectionHeader>
              <P code="{{event.cid}}" descKey="placeholder.event.channelId" />
              <P code="{{event.invokerid}}" descKey="placeholder.event.invokerId" />
              <P code="{{event.invokername}}" descKey="placeholder.event.invokerName" />

              <SectionHeader>{t('placeholder.event.webhook')}</SectionHeader>
              <P code="{{event.webhook_path}}" descKey="placeholder.event.webhookPath" />
              <P code="{{event.webhook_method}}" descKey="placeholder.event.webhookMethod" />
              <P code="{{event.webhook_body}}" descKey="placeholder.event.webhookBody" />
              <P code="{{event.webhook_body.field}}" descKey="placeholder.event.webhookField" />
              <P code="{{event.webhook_query}}" descKey="placeholder.event.webhookQuery" />
            </TabsContent>

            {/* ========== TIME ========== */}
            <TabsContent value="time" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">{t('placeholder.timeDesc')}</p>
              <P code="{{time.time}}" descKey="placeholder.time.time" />
              <P code="{{time.date}}" descKey="placeholder.time.date" />
              <P code="{{time.hours}}" descKey="placeholder.time.hours" />
              <P code="{{time.minutes}}" descKey="placeholder.time.minutes" />
              <P code="{{time.seconds}}" descKey="placeholder.time.seconds" />
              <P code="{{time.day}}" descKey="placeholder.time.day" />
              <P code="{{time.month}}" descKey="placeholder.time.month" />
              <P code="{{time.year}}" descKey="placeholder.time.year" />
              <P code="{{time.dayOfWeek}}" descKey="placeholder.time.dayOfWeek" />
              <P code="{{time.timestamp}}" descKey="placeholder.time.timestamp" />
            </TabsContent>

            {/* ========== VARIABLES ========== */}
            <TabsContent value="var" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">{t('placeholder.variablesDesc')}</p>
              <P code={'{{var.name}}'} descKey="placeholder.variables.readByName" />

              <SectionHeader>{t('placeholder.variables.actions')}</SectionHeader>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <p>{t('placeholder.variables.set')}</p>
                <p>{t('placeholder.variables.increment')}</p>
                <p>{t('placeholder.variables.append')}</p>
              </div>

              <SectionHeader>{t('placeholder.variables.useCases')}</SectionHeader>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <p>{t('placeholder.variables.visitCounter')}</p>
                <p>{t('placeholder.variables.lastSeen')}</p>
                <p>{t('placeholder.variables.onlineTime')}</p>
              </div>
            </TabsContent>

            {/* ========== TEMP ========== */}
            <TabsContent value="temp" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">{t('placeholder.tempDesc')}</p>

              <SectionHeader>{t('placeholder.temp.autoSet')}</SectionHeader>
              <P code="{{temp.lastCreatedChannelId}}" descKey="placeholder.temp.lastCreatedChannelId" />
              <P code="{{temp.lastResult}}" descKey="placeholder.temp.lastResult" />
              <P code="{{temp.afkMovedCount}}" descKey="placeholder.temp.afkMovedCount" />
              <P code="{{temp.idleKickedCount}}" descKey="placeholder.temp.idleKickedCount" />
              <P code="{{temp.pokedCount}}" descKey="placeholder.temp.pokedCount" />
              <P code="{{temp.rankPromotedCount}}" descKey="placeholder.temp.rankPromotedCount" />
              <P code="{{temp.tempChannelsDeleted}}" descKey="placeholder.temp.tempChannelsDeleted" />

              <SectionHeader>{t('placeholder.temp.customStoreAs')}</SectionHeader>
              <p className="text-xs text-muted-foreground mb-1">{t('placeholder.temp.storeAsDesc')}</p>
              <P code={'{{temp.server.virtualserver_clientsonline}}'} descKey="placeholder.temp.onlineUsers" />
              <P code={'{{temp.server.virtualserver_uptime}}'} descKey="placeholder.temp.serverUptime" />
              <P code={'{{temp.client.client_nickname}}'} descKey="placeholder.temp.clientName" />
            </TabsContent>

            {/* ========== EXEC ========== */}
            <TabsContent value="exec" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">{t('placeholder.execDesc')}</p>
              <P code="{{exec.flowId}}" descKey="placeholder.exec.flowId" />
              <P code="{{exec.executionId}}" descKey="placeholder.exec.executionId" />
              <P code="{{exec.configId}}" descKey="placeholder.exec.configId" />
              <P code="{{exec.sid}}" descKey="placeholder.exec.sid" />
              <P code="{{exec.triggerType}}" descKey="placeholder.exec.triggerType" />
            </TabsContent>

            {/* ========== FILTER ========== */}
            <TabsContent value="filter" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">{t('placeholder.filterDesc')}</p>
              <P code="uptime" descKey="placeholder.filter.uptime" />
              <P code="round" descKey="placeholder.filter.round" />
              <P code="floor" descKey="placeholder.filter.floor" />
            </TabsContent>

            {/* ========== FUNCTIONS ========== */}
            <TabsContent value="functions" className="mt-0 pr-3">
              <p className="text-xs text-muted-foreground mb-2">{t('placeholder.functionsDesc')}</p>
              <P code="contains(str, sub)" descKey="placeholder.functions.contains" />
              <P code="startsWith(str, prefix)" descKey="placeholder.functions.startsWith" />
              <P code="endsWith(str, suffix)" descKey="placeholder.functions.endsWith" />
              <P code="lower(str)" descKey="placeholder.functions.lower" />
              <P code="upper(str)" descKey="placeholder.functions.upper" />
              <P code="length(str)" descKey="placeholder.functions.length" />
              <P code="split(str, sep, idx)" descKey="placeholder.functions.split" />

              <SectionHeader>{t('placeholder.functions.conditionExamples')}</SectionHeader>
              <div className="text-xs text-muted-foreground space-y-1 mt-1">
                <p>{t('placeholder.functions.onlyUsers')}</p>
                <p>{t('placeholder.functions.inGroup')}</p>
                <p>{t('placeholder.functions.nighttime')}</p>
                <p>{t('placeholder.functions.movedToChannel')}</p>
                <p>{t('placeholder.functions.vpnDetected')}</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
