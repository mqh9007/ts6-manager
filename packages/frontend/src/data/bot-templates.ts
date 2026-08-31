import { Clock, Users, Shield, Globe, Zap, MessageSquare, Moon, Timer, Megaphone, Award, FolderPlus, Eye, Webhook, Sparkles } from 'lucide-react';

export interface TemplateConfigField {
  key: string;
  labelKey: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  defaultValue?: string;
  options?: { labelKey: string; value: string }[];
  required?: boolean;
}

export interface BotTemplate {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: 'info-channels' | 'moderation' | 'automation' | 'integration';
  icon: React.ElementType;
  configFields: TemplateConfigField[];
  flowDataFactory: (config: Record<string, string>) => { nodes: any[]; edges: any[] };
}

let _id = 0;
const nid = () => `tpl_${++_id}`;
const eid = () => `tpl_e${_id}`;

function resetIds() { _id = 0; }

// Build an option label key from template id, field key and option value
const optKey = (tpl: string, field: string, value: string) =>
  `templates.${tpl}.${field}.${value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;

// Helper to build a simple linear flow
function makeNode(id: string, type: string, label: string, config: Record<string, any>, x: number, y: number) {
  return { id, type, label, config, x, y };
}
function makeEdge(id: string, source: string, target: string, sourcePort = 'out', targetPort = 'in') {
  return { id, source, sourcePort, target, targetPort };
}

export const BOT_TEMPLATES: BotTemplate[] = [
  // ===== INFO CHANNELS =====
  {
    id: 'clock-channel',
    nameKey: 'templates.clockChannel.name',
    descriptionKey: 'templates.clockChannel.description',
    category: 'info-channels',
    icon: Clock,
    configFields: [
      { key: 'channelId', labelKey: 'templates.clockChannel.channelId.label', type: 'number', placeholder: '42', required: true },
      { key: 'timezone', labelKey: 'templates.clockChannel.timezone.label', type: 'select', defaultValue: 'Europe/Berlin', options: [
        { labelKey: optKey('clockChannel', 'timezone', 'Europe/Berlin'), value: 'Europe/Berlin' },
        { labelKey: optKey('clockChannel', 'timezone', 'Europe/London'), value: 'Europe/London' },
        { labelKey: optKey('clockChannel', 'timezone', 'Europe/Paris'), value: 'Europe/Paris' },
        { labelKey: optKey('clockChannel', 'timezone', 'Europe/Moscow'), value: 'Europe/Moscow' },
        { labelKey: optKey('clockChannel', 'timezone', 'America/New_York'), value: 'America/New_York' },
        { labelKey: optKey('clockChannel', 'timezone', 'America/Chicago'), value: 'America/Chicago' },
        { labelKey: optKey('clockChannel', 'timezone', 'America/Los_Angeles'), value: 'America/Los_Angeles' },
        { labelKey: optKey('clockChannel', 'timezone', 'Asia/Tokyo'), value: 'Asia/Tokyo' },
        { labelKey: optKey('clockChannel', 'timezone', 'UTC'), value: 'UTC' },
      ] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', 'Every Minute', { cron: '* * * * *', timezone: cfg.timezone || 'Europe/Berlin' }, 60, 80),
          makeNode(n2, 'action_channelEdit', 'Update Clock', { channelId: cfg.channelId, channel_name: '[cspacer]{{time.time}}' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'online-counter',
    nameKey: 'templates.onlineCounter.name',
    descriptionKey: 'templates.onlineCounter.description',
    category: 'info-channels',
    icon: Users,
    configFields: [
      { key: 'channelId', labelKey: 'templates.onlineCounter.channelId.label', type: 'number', placeholder: '43', required: true },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', 'Every Minute', { cron: '* * * * *' }, 60, 80),
          makeNode(n2, 'action_webquery', 'Get Server Info', { command: 'serverinfo', storeAs: 'server' }, 300, 80),
          makeNode(n3, 'action_channelEdit', 'Update Counter', { channelId: cfg.channelId, channel_name: '[cspacer]Online: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}' }, 540, 80),
        ],
        edges: [makeEdge(eid(), n1, n2), makeEdge(eid(), n2, n3)],
      };
    },
  },
  {
    id: 'server-stats',
    nameKey: 'templates.serverStats.name',
    descriptionKey: 'templates.serverStats.description',
    category: 'info-channels',
    icon: Eye,
    configFields: [
      { key: 'uptimeChannelId', labelKey: 'templates.serverStats.uptimeChannelId.label', type: 'number', placeholder: '44', required: true },
      { key: 'clientsChannelId', labelKey: 'templates.serverStats.clientsChannelId.label', type: 'number', placeholder: '45', required: true },
      { key: 'channelCountChannelId', labelKey: 'templates.serverStats.channelCountChannelId.label', type: 'number', placeholder: '46', required: true },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid(), n5 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', 'Every 5 Min', { cron: '*/5 * * * *' }, 60, 150),
          makeNode(n2, 'action_webquery', 'Get Server Info', { command: 'serverinfo', storeAs: 'server' }, 300, 150),
          makeNode(n3, 'action_channelEdit', 'Uptime', { channelId: cfg.uptimeChannelId, channel_name: '[cspacer]Uptime: {{temp.server.virtualserver_uptime|uptime}}' }, 540, 60),
          makeNode(n4, 'action_channelEdit', 'Clients', { channelId: cfg.clientsChannelId, channel_name: '[cspacer]Clients: {{temp.server.virtualserver_clientsonline}}/{{temp.server.virtualserver_maxclients}}' }, 540, 150),
          makeNode(n5, 'action_channelEdit', 'Channels', { channelId: cfg.channelCountChannelId, channel_name: '[cspacer]Channels: {{temp.server.virtualserver_channelsonline}}' }, 540, 240),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3),
          makeEdge(eid(), n2, n4),
          makeEdge(eid(), n2, n5),
        ],
      };
    },
  },

  {
    id: 'animated-channel',
    nameKey: 'templates.animatedChannel.name',
    descriptionKey: 'templates.animatedChannel.description',
    category: 'info-channels',
    icon: Sparkles,
    configFields: [
      { key: 'channelId', labelKey: 'templates.animatedChannel.channelId.label', type: 'number', placeholder: '42', required: true },
      { key: 'text', labelKey: 'templates.animatedChannel.text.label', type: 'text', placeholder: 'Welcome to MyServer', required: true },
      { key: 'style', labelKey: 'templates.animatedChannel.style.label', type: 'select', defaultValue: 'scroll', options: [
        { labelKey: optKey('animatedChannel', 'style', 'Scroll Left (Marquee)'), value: 'scroll' },
        { labelKey: optKey('animatedChannel', 'style', 'Typewriter'), value: 'typewriter' },
        { labelKey: optKey('animatedChannel', 'style', 'Bounce'), value: 'bounce' },
        { labelKey: optKey('animatedChannel', 'style', 'Blink'), value: 'blink' },
        { labelKey: optKey('animatedChannel', 'style', 'Wave (Decorative)'), value: 'wave' },
        { labelKey: optKey('animatedChannel', 'style', 'Alternate Case'), value: 'alternateCase' },
      ] },
      { key: 'intervalSeconds', labelKey: 'templates.animatedChannel.intervalSeconds.label', type: 'select', defaultValue: '3', options: [
        { labelKey: optKey('animatedChannel', 'intervalSeconds', 'Slow (5s)'), value: '5' },
        { labelKey: optKey('animatedChannel', 'intervalSeconds', 'Medium (3s)'), value: '3' },
        { labelKey: optKey('animatedChannel', 'intervalSeconds', 'Fast (2s)'), value: '2' },
        { labelKey: optKey('animatedChannel', 'intervalSeconds', 'Very Fast (1s)'), value: '1' },
        { labelKey: optKey('animatedChannel', 'intervalSeconds', 'Ultra (0.5s)'), value: '0.5' },
        { labelKey: optKey('animatedChannel', 'intervalSeconds', 'Insane (0.25s)'), value: '0.25' },
      ] },
      { key: 'prefix', labelKey: 'templates.animatedChannel.prefix.label', type: 'text', placeholder: '[cspacer]', defaultValue: '[cspacer]' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid();
      return {
        nodes: [
          makeNode(n1, 'action_animatedChannel', 'Animated Channel', {
            channelId: cfg.channelId,
            text: cfg.text || 'Welcome to MyServer',
            style: cfg.style || 'scroll',
            intervalSeconds: cfg.intervalSeconds || '3',
            prefix: cfg.prefix || '[cspacer]',
          }, 200, 100),
        ],
        edges: [],
      };
    },
  },

  // ===== AUTOMATION =====
  {
    id: 'welcome-message',
    nameKey: 'templates.welcomeMessage.name',
    descriptionKey: 'templates.welcomeMessage.description',
    category: 'automation',
    icon: MessageSquare,
    configFields: [
      { key: 'message', labelKey: 'templates.welcomeMessage.message.label', type: 'text', placeholder: 'Welcome {{event.client_nickname}}!', required: true },
      { key: 'usePokeInstead', labelKey: 'templates.welcomeMessage.usePokeInstead.label', type: 'select', defaultValue: 'message', options: [
        { labelKey: optKey('welcomeMessage', 'usePokeInstead', 'Private Message'), value: 'message' },
        { labelKey: optKey('welcomeMessage', 'usePokeInstead', 'Poke'), value: 'poke' },
      ] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      const usePoke = cfg.usePokeInstead === 'poke';
      return {
        nodes: [
          makeNode(n1, 'trigger_event', 'Client Enter', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', 'Is Human?', { expression: 'event.client_type == 0' }, 300, 80),
          usePoke
            ? makeNode(n3, 'action_poke', 'Welcome Poke', { message: cfg.message || 'Welcome!' }, 540, 40)
            : makeNode(n3, 'action_message', 'Welcome Msg', { targetMode: 'client', message: cfg.message || 'Welcome!' }, 540, 40),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
        ],
      };
    },
  },
  {
    id: 'support-system',
    nameKey: 'templates.supportSystem.name',
    descriptionKey: 'templates.supportSystem.description',
    category: 'automation',
    icon: Megaphone,
    configFields: [
      { key: 'supportChannelId', labelKey: 'templates.supportSystem.supportChannelId.label', type: 'number', placeholder: '15', required: true },
      { key: 'adminGroupId', labelKey: 'templates.supportSystem.adminGroupId.label', type: 'number', placeholder: '6', required: true },
      { key: 'message', labelKey: 'templates.supportSystem.message.label', type: 'text', placeholder: 'Support needed by {{event.client_nickname}}!' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_event', 'Client Moved', { eventName: 'notifyclientmoved' }, 60, 80),
          makeNode(n2, 'condition', 'Joined Support?', { expression: `event.ctid == ${cfg.supportChannelId}` }, 300, 80),
          makeNode(n3, 'action_webquery', 'Get Client Info', { command: 'clientinfo clid={{event.clid}}', storeAs: 'client' }, 540, 40),
          makeNode(n4, 'action_pokeGroup', 'Notify Admins', { groupId: cfg.adminGroupId, message: cfg.message || 'Support needed by {{temp.client.client_nickname}}!' }, 780, 40),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4),
        ],
      };
    },
  },
  {
    id: 'temp-channel-creator',
    nameKey: 'templates.tempChannelCreator.name',
    descriptionKey: 'templates.tempChannelCreator.description',
    category: 'automation',
    icon: FolderPlus,
    configFields: [
      { key: 'lobbyChannelId', labelKey: 'templates.tempChannelCreator.lobbyChannelId.label', type: 'number', placeholder: '20', required: true },
      { key: 'parentChannelId', labelKey: 'templates.tempChannelCreator.parentChannelId.label', type: 'number', placeholder: '19', required: true },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid(), n5 = nid();
      const n6 = nid(), n7 = nid();
      return {
        nodes: [
          // Create channel when user joins lobby
          makeNode(n1, 'trigger_event', 'Client Moved', { eventName: 'notifyclientmoved' }, 60, 80),
          makeNode(n2, 'condition', 'Joined Lobby?', { expression: `event.ctid == ${cfg.lobbyChannelId}` }, 300, 80),
          makeNode(n3, 'action_webquery', 'Get Client Info', { command: 'clientinfo clid={{event.clid}}', storeAs: 'client' }, 540, 80),
          makeNode(n4, 'action_channelCreate', 'Create Channel', { channel_name: "{{temp.client.client_nickname}}'s Channel", cpid: cfg.parentChannelId, channel_flag_semi_permanent: '1' }, 780, 80),
          makeNode(n5, 'action_move', 'Move to Channel', { cid: '{{temp.lastCreatedChannelId}}' }, 1020, 80),
          // Cron cleanup: delete empty channels under parent every minute
          makeNode(n6, 'trigger_cron', 'Cleanup Timer', { cron: '* * * * *' }, 60, 220),
          makeNode(n7, 'action_tempChannelCleanup', 'Delete Empty Channels', { parentChannelId: cfg.parentChannelId, protectedChannelIds: cfg.lobbyChannelId }, 300, 220),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4),
          makeEdge(eid(), n4, n5),
          makeEdge(eid(), n6, n7),
        ],
      };
    },
  },
  {
    id: 'auto-rank',
    nameKey: 'templates.autoRank.name',
    descriptionKey: 'templates.autoRank.description',
    category: 'automation',
    icon: Award,
    configFields: [
      { key: 'ranks', labelKey: 'templates.autoRank.ranks.label', type: 'text', placeholder: '[{"hours":10,"groupId":"7"},{"hours":50,"groupId":"8"}]', required: true },
      { key: 'pollInterval', labelKey: 'templates.autoRank.pollInterval.label', type: 'select', defaultValue: '*/5 * * * *', options: [
        { labelKey: optKey('autoRank', 'pollInterval', 'Every 5 min'), value: '*/5 * * * *' },
        { labelKey: optKey('autoRank', 'pollInterval', 'Every 15 min'), value: '*/15 * * * *' },
        { labelKey: optKey('autoRank', 'pollInterval', 'Every hour'), value: '0 * * * *' },
      ] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', 'Rank Timer', { cron: cfg.pollInterval || '*/5 * * * *' }, 60, 80),
          makeNode(n2, 'action_rankCheck', 'Check Ranks', { ranks: cfg.ranks || '[]' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'last-seen-tracker',
    nameKey: 'templates.lastSeenTracker.name',
    descriptionKey: 'templates.lastSeenTracker.description',
    category: 'automation',
    icon: Clock,
    configFields: [],
    flowDataFactory: () => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_event', 'Client Leave', { eventName: 'notifyclientleftview' }, 60, 80),
          makeNode(n2, 'variable', 'Store Timestamp', { operation: 'set', name: 'lastseen_{{event.client_database_id}}', value: '{{time.timestamp}}' }, 300, 80),
          makeNode(n3, 'log', 'Log Leave', { level: 'info', message: '{{event.client_nickname}} left (dbid={{event.client_database_id}})' }, 540, 80),
        ],
        edges: [makeEdge(eid(), n1, n2), makeEdge(eid(), n2, n3)],
      };
    },
  },

  // ===== MODERATION =====
  {
    id: 'afk-mover',
    nameKey: 'templates.afkMover.name',
    descriptionKey: 'templates.afkMover.description',
    category: 'moderation',
    icon: Moon,
    configFields: [
      { key: 'afkChannelId', labelKey: 'templates.afkMover.afkChannelId.label', type: 'number', placeholder: '10', required: true },
      { key: 'idleThresholdSeconds', labelKey: 'templates.afkMover.idleThresholdSeconds.label', type: 'number', placeholder: '300', required: true },
      { key: 'exemptGroupIds', labelKey: 'templates.afkMover.exemptGroupIds.label', type: 'text', placeholder: '6,7' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', 'AFK Check', { cron: '* * * * *' }, 60, 80),
          makeNode(n2, 'action_afkMover', 'Move AFK', { afkChannelId: cfg.afkChannelId, idleThresholdSeconds: cfg.idleThresholdSeconds || '300', exemptGroupIds: cfg.exemptGroupIds || '' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'idle-kicker',
    nameKey: 'templates.idleKicker.name',
    descriptionKey: 'templates.idleKicker.description',
    category: 'moderation',
    icon: Timer,
    configFields: [
      { key: 'idleThresholdSeconds', labelKey: 'templates.idleKicker.idleThresholdSeconds.label', type: 'number', placeholder: '1800', required: true },
      { key: 'reason', labelKey: 'templates.idleKicker.reason.label', type: 'text', placeholder: 'Idle timeout' },
      { key: 'exemptGroupIds', labelKey: 'templates.idleKicker.exemptGroupIds.label', type: 'text', placeholder: '6,7' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_cron', 'Idle Check', { cron: '* * * * *' }, 60, 80),
          makeNode(n2, 'action_idleKicker', 'Kick Idle', { idleThresholdSeconds: cfg.idleThresholdSeconds || '1800', reason: cfg.reason || 'Idle timeout', exemptGroupIds: cfg.exemptGroupIds || '' }, 300, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'bad-name-checker',
    nameKey: 'templates.badNameChecker.name',
    descriptionKey: 'templates.badNameChecker.description',
    category: 'moderation',
    icon: Shield,
    configFields: [
      { key: 'badWords', labelKey: 'templates.badNameChecker.badWords.label', type: 'text', placeholder: 'admin,moderator,test', required: true },
      { key: 'reason', labelKey: 'templates.badNameChecker.reason.label', type: 'text', placeholder: 'Forbidden nickname' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const words = (cfg.badWords || '').split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
      // Build expression: contains(lower(event.client_nickname),'word1') or contains(...)
      const expr = words.length > 0
        ? words.map(w => `contains(lower(event.client_nickname),'${w}')`).join(' or ')
        : "contains(lower(event.client_nickname),'admin')";

      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_event', 'Client Enter', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', 'Is Human?', { expression: 'event.client_type == 0' }, 300, 80),
          makeNode(n3, 'condition', 'Bad Name?', { expression: expr }, 540, 40),
          makeNode(n4, 'action_kick', 'Kick Bad Name', { reasonid: '5', reason: cfg.reason || 'Forbidden nickname' }, 780, 0),
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4, 'true', 'in'),
        ],
      };
    },
  },
  {
    id: 'group-protector',
    nameKey: 'templates.groupProtector.name',
    descriptionKey: 'templates.groupProtector.description',
    category: 'moderation',
    icon: Shield,
    configFields: [
      { key: 'protectedGroupId', labelKey: 'templates.groupProtector.protectedGroupId.label', type: 'number', placeholder: '8', required: true },
      { key: 'allowedGroupId', labelKey: 'templates.groupProtector.allowedGroupId.label', type: 'number', placeholder: '10', required: true },
      { key: 'action', labelKey: 'templates.groupProtector.action.label', type: 'select', defaultValue: 'kick', options: [
        { labelKey: optKey('groupProtector', 'action', 'Kick'), value: 'kick' },
        { labelKey: optKey('groupProtector', 'action', 'Remove Group'), value: 'remove' },
      ] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid();
      const actionNode = cfg.action === 'remove'
        ? makeNode(n4, 'action_groupRemove', 'Remove Group', { groupId: cfg.protectedGroupId }, 780, 0)
        : makeNode(n4, 'action_kick', 'Kick Intruder', { reasonid: '5', reason: 'Unauthorized group' }, 780, 0);

      return {
        nodes: [
          makeNode(n1, 'trigger_event', 'Client Enter', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', 'Has Protected?', { expression: `contains(event.client_servergroups,'${cfg.protectedGroupId}')` }, 300, 80),
          makeNode(n3, 'condition', 'Missing Auth?', { expression: `contains(event.client_servergroups,'${cfg.allowedGroupId}') == 0` }, 540, 40),
          actionNode,
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4, 'true', 'in'),
        ],
      };
    },
  },

  // ===== INTEGRATION =====
  {
    id: 'webhook-server-message',
    nameKey: 'templates.webhookServerMessage.name',
    descriptionKey: 'templates.webhookServerMessage.description',
    category: 'integration',
    icon: Webhook,
    configFields: [
      { key: 'path', labelKey: 'templates.webhookServerMessage.path.label', type: 'text', placeholder: 'server-notify', required: true },
      { key: 'secret', labelKey: 'templates.webhookServerMessage.secret.label', type: 'text', placeholder: 'my-secret-key' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_webhook', 'Incoming Webhook', { path: cfg.path || 'server-notify', method: 'POST', secret: cfg.secret || '' }, 60, 80),
          makeNode(n2, 'action_message', 'Broadcast Message', { targetMode: '3', message: '[Webhook] {{event.webhook_body}}' }, 340, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'webhook-group-assign',
    nameKey: 'templates.webhookGroupAssign.name',
    descriptionKey: 'templates.webhookGroupAssign.description',
    category: 'integration',
    icon: Webhook,
    configFields: [
      { key: 'path', labelKey: 'templates.webhookGroupAssign.path.label', type: 'text', placeholder: 'verify-user', required: true },
      { key: 'groupId', labelKey: 'templates.webhookGroupAssign.groupId.label', type: 'text', placeholder: '42', required: true },
      { key: 'secret', labelKey: 'templates.webhookGroupAssign.secret.label', type: 'text', placeholder: 'my-secret-key' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_webhook', 'Verification Webhook', { path: cfg.path || 'verify-user', method: 'POST', secret: cfg.secret || '' }, 60, 80),
          makeNode(n2, 'action_webquery', 'Add to Group', { command: 'servergroupaddclient', params: { sgid: cfg.groupId, cldbid: '{{event.webhook_body.cldbid}}' } }, 340, 80),
          makeNode(n3, 'log', 'Log Result', { level: 'info', message: 'Assigned group {{groupId}} to cldbid {{event.webhook_body.cldbid}}' }, 600, 80),
        ],
        edges: [makeEdge(eid(), n1, n2), makeEdge(eid(), n2, n3)],
      };
    },
  },
  {
    id: 'webhook-channel-rename',
    nameKey: 'templates.webhookChannelRename.name',
    descriptionKey: 'templates.webhookChannelRename.description',
    category: 'integration',
    icon: Webhook,
    configFields: [
      { key: 'path', labelKey: 'templates.webhookChannelRename.path.label', type: 'text', placeholder: 'update-status', required: true },
      { key: 'channelId', labelKey: 'templates.webhookChannelRename.channelId.label', type: 'text', placeholder: '42', required: true },
      { key: 'nameTemplate', labelKey: 'templates.webhookChannelRename.nameTemplate.label', type: 'text', placeholder: '[STATUS] {{event.webhook_body.status}}', required: true },
      { key: 'secret', labelKey: 'templates.webhookChannelRename.secret.label', type: 'text', placeholder: 'my-secret-key' },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid();
      return {
        nodes: [
          makeNode(n1, 'trigger_webhook', 'Status Webhook', { path: cfg.path || 'update-status', method: 'POST', secret: cfg.secret || '' }, 60, 80),
          makeNode(n2, 'action_channelEdit', 'Update Channel', { channelId: cfg.channelId, params: { channel_name: cfg.nameTemplate || '[STATUS] {{event.webhook_body.status}}' } }, 340, 80),
        ],
        edges: [makeEdge(eid(), n1, n2)],
      };
    },
  },
  {
    id: 'anti-vpn',
    nameKey: 'templates.antiVpn.name',
    descriptionKey: 'templates.antiVpn.description',
    category: 'integration',
    icon: Globe,
    configFields: [
      { key: 'apiUrl', labelKey: 'templates.antiVpn.apiUrl.label', type: 'text', placeholder: 'https://vpnapi.io/api/{{ip}}?key=YOUR_KEY', required: true },
      { key: 'action', labelKey: 'templates.antiVpn.action.label', type: 'select', defaultValue: 'kick', options: [
        { labelKey: optKey('antiVpn', 'action', 'Kick'), value: 'kick' },
        { labelKey: optKey('antiVpn', 'action', 'Ban (1h)'), value: 'ban' },
      ] },
    ],
    flowDataFactory: (cfg) => {
      resetIds();
      const n1 = nid(), n2 = nid(), n3 = nid(), n4 = nid(), n5 = nid();
      const url = (cfg.apiUrl || '').replace('{{ip}}', '{{event.connection_client_ip}}');
      const actionNode = cfg.action === 'ban'
        ? makeNode(n5, 'action_ban', 'Ban VPN', { time: 3600, reason: 'VPN detected' }, 780, 0)
        : makeNode(n5, 'action_kick', 'Kick VPN', { reasonid: '5', reason: 'VPN detected' }, 780, 0);

      return {
        nodes: [
          makeNode(n1, 'trigger_event', 'Client Enter', { eventName: 'notifycliententerview' }, 60, 80),
          makeNode(n2, 'condition', 'Is Human?', { expression: 'event.client_type == 0' }, 300, 80),
          makeNode(n3, 'action_httpRequest', 'Check VPN API', { url, method: 'GET', storeAs: 'vpn' }, 540, 40),
          makeNode(n4, 'condition', 'Is VPN?', { expression: "temp.vpn.security.vpn == 1 or temp.vpn.security.proxy == 1" }, 540, 120),
          actionNode,
        ],
        edges: [
          makeEdge(eid(), n1, n2),
          makeEdge(eid(), n2, n3, 'true', 'in'),
          makeEdge(eid(), n3, n4),
          makeEdge(eid(), n4, n5, 'true', 'in'),
        ],
      };
    },
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'info-channels', labelKey: 'templates.categories.infoChannels.label', descriptionKey: 'templates.categories.infoChannels.description' },
  { id: 'moderation', labelKey: 'templates.categories.moderation.label', descriptionKey: 'templates.categories.moderation.description' },
  { id: 'automation', labelKey: 'templates.categories.automation.label', descriptionKey: 'templates.categories.automation.description' },
  { id: 'integration', labelKey: 'templates.categories.integration.label', descriptionKey: 'templates.categories.integration.description' },
] as const;
