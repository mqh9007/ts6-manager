# TeamSpeak 权限节点与官方中文描述

> 来源：TeamSpeak 服务端 `permissionlist` 报文，以及客户端官方简体中文语言包 `zh_Hans.json`。
> 
> 共 510 个服务端权限节点；其中客户端提供官方中文描述的节点会填写描述，未提供的节点暂时留空。

## 编号对应关系

服务端报文中的两段编号是一一对应的：

- 基础权限编号：`1–255`
- 所需修改权限等级编号：`32769–33023`
- 对应编号关系：`高位编号 = 基础权限编号 + 32768`
- 共核对 255 组对应关系，编号全部匹配。

高位权限节点通常以 `i_needed_modify_power_` 开头，表示修改对应基础权限所需的权限等级。部分节点名称存在服务端历史命名差异，例如 `semi_permanent`、文件传输配额相关节点，但不影响编号对应关系。

| 权限 ID | 权限节点 | 官方中文描述 | Official English Description |
|---:|---|---|---|
| 1 | `b_serverinstance_help_view` | ServerQuery：检索帮助文本 | ServerQuery: Retrieve Help Texts |
| 2 | `b_serverinstance_info_view` | ServerQuery：检索主机和实例信息 | ServerQuery: Retrieve Host and Instance Info |
| 3 | `b_serverinstance_virtualserver_list` | ServerQuery：检索虚拟服务器列表 | ServerQuery: Retrieve Virtual Server list |
| 4 | `b_serverinstance_binding_list` | ServerQuery：检索服务器 IP 地址 | ServerQuery: Retrieve Server IP Addresses |
| 5 | `b_serverinstance_permission_list` | ServerQuery：检索权限列表 | ServerQuery: Retrieve List of Permissions |
| 6 | `b_serverinstance_permission_find` | ServerQuery：查找分配的权限 | ServerQuery: Find assigned Permissions |
| 7 | `b_virtualserver_create` | ServerQuery：创建虚拟服务器 | ServerQuery: Create Virtual Server |
| 8 | `b_virtualserver_delete` | ServerQuery：删除现有虚拟服务器 | ServerQuery: Delete existing Virtual Server |
| 9 | `b_virtualserver_start_any` | ServerQuery：启动虚拟服务器 | ServerQuery: Start Virtual Servers |
| 10 | `b_virtualserver_stop_any` | ServerQuery：停止虚拟服务器 | ServerQuery: Stop Virtual Servers |
| 11 | `b_virtualserver_change_machine_id` | 修改虚拟服务器机器 ID | Modify Virtual Server Machine ID |
| 12 | `b_virtualserver_change_template` | ServerQuery：编辑虚拟服务器模板 | ServerQuery: Edit virtual server template |
| 13 | `b_serverquery_login` | ServerQuery：通过 ServerQuery 登录 | ServerQuery: Login via ServerQuery |
| 14 | `b_serverquery_login_create` | 创建新的 ServerQuery 登录 | Create a new ServerQuery login |
| 15 | `b_serverquery_login_delete` | 删除 ServerQuery 登录 | Delete a ServerQuery login |
| 16 | `b_serverquery_login_list` | 列出 ServerQuery 登录 | List ServerQuery logins |
| 17 | `b_serverinstance_textmessage_send` | ServerQuery：向所有人发送文本消息 | ServerQuery: Send Text Messages to Everyone |
| 18 | `b_serverinstance_log_view` | ServerQuery：查看服务器实例日志 | ServerQuery: View Server Instance Logs |
| 19 | `b_serverinstance_log_add` | ServerQuery：写入服务器实例日志 | ServerQuery: Write to Server Instance Logs |
| 20 | `b_serverinstance_stop` | ServerQuery：停止服务器实例 | ServerQuery: Stop Server Instance |
| 21 | `b_serverinstance_licensesign_message` | 使用许可证密钥签署任意消息 | Sign arbitrary message with license key |
| 22 | `b_serverinstance_modify_settings` | ServerQuery：修改服务器实例设置 | ServerQuery: Modify Server Instance Settings |
| 23 | `b_serverinstance_modify_querygroup` | 修改 ServerQuery 组 | Modify ServerQuery groups |
| 24 | `b_serverinstance_modify_templates` | 修改模板组 | Modify Template groups |
| 25 | `b_virtualserver_select` | ServerQuery：选择虚拟服务器 | ServerQuery: Select Virtual Server |
| 26 | `b_virtualserver_info_view` | ServerQuery：查看虚拟服务器信息 | ServerQuery: View Virtual Server Info |
| 27 | `b_virtualserver_connectioninfo_view` | 查看虚拟服务器连接信息 | View Virtual Server Connection Info |
| 28 | `b_virtualserver_channel_list` | ServerQuery：查看现有频道列表 | ServerQuery: View List of existing Channels |
| 29 | `b_virtualserver_channel_search` | ServerQuery：搜索频道 | ServerQuery: Search for Channels |
| 30 | `b_virtualserver_client_list` | ServerQuery：查看在线客户端列表 | ServerQuery: View List of Clients online |
| 31 | `b_virtualserver_client_search` | ServerQuery：搜索在线客户端 | ServerQuery: Search for Clients online |
| 32 | `b_virtualserver_client_dblist` | 查看数据库中已知客户端身份列表 | View List of known Client Identities from Database |
| 33 | `b_virtualserver_client_dbsearch` | 在数据库中搜索已知客户端身份 | Search for known Client Identities in Database |
| 34 | `b_virtualserver_client_dbinfo` | ServerQuery：查看客户端数据库信息 | ServerQuery: View Client Database Information |
| 35 | `b_virtualserver_permission_find` | ServerQuery：搜索权限分配 | ServerQuery: Search for Permission Assignments |
| 36 | `b_virtualserver_custom_search` | ServerQuery：搜索自定义客户端属性 | ServerQuery: Search for Custom Client Properties |
| 37 | `b_virtualserver_start` | ServerQuery：启动此虚拟服务器 | ServerQuery: Start this Virtual Server |
| 38 | `b_virtualserver_stop` | ServerQuery：停止此虚拟服务器 | ServerQuery: Stop this Virtual Server |
| 39 | `b_virtualserver_token_list` | 查看可用的特权密钥列表 | View List of available Privilege Keys |
| 40 | `b_virtualserver_token_add` | 创建新的特权密钥 | Create new Privilege Key |
| 41 | `b_virtualserver_token_use` | 使用特权密钥获取权限 | Use Privilege Keys to gain permissions |
| 42 | `b_virtualserver_token_delete` | 删除特权密钥 | Delete Privilege Key |
| 43 | `b_virtualserver_apikey_add` | 创建新的 API 密钥 | Create a new API key |
| 44 | `b_virtualserver_apikey_manage` | 管理现有 API 密钥 | Manage existing API keys |
| 45 | `b_virtualserver_log_view` | ServerQuery：查看虚拟服务器日志 | ServerQuery: View Virtual Server Logs |
| 46 | `b_virtualserver_log_add` | ServerQuery：写入虚拟服务器日志 | ServerQuery: Write to Virtual Server Log |
| 47 | `b_virtualserver_join_ignore_password` | 忽略虚拟服务器密码 | Ignore Virtual Server Password |
| 48 | `b_virtualserver_notify_register` | ServerQuery：注册事件通知 | ServerQuery: Register for Event Notifications |
| 49 | `b_virtualserver_notify_unregister` | ServerQuery：取消注册事件通知 | ServerQuery: Unregister from Event Notifications |
| 50 | `b_virtualserver_snapshot_create` | ServerQuery：备份服务器设置 | ServerQuery: Back Up Server Settings |
| 51 | `b_virtualserver_snapshot_deploy` | ServerQuery：恢复服务器设置 | ServerQuery: Restore Server Settings |
| 52 | `b_virtualserver_permission_reset` | ServerQuery：重置虚拟服务器权限设置 | ServerQuery: Reset Virtual Server Permission Settings |
| 53 | `b_virtualserver_canonical_name_manage` | 管理虚拟服务器的规范名称 | Manage canonical name of the virtual server |
| 54 | `b_virtualserver_modify_name` | 修改虚拟服务器名称 | Modify Virtual Server Name |
| 55 | `b_virtualserver_modify_welcomemessage` | 修改虚拟服务器欢迎信息 | Modify Virtual Server Welcome Message |
| 56 | `b_virtualserver_modify_maxclients` | 修改虚拟服务器客户端数量上限 | Modify Virtual Server Max Clients |
| 57 | `b_virtualserver_modify_reserved_slots` | 修改虚拟服务器预留空位 | Modify Virtual Server Reserved Slots |
| 58 | `b_virtualserver_modify_password` | 修改虚拟服务器密码 | Modify Virtual Server Password |
| 59 | `b_virtualserver_modify_default_servergroup` | 修改虚拟服务器默认服务器组 | Modify Virtual Server Default Server Group |
| 60 | `b_virtualserver_modify_default_channelgroup` | 修改虚拟服务器默认频道组 | Modify Virtual Server Default Channel Group |
| 61 | `b_virtualserver_modify_default_channeladmingroup` | 修改虚拟服务器频道管理组 | Modify Virtual Server Channel Admin Group |
| 62 | `b_virtualserver_modify_channel_forced_silence` | 修改虚拟服务器强制静音限制 | Modify Virtual Server Force Silence Limit |
| 63 | `b_virtualserver_modify_complain` | 修改虚拟服务器投诉设置 | Modify Virtual Server Complaint Settings |
| 64 | `b_virtualserver_modify_antiflood` | 修改虚拟服务器防洪设置 | Modify Virtual Server AntiFlood Settings |
| 65 | `b_virtualserver_modify_ft_settings` | 修改虚拟服务器文件传输设置 | Modify Virtual Server Filetransfer Settings |
| 66 | `b_virtualserver_modify_ft_quotas` | 修改虚拟服务器文件传输配额 | Modify Virtual Server Filetransfer Quotas |
| 67 | `b_virtualserver_modify_hostmessage` | 修改虚拟服务器主机消息 | Modify Virtual Server Host Message |
| 68 | `b_virtualserver_modify_hostbanner` | 修改虚拟服务器主机横幅 | Modify Virtual Server Host Banner |
| 69 | `b_virtualserver_modify_hostbutton` | 修改虚拟服务器主机按钮 | Modify Virtual Server Host Button |
| 70 | `b_virtualserver_modify_port` | 修改虚拟服务器端口 | Modify Virtual Server Port |
| 71 | `b_virtualserver_modify_autostart` | 修改虚拟服务器自启动行为 | Modify Virtual Server Autostart Behavior |
| 72 | `b_virtualserver_modify_needed_identity_security_level` | 修改虚拟服务器安全级别 | Modify Virtual Server Security Level |
| 73 | `b_virtualserver_modify_priority_speaker_dimm_modificator` | 修改虚拟服务器优先发言人音量控制 | Modify Virtual Server Priority Speaker Dim Modifier |
| 74 | `b_virtualserver_modify_log_settings` | 修改虚拟服务器日志设置 | Modify Virtual Server Log Settings |
| 75 | `b_virtualserver_modify_min_client_version` | 修改虚拟服务器最低客户端版本 | Modify Virtual Server Min Client Version |
| 76 | `b_virtualserver_modify_icon_id` | 修改虚拟服务器图标 ID | Modify Virtual Server Icon ID |
| 77 | `b_virtualserver_modify_weblist` | 修改网页列表上的虚拟服务器公告 | Modify Virtual Server Announcement on Weblist |
| 78 | `b_virtualserver_modify_codec_encryption_mode` | 修改虚拟服务器语音加密 | Modify Virtual Server Voice Encryption |
| 79 | `b_virtualserver_modify_temporary_passwords` | 管理服务器临时密码 | Manage temporary server passwords |
| 80 | `b_virtualserver_modify_temporary_passwords_own` | 管理自己的服务器临时密码 | Manage own temporary server passwords |
| 81 | `b_virtualserver_modify_channel_temp_delete_delay_default` | 编辑临时频道删除延迟默认值 | Edit default of temporary channel delete delay |
| 82 | `b_virtualserver_modify_nickname` | 修改虚拟服务器昵称 | Modify Virtual Server Nicknames |
| 83 | `b_virtualserver_modify_integrations` | 修改集成 | Modify Integrations |
| 84 | `b_virtualserver_modify_mytsid_connect` | 修改 myTSID 连接 | Modify myTSID connect |
| 85 | `i_channel_min_depth` | 频道最小深度 | Channel Min Depth |
| 86 | `i_channel_max_depth` | 频道最大深度 | Channel Max Depth |
| 87 | `b_channel_group_inheritance_end` | 停止频道组继承 | Stop Channel Group Inheritance |
| 88 | `i_channel_permission_modify_power` | 频道权限修改权限 | Channel Permission Modify Power |
| 89 | `i_channel_needed_permission_modify_power` | 必需频道权限修改权限 | Needed Channel Permission Modify Power |
| 90 | `b_channel_info_view` | ServerQuery：查看频道信息 | ServerQuery: View Channel Info |
| 91 | `b_channel_create_child` | 创建子频道 | Create Sub Channels |
| 92 | `b_channel_create_permanent` | 创建永久频道 | Create Permanent Channels |
| 93 | `b_channel_create_semi_permanent` | 创建半永久频道 | Create Semi Permanent Channels |
| 94 | `b_channel_create_temporary` | 创建临时频道 | Create Temporary Channels |
| 95 | `b_channel_create_with_topic` | 创建带主题的频道 | Create Channels with Topic |
| 96 | `b_channel_create_with_description` | 创建带描述的频道 | Create Channels with Description |
| 97 | `b_channel_create_with_password` | 创建带密码的频道 | Create Channels with Password |
| 98 | `b_channel_create_with_banner` | 创建带横幅的频道 | Create channel with a banner |
| 99 | `b_channel_create_modify_with_codec_opusvoice` | 创建使用 Opus 语音编解码器的频道 | Create Channels with Opus Voice Codec |
| 100 | `b_channel_create_modify_with_codec_opusmusic` | 创建使用 Opus 音乐编解码器的频道 | Create Channels with Opus Music Codec |
| 101 | `i_channel_create_modify_with_codec_maxquality` | 创建具有最高编解码器质量的频道 | Create Channels with Max Codec Quality |
| 102 | `i_channel_create_modify_with_codec_latency_factor_min` | 创建具有最小延迟系数的频道 | Create Channel with Minimum Latency Factor |
| 103 | `b_channel_create_with_maxclients` | 创建具有客户端数量上限的频道 | Create Channels with Max Clients |
| 104 | `b_channel_create_with_maxfamilyclients` | 创建具有最大系列客户端数量的频道 | Create Channels with Max Family Clients |
| 105 | `b_channel_create_with_sortorder` | 创建带排序顺序的频道 | Create Channels with Sort Order |
| 106 | `b_channel_create_with_default` | 创建默认频道 | Create Default Channel |
| 107 | `b_channel_create_with_needed_talk_power` | 创建需要发言权限的频道 | Create Channels with Needed Talk Power |
| 108 | `b_channel_create_modify_with_force_password` | 创建仅限密码访问的频道 | Create Channels with Password only |
| 109 | `i_channel_create_modify_with_temp_delete_delay` | 临时频道删除延迟 | Temporary channel delete delay |
| 110 | `b_channel_modify_parent` | 移动频道 | Move Channels |
| 111 | `b_channel_modify_make_default` | 将频道类型更改为默认 | Change Channel Type to Default |
| 112 | `b_channel_modify_make_permanent` | 将频道类型更改为永久 | Change Channel Type to Permanent |
| 113 | `b_channel_modify_make_semi_permanent` | 将频道类型更改为半永久 | Change Channel Type to Semi Permanent |
| 114 | `b_channel_modify_make_temporary` | 将频道类型更改为临时 | Change Channel Type to Temporary |
| 115 | `b_channel_modify_name` | 修改频道名称 | Modify Channel Name |
| 116 | `b_channel_modify_topic` | 修改频道主题 | Modify Channel Topic |
| 117 | `b_channel_modify_description` | 修改频道描述 | Modify Channel Description |
| 118 | `b_channel_modify_password` | 修改频道密码 | Modify Channel Password |
| 119 | `b_channel_modify_banner` | 修改频道横幅 | Modify channel banner |
| 120 | `b_channel_modify_codec` | 修改频道编解码器 | Modify Channel Codec |
| 121 | `b_channel_modify_codec_quality` | 修改频道编解码器质量 | Modify Channel Codec Quality |
| 122 | `b_channel_modify_codec_latency_factor` | 修改频道延迟系数 | Modify Channel Latency Factor |
| 123 | `b_channel_modify_maxclients` | 修改频道客户端数量上限 | Modify Channel Max Clients |
| 124 | `b_channel_modify_maxfamilyclients` | 修改频道最大系列客户端数量 | Modify Channel Max Family Clients |
| 125 | `b_channel_modify_sortorder` | 修改频道排序顺序 | Modify Channel Sort Order |
| 126 | `b_channel_modify_needed_talk_power` | 修改频道所需发言权限 | Modify Channel Needed Talk Power |
| 127 | `i_channel_modify_power` | 频道修改权限 | Channel Modify Power |
| 128 | `i_channel_needed_modify_power` | 必需频道修改权限 | Needed Channel Modify Power |
| 129 | `b_channel_modify_make_codec_encrypted` | 修改频道语音加密 | Modify Channel Voice Encryption |
| 130 | `b_channel_modify_temp_delete_delay` | 修改临时频道删除延迟 | Modify temporary channel delete delay |
| 131 | `b_channel_modify_ft_quotas` | 修改文件传输配额 | Modify file transfer quotas |
| 132 | `b_channel_delete_permanent` | 删除永久频道 | Delete Permanent Channels |
| 133 | `b_channel_delete_semi_permanent` | 删除半永久频道 | Delete Semi Permanent Channels |
| 134 | `b_channel_delete_temporary` | 删除临时频道 | Delete Temporary Channels |
| 135 | `b_channel_delete_flag_force` | 强制删除频道 | Force Deletion of Channels |
| 136 | `i_channel_delete_power` | 频道删除权限 | Channel Delete Power |
| 137 | `i_channel_needed_delete_power` | 必需频道删除权限 | Needed Channel Delete Power |
| 138 | `b_channel_join_permanent` | 加入永久频道 | Join Permanent Channels |
| 139 | `b_channel_join_semi_permanent` | 加入半永久频道 | Join Semi Permanent Channels |
| 140 | `b_channel_join_temporary` | 加入临时频道 | Join Temporary Channels |
| 141 | `b_channel_join_ignore_password` | 忽略频道密码 | Ignore Channel Passwords |
| 142 | `b_channel_join_ignore_maxclients` | 忽略频道客户端上限 | Ignore Channel Max Clients |
| 143 | `i_channel_join_power` | 频道加入权限 | Channel Join Power |
| 144 | `i_channel_needed_join_power` | 必需频道加入权限 | Needed Channel Join Power |
| 145 | `i_channel_subscribe_power` | 频道订阅权限 | Channel Subscribe Power |
| 146 | `i_channel_needed_subscribe_power` | 必需频道订阅权限 | Needed Channel Subscribe Power |
| 147 | `i_channel_description_view_power` | 频道描述查看权限 | Channel Description View Power |
| 148 | `i_channel_needed_description_view_power` | 必需频道描述查看权限 | Needed Channel Description View Power |
| 149 | `i_icon_id` | 图标 ID | Icon ID |
| 150 | `i_max_icon_filesize` | 图标最大文件大小（字节） | Icon Max file size (Bytes) |
| 151 | `b_icon_manage` | 管理图标 | Manage Icons |
| 152 | `b_group_is_permanent` | 组是永久的 | Group is Permanent |
| 153 | `i_group_auto_update_type` | 组自动更新类型 | Group Auto Update Type |
| 154 | `i_group_auto_update_max_value` | 组自动更新最大值 | Group Auto Update Max Value |
| 155 | `i_group_sort_id` | 组排序 ID | Group Sort ID |
| 156 | `i_group_show_name_in_tree` | 在树中显示组名称 | Show Group Name in Tree |
| 157 | `b_virtualserver_servergroup_list` | ServerQuery：查看服务器组列表 | ServerQuery: View List of Server Groups |
| 158 | `b_virtualserver_servergroup_permission_list` | 查看服务器组权限列表 | View List of Server Group Permissions |
| 159 | `b_virtualserver_servergroup_client_list` | 查看服务器组成员列表 | View List of Server Group Members |
| 160 | `b_virtualserver_channelgroup_list` | ServerQuery：查看频道组列表 | ServerQuery: View List of Channel Groups |
| 161 | `b_virtualserver_channelgroup_permission_list` | 查看频道组权限列表 | View List of Channel Group Permissions |
| 162 | `b_virtualserver_channelgroup_client_list` | 查看频道组成员列表 | View List of Channel Group Members |
| 163 | `b_virtualserver_client_permission_list` | 查看客户端权限列表 | View List of Client Permissions |
| 164 | `b_virtualserver_channel_permission_list` | 查看频道权限列表 | View List of Channel Permissions |
| 165 | `b_virtualserver_channelclient_permission_list` | 查看频道客户端权限列表 | View List of Channel Client Permissions |
| 166 | `b_virtualserver_servergroup_create` | 创建新的服务器组 | Create new Server Groups |
| 167 | `b_virtualserver_channelgroup_create` | 创建新的频道组 | Create new Channel Groups |
| 168 | `i_group_modify_power` | 组修改权限 | Group Modify Power |
| 169 | `i_group_needed_modify_power` | 必需组修改权限 | Needed Group Modify Power |
| 170 | `i_group_member_add_power` | 组成员添加权限 | Group Member Add Power |
| 171 | `i_group_needed_member_add_power` | 必需组成员添加权限 | Needed Group Member Add Power |
| 172 | `i_group_member_remove_power` | 组成员移除权限 | Group Member Remove Power |
| 173 | `i_group_needed_member_remove_power` | 必需组成员移除权限 | Needed Group Member Remove Power |
| 174 | `i_permission_modify_power` | 权限修改权限 | Permission Modify Power |
| 175 | `b_permission_modify_power_ignore` | 忽略权限修改能力 | Ignore Permission Modify Power |
| 176 | `b_virtualserver_servergroup_delete` | 删除现有服务器组 | Delete existing Server Group |
| 177 | `b_virtualserver_channelgroup_delete` | 删除现有频道组 | Delete existing Channel Group |
| 178 | `i_client_permission_modify_power` | 客户端权限修改权限 | Client Permission Modify Power |
| 179 | `i_client_needed_permission_modify_power` | 必需客户端权限修改权限 | Needed Client Permission Modify Power |
| 180 | `i_client_max_clones_uid` | 每身份最大附加连接数 | Max number of additional connections per Identity |
| 181 | `i_client_max_idletime` | 最大空闲时间（秒） | Max Idle time (Seconds) |
| 182 | `i_client_max_avatar_filesize` | 最大头像文件大小（字节） | Max Avatar file size (Bytes) |
| 183 | `i_client_max_channel_subscriptions` | 最大频道订阅数 | Max Channel Subscriptions |
| 184 | `b_client_is_priority_speaker` | 客户端是优先发言人 | Client is Priority Speaker |
| 185 | `b_client_skip_channelgroup_permissions` | 跳过频道组和频道权限 | Skip Channel Group & Channel Permissions |
| 186 | `b_client_force_push_to_talk` | 强制按键通话 | Force Push To Talk |
| 187 | `b_client_ignore_bans` | 忽略封禁 | Ignore Bans |
| 188 | `b_client_ignore_antiflood` | 忽略防洪测量 | Ignore AntiFlood Measurements |
| 189 | `b_client_use_reserved_slot` | 使用预留空位 | Use Reserved Slots |
| 190 | `b_client_use_channel_commander` | 使用频道指挥官 | Use Channel Commander |
| 191 | `b_client_request_talker` | 在受限制的频道中请求发言权限 | Request Talk Power in moderated channels |
| 192 | `b_client_avatar_delete_other` | 删除其他客户端头像 | Delete other clients avatar |
| 193 | `b_client_is_sticky` | 粘性客户端 | Sticky client |
| 194 | `b_client_ignore_sticky` | 忽略粘性客户端权限 | Ignore sticky client permission |
| 195 | `b_client_info_view` | ServerQuery：查看客户端信息 | ServerQuery: View Client Info |
| 196 | `b_client_permissionoverview_view` | 查看客户端权限概述 | View Client Permission Overview |
| 197 | `b_client_permissionoverview_own` | 查看自己的客户端权限概述 | View Own Client Permission Overview |
| 198 | `b_client_remoteaddress_view` | 查看客户端远端地址 | View Client Remote Address |
| 199 | `i_client_serverquery_view_power` | ServerQuery 客户端查看权限 | ServerQuery Client View Power |
| 200 | `i_client_needed_serverquery_view_power` | 必需 ServerQuery 客户端查看权限 | Needed ServerQuery Client View Power |
| 201 | `b_client_custom_info_view` | ServerQuery：查看自定义客户端属性 | ServerQuery: View Custom Client Properties |
| 202 | `i_client_kick_from_server_power` | 从服务器踢出客户端权限 | Client Kick From Server Power |
| 203 | `i_client_needed_kick_from_server_power` | 必需从服务器踢出客户端权限 | Needed Client Kick From Server Power |
| 204 | `i_client_kick_from_channel_power` | 从频道踢出客户端权限 | Client Kick from Channel Power |
| 205 | `i_client_needed_kick_from_channel_power` | 必需从频道踢出客户端权限 | Needed Client Kick from Channel Power |
| 206 | `i_client_ban_power` | 从服务器封禁客户端权限 | Client Ban From Server Power |
| 207 | `i_client_needed_ban_power` | 必需客户端封禁权限 | Needed Client Ban Power |
| 208 | `i_client_move_power` | 客户端移动权限 | Client Move Power |
| 209 | `i_client_needed_move_power` | 必需客户端移动权限 | Needed Client Move Power |
| 210 | `i_client_complain_power` | 客户端投诉权限 | Client Complain Power |
| 211 | `i_client_needed_complain_power` | 必需客户端投诉权限 | Needed Client Complain Power |
| 212 | `b_client_complain_list` | 查看客户端投诉列表 | View List of Client Complaints |
| 213 | `b_client_complain_delete_own` | 删除自己的投诉 | Delete own Complaints |
| 214 | `b_client_complain_delete` | 删除所有投诉 | Delete all Complaints |
| 215 | `b_client_ban_list` | 查看封禁规则列表 | View List of Ban Rules |
| 216 | `b_client_ban_create` | 创建新的封禁规则 | Create new Ban Rules |
| 217 | `b_client_ban_delete_own` | 删除自己的封禁规则 | Delete own Ban Rules |
| 218 | `b_client_ban_delete` | 删除所有封禁规则 | Delete all Ban Rules |
| 219 | `i_client_ban_max_bantime` | 封禁规则的最长时间（秒） | Max Time for Ban Rules in seconds |
| 220 | `b_channel_textmessage_delete` | 删除去中心化聊天消息 | Delete decentral chat messages |
| 221 | `i_client_private_textmessage_power` | 私人文本消息权限 | Private Textmessage Power |
| 222 | `i_client_needed_private_textmessage_power` | 必需私人文本消息权限 | Needed Private Textmessage Power |
| 223 | `b_client_server_textmessage_send` | 向服务器发送文本消息 | Send Text Messages to Server |
| 224 | `b_client_channel_textmessage_send` | 向频道发送文本消息 | Send Text Messages to Channel |
| 225 | `b_client_offline_textmessage_send` | 向离线客户端发送文本消息 | Send Text Messages to Offline Clients |
| 226 | `i_client_talk_power` | 客户端发言权限 | Client Talk Power |
| 227 | `i_client_needed_talk_power` | 必需客户端发言权限 | Needed Client Talk Power |
| 228 | `i_client_poke_power` | 客户端戳一戳权限 | Client Poke Power |
| 229 | `i_client_needed_poke_power` | 必需客户端戳一戳权限 | Needed Client Poke Power |
| 230 | `b_client_set_flag_talker` | 授予发言权限 | Grant Talk Power |
| 231 | `i_client_whisper_power` | 客户端密语权限 | Client Whisper Power |
| 232 | `i_client_needed_whisper_power` | 必需客户端密语权限 | Needed Client Whisper Power |
| 233 | `b_client_modify_description` | 修改所有客户端描述 | Modify all Client Descriptions |
| 234 | `b_client_modify_own_description` | 修改自己的客户端描述 | Modify own Client Description |
| 235 | `b_client_modify_dbproperties` | ServerQuery：修改客户端设置 | ServerQuery: Modify Client Settings |
| 236 | `b_client_delete_dbproperties` | 删除客户端数据库属性 | Delete Client Database Properties |
| 237 | `b_client_create_modify_serverquery_login` | 创建 ServerQuery 帐户 | Create a ServerQuery Account |
| 238 | `b_ft_ignore_password` | 浏览文件无需频道密码 | Browse files without channel password |
| 239 | `b_ft_transfer_list` | ServerQuery：查看活动文件传输列表 | ServerQuery: View List of active File Transfers |
| 240 | `i_ft_file_upload_power` | 文件上传权限 | File Upload Power |
| 241 | `i_ft_needed_file_upload_power` | 必需文件上传权限 | Needed File Upload Power |
| 242 | `i_ft_file_download_power` | 文件下载权限 | File Download Power |
| 243 | `i_ft_needed_file_download_power` | 必需文件下载权限 | Needed File Download Power |
| 244 | `i_ft_file_delete_power` | 文件删除权限 | File Delete Power |
| 245 | `i_ft_needed_file_delete_power` | 必需文件删除权限 | Needed File Delete Power |
| 246 | `i_ft_file_rename_power` | 文件重命名权限 | File Rename Power |
| 247 | `i_ft_needed_file_rename_power` | 必需文件重命名权限 | Needed File Rename Power |
| 248 | `i_ft_file_browse_power` | 文件浏览权限 | File Browse Power |
| 249 | `i_ft_needed_file_browse_power` | 必需文件浏览权限 | Needed File Browse Power |
| 250 | `i_ft_directory_create_power` | 目录创建权限 | Directory Create Power |
| 251 | `i_ft_needed_directory_create_power` | 必需目录创建权限 | Needed Directory Create Power |
| 252 | `i_ft_quota_mb_download_per_client` | 每客户端下载配额 (MB) | Download Quota per Client (MByte) |
| 253 | `i_ft_quota_mb_upload_per_client` | 每客户端上传配额 (MB) | Upload Quota per Client (MByte) |
| 254 | `i_ft_storage_mb_per_client` | 每客户端文件存储空间 (MB) | File Storage space per client in MByte |
| 255 | `i_ft_max_file_size_mb` | 文件上传的最大文件大小 | Maximum file size for file uploads |
| 32769 | `i_needed_modify_power_serverinstance_help_view` | ServerQuery：检索帮助文本 | ServerQuery: Retrieve Help Texts |
| 32770 | `i_needed_modify_power_serverinstance_info_view` | ServerQuery：检索主机和实例信息 | ServerQuery: Retrieve Host and Instance Info |
| 32771 | `i_needed_modify_power_serverinstance_virtualserver_list` | ServerQuery：检索虚拟服务器列表 | ServerQuery: Retrieve Virtual Server list |
| 32772 | `i_needed_modify_power_serverinstance_binding_list` | ServerQuery：检索服务器 IP 地址 | ServerQuery: Retrieve Server IP Addresses |
| 32773 | `i_needed_modify_power_serverinstance_permission_list` | ServerQuery：检索权限列表 | ServerQuery: Retrieve List of Permissions |
| 32774 | `i_needed_modify_power_serverinstance_permission_find` | ServerQuery：查找分配的权限 | ServerQuery: Find assigned Permissions |
| 32775 | `i_needed_modify_power_virtualserver_create` | ServerQuery：创建虚拟服务器 | ServerQuery: Create Virtual Server |
| 32776 | `i_needed_modify_power_virtualserver_delete` | ServerQuery：删除现有虚拟服务器 | ServerQuery: Delete existing Virtual Server |
| 32777 | `i_needed_modify_power_virtualserver_start_any` | ServerQuery：启动虚拟服务器 | ServerQuery: Start Virtual Servers |
| 32778 | `i_needed_modify_power_virtualserver_stop_any` | ServerQuery：停止虚拟服务器 | ServerQuery: Stop Virtual Servers |
| 32779 | `i_needed_modify_power_virtualserver_change_machine_id` | 修改虚拟服务器机器 ID | Modify Virtual Server Machine ID |
| 32780 | `i_needed_modify_power_virtualserver_change_template` | ServerQuery：编辑虚拟服务器模板 | ServerQuery: Edit virtual server template |
| 32781 | `i_needed_modify_power_serverquery_login` | ServerQuery：通过 ServerQuery 登录 | ServerQuery: Login via ServerQuery |
| 32782 | `i_needed_modify_power_serverquery_login_create` | 创建新的 ServerQuery 登录 | Create a new ServerQuery login |
| 32783 | `i_needed_modify_power_serverquery_login_delete` | 删除 ServerQuery 登录 | Delete a ServerQuery login |
| 32784 | `i_needed_modify_power_serverquery_login_list` | 列出 ServerQuery 登录 | List ServerQuery logins |
| 32785 | `i_needed_modify_power_serverinstance_textmessage_send` | ServerQuery：向所有人发送文本消息 | ServerQuery: Send Text Messages to Everyone |
| 32786 | `i_needed_modify_power_serverinstance_log_view` | ServerQuery：查看服务器实例日志 | ServerQuery: View Server Instance Logs |
| 32787 | `i_needed_modify_power_serverinstance_log_add` | ServerQuery：写入服务器实例日志 | ServerQuery: Write to Server Instance Logs |
| 32788 | `i_needed_modify_power_serverinstance_stop` | ServerQuery：停止服务器实例 | ServerQuery: Stop Server Instance |
| 32789 | `i_needed_modify_power_serverinstance_licensesign_message` | 使用许可证密钥签署任意消息 | Sign arbitrary message with license key |
| 32790 | `i_needed_modify_power_serverinstance_modify_settings` | ServerQuery：修改服务器实例设置 | ServerQuery: Modify Server Instance Settings |
| 32791 | `i_needed_modify_power_serverinstance_modify_querygroup` | 修改 ServerQuery 组 | Modify ServerQuery groups |
| 32792 | `i_needed_modify_power_serverinstance_modify_templates` | 修改模板组 | Modify Template groups |
| 32793 | `i_needed_modify_power_virtualserver_select` | ServerQuery：选择虚拟服务器 | ServerQuery: Select Virtual Server |
| 32794 | `i_needed_modify_power_virtualserver_info_view` | ServerQuery：查看虚拟服务器信息 | ServerQuery: View Virtual Server Info |
| 32795 | `i_needed_modify_power_virtualserver_connectioninfo_view` | 查看虚拟服务器连接信息 | View Virtual Server Connection Info |
| 32796 | `i_needed_modify_power_virtualserver_channel_list` | ServerQuery：查看现有频道列表 | ServerQuery: View List of existing Channels |
| 32797 | `i_needed_modify_power_virtualserver_channel_search` | ServerQuery：搜索频道 | ServerQuery: Search for Channels |
| 32798 | `i_needed_modify_power_virtualserver_client_list` | ServerQuery：查看在线客户端列表 | ServerQuery: View List of Clients online |
| 32799 | `i_needed_modify_power_virtualserver_client_search` | ServerQuery：搜索在线客户端 | ServerQuery: Search for Clients online |
| 32800 | `i_needed_modify_power_virtualserver_client_dblist` | 查看数据库中已知客户端身份列表 | View List of known Client Identities from Database |
| 32801 | `i_needed_modify_power_virtualserver_client_dbsearch` | 在数据库中搜索已知客户端身份 | Search for known Client Identities in Database |
| 32802 | `i_needed_modify_power_virtualserver_client_dbinfo` | ServerQuery：查看客户端数据库信息 | ServerQuery: View Client Database Information |
| 32803 | `i_needed_modify_power_virtualserver_permission_find` | ServerQuery：搜索权限分配 | ServerQuery: Search for Permission Assignments |
| 32804 | `i_needed_modify_power_virtualserver_custom_search` | ServerQuery：搜索自定义客户端属性 | ServerQuery: Search for Custom Client Properties |
| 32805 | `i_needed_modify_power_virtualserver_start` | ServerQuery：启动此虚拟服务器 | ServerQuery: Start this Virtual Server |
| 32806 | `i_needed_modify_power_virtualserver_stop` | ServerQuery：停止此虚拟服务器 | ServerQuery: Stop this Virtual Server |
| 32807 | `i_needed_modify_power_virtualserver_token_list` | 查看可用的特权密钥列表 | View List of available Privilege Keys |
| 32808 | `i_needed_modify_power_virtualserver_token_add` | 创建新的特权密钥 | Create new Privilege Key |
| 32809 | `i_needed_modify_power_virtualserver_token_use` | 使用特权密钥获取权限 | Use Privilege Keys to gain permissions |
| 32810 | `i_needed_modify_power_virtualserver_token_delete` | 删除特权密钥 | Delete Privilege Key |
| 32811 | `i_needed_modify_power_virtualserver_apikey_add` | 创建新的 API 密钥 | Create a new API key |
| 32812 | `i_needed_modify_power_virtualserver_apikey_manage` | 管理现有 API 密钥 | Manage existing API keys |
| 32813 | `i_needed_modify_power_virtualserver_log_view` | ServerQuery：查看虚拟服务器日志 | ServerQuery: View Virtual Server Logs |
| 32814 | `i_needed_modify_power_virtualserver_log_add` | ServerQuery：写入虚拟服务器日志 | ServerQuery: Write to Virtual Server Log |
| 32815 | `i_needed_modify_power_virtualserver_join_ignore_password` | 忽略虚拟服务器密码 | Ignore Virtual Server Password |
| 32816 | `i_needed_modify_power_virtualserver_notify_register` | ServerQuery：注册事件通知 | ServerQuery: Register for Event Notifications |
| 32817 | `i_needed_modify_power_virtualserver_notify_unregister` | ServerQuery：取消注册事件通知 | ServerQuery: Unregister from Event Notifications |
| 32818 | `i_needed_modify_power_virtualserver_snapshot_create` | ServerQuery：备份服务器设置 | ServerQuery: Back Up Server Settings |
| 32819 | `i_needed_modify_power_virtualserver_snapshot_deploy` | ServerQuery：恢复服务器设置 | ServerQuery: Restore Server Settings |
| 32820 | `i_needed_modify_power_virtualserver_permission_reset` | ServerQuery：重置虚拟服务器权限设置 | ServerQuery: Reset Virtual Server Permission Settings |
| 32821 | `i_needed_modify_power_virtualserver_canonical_name_manage` | 管理虚拟服务器的规范名称 | Manage canonical name of the virtual server |
| 32822 | `i_needed_modify_power_virtualserver_modify_name` | 修改虚拟服务器名称 | Modify Virtual Server Name |
| 32823 | `i_needed_modify_power_virtualserver_modify_welcomemessage` | 修改虚拟服务器欢迎信息 | Modify Virtual Server Welcome Message |
| 32824 | `i_needed_modify_power_virtualserver_modify_maxclients` | 修改虚拟服务器客户端数量上限 | Modify Virtual Server Max Clients |
| 32825 | `i_needed_modify_power_virtualserver_modify_reserved_slots` | 修改虚拟服务器预留空位 | Modify Virtual Server Reserved Slots |
| 32826 | `i_needed_modify_power_virtualserver_modify_password` | 修改虚拟服务器密码 | Modify Virtual Server Password |
| 32827 | `i_needed_modify_power_virtualserver_modify_default_servergroup` | 修改虚拟服务器默认服务器组 | Modify Virtual Server Default Server Group |
| 32828 | `i_needed_modify_power_virtualserver_modify_default_channelgroup` | 修改虚拟服务器默认频道组 | Modify Virtual Server Default Channel Group |
| 32829 | `i_needed_modify_power_virtualserver_modify_default_channeladmingroup` | 修改虚拟服务器频道管理组 | Modify Virtual Server Channel Admin Group |
| 32830 | `i_needed_modify_power_virtualserver_modify_channel_forced_silence` | 修改虚拟服务器强制静音限制 | Modify Virtual Server Force Silence Limit |
| 32831 | `i_needed_modify_power_virtualserver_modify_complain` | 修改虚拟服务器投诉设置 | Modify Virtual Server Complaint Settings |
| 32832 | `i_needed_modify_power_virtualserver_modify_antiflood` | 修改虚拟服务器防洪设置 | Modify Virtual Server AntiFlood Settings |
| 32833 | `i_needed_modify_power_virtualserver_modify_ft_settings` | 修改虚拟服务器文件传输设置 | Modify Virtual Server Filetransfer Settings |
| 32834 | `i_needed_modify_power_virtualserver_modify_ft_quotas` | 修改虚拟服务器文件传输配额 | Modify Virtual Server Filetransfer Quotas |
| 32835 | `i_needed_modify_power_virtualserver_modify_hostmessage` | 修改虚拟服务器主机消息 | Modify Virtual Server Host Message |
| 32836 | `i_needed_modify_power_virtualserver_modify_hostbanner` | 修改虚拟服务器主机横幅 | Modify Virtual Server Host Banner |
| 32837 | `i_needed_modify_power_virtualserver_modify_hostbutton` | 修改虚拟服务器主机按钮 | Modify Virtual Server Host Button |
| 32838 | `i_needed_modify_power_virtualserver_modify_port` | 修改虚拟服务器端口 | Modify Virtual Server Port |
| 32839 | `i_needed_modify_power_virtualserver_modify_autostart` | 修改虚拟服务器自启动行为 | Modify Virtual Server Autostart Behavior |
| 32840 | `i_needed_modify_power_virtualserver_modify_needed_identity_security_level` | 修改虚拟服务器安全级别 | Modify Virtual Server Security Level |
| 32841 | `i_needed_modify_power_virtualserver_modify_priority_speaker_dimm_modificator` | 修改虚拟服务器优先发言人音量控制 | Modify Virtual Server Priority Speaker Dim Modifier |
| 32842 | `i_needed_modify_power_virtualserver_modify_log_settings` | 修改虚拟服务器日志设置 | Modify Virtual Server Log Settings |
| 32843 | `i_needed_modify_power_virtualserver_modify_min_client_version` | 修改虚拟服务器最低客户端版本 | Modify Virtual Server Min Client Version |
| 32844 | `i_needed_modify_power_virtualserver_modify_icon_id` | 修改虚拟服务器图标 ID | Modify Virtual Server Icon ID |
| 32845 | `i_needed_modify_power_virtualserver_modify_weblist` | 修改网页列表上的虚拟服务器公告 | Modify Virtual Server Announcement on Weblist |
| 32846 | `i_needed_modify_power_virtualserver_modify_codec_encryption_mode` | 修改虚拟服务器语音加密 | Modify Virtual Server Voice Encryption |
| 32847 | `i_needed_modify_power_virtualserver_modify_temporary_passwords` | 管理服务器临时密码 | Manage temporary server passwords |
| 32848 | `i_needed_modify_power_virtualserver_modify_temporary_passwords_own` | 管理自己的服务器临时密码 | Manage own temporary server passwords |
| 32849 | `i_needed_modify_power_virtualserver_modify_channel_temp_delete_delay_default` | 编辑临时频道删除延迟默认值 | Edit default of temporary channel delete delay |
| 32850 | `i_needed_modify_power_virtualserver_modify_nickname` | 修改虚拟服务器昵称 | Modify Virtual Server Nicknames |
| 32851 | `i_needed_modify_power_virtualserver_modify_integrations` | 修改集成 | Modify Integrations |
| 32852 | `i_needed_modify_power_virtualserver_modify_mytsid_connect` | 修改 myTSID 连接 | Modify myTSID connect |
| 32853 | `i_needed_modify_power_channel_min_depth` | 频道最小深度 | Channel Min Depth |
| 32854 | `i_needed_modify_power_channel_max_depth` | 频道最大深度 | Channel Max Depth |
| 32855 | `i_needed_modify_power_channel_group_inheritance_end` | 停止频道组继承 | Stop Channel Group Inheritance |
| 32856 | `i_needed_modify_power_channel_permission_modify_power` | 频道权限修改权限 | Channel Permission Modify Power |
| 32857 | `i_needed_modify_power_channel_needed_permission_modify_power` | 必需频道权限修改权限 | Needed Channel Permission Modify Power |
| 32858 | `i_needed_modify_power_channel_info_view` | ServerQuery：查看频道信息 | ServerQuery: View Channel Info |
| 32859 | `i_needed_modify_power_channel_create_child` | 创建子频道 | Create Sub Channels |
| 32860 | `i_needed_modify_power_channel_create_permanent` | 创建永久频道 | Create Permanent Channels |
| 32861 | `i_needed_modify_power_channel_create_semi_permanent` | 创建半永久频道 | Create Semi Permanent Channels |
| 32862 | `i_needed_modify_power_channel_create_temporary` | 创建临时频道 | Create Temporary Channels |
| 32863 | `i_needed_modify_power_channel_create_with_topic` | 创建带主题的频道 | Create Channels with Topic |
| 32864 | `i_needed_modify_power_channel_create_with_description` | 创建带描述的频道 | Create Channels with Description |
| 32865 | `i_needed_modify_power_channel_create_with_password` | 创建带密码的频道 | Create Channels with Password |
| 32866 | `i_needed_modify_power_channel_create_with_banner` | 创建带横幅的频道 | Create channel with a banner |
| 32867 | `i_needed_modify_power_channel_create_modify_with_codec_opusvoice` | 创建使用 Opus 语音编解码器的频道 | Create Channels with Opus Voice Codec |
| 32868 | `i_needed_modify_power_channel_create_modify_with_codec_opusmusic` | 创建使用 Opus 音乐编解码器的频道 | Create Channels with Opus Music Codec |
| 32869 | `i_needed_modify_power_channel_create_modify_with_codec_maxquality` | 创建具有最高编解码器质量的频道 | Create Channels with Max Codec Quality |
| 32870 | `i_needed_modify_power_channel_create_modify_with_codec_latency_factor_min` | 创建具有最小延迟系数的频道 | Create Channel with Minimum Latency Factor |
| 32871 | `i_needed_modify_power_channel_create_with_maxclients` | 创建具有客户端数量上限的频道 | Create Channels with Max Clients |
| 32872 | `i_needed_modify_power_channel_create_with_maxfamilyclients` | 创建具有最大系列客户端数量的频道 | Create Channels with Max Family Clients |
| 32873 | `i_needed_modify_power_channel_create_with_sortorder` | 创建带排序顺序的频道 | Create Channels with Sort Order |
| 32874 | `i_needed_modify_power_channel_create_with_default` | 创建默认频道 | Create Default Channel |
| 32875 | `i_needed_modify_power_channel_create_with_needed_talk_power` | 创建需要发言权限的频道 | Create Channels with Needed Talk Power |
| 32876 | `i_needed_modify_power_channel_create_modify_with_force_password` | 创建仅限密码访问的频道 | Create Channels with Password only |
| 32877 | `i_needed_modify_power_channel_create_modify_with_temp_delete_delay` | 临时频道删除延迟 | Temporary channel delete delay |
| 32878 | `i_needed_modify_power_channel_modify_parent` | 移动频道 | Move Channels |
| 32879 | `i_needed_modify_power_channel_modify_make_default` | 将频道类型更改为默认 | Change Channel Type to Default |
| 32880 | `i_needed_modify_power_channel_modify_make_permanent` | 将频道类型更改为永久 | Change Channel Type to Permanent |
| 32881 | `i_needed_modify_power_channel_modify_make_semi_permanent` | 将频道类型更改为半永久 | Change Channel Type to Semi Permanent |
| 32882 | `i_needed_modify_power_channel_modify_make_temporary` | 将频道类型更改为临时 | Change Channel Type to Temporary |
| 32883 | `i_needed_modify_power_channel_modify_name` | 修改频道名称 | Modify Channel Name |
| 32884 | `i_needed_modify_power_channel_modify_topic` | 修改频道主题 | Modify Channel Topic |
| 32885 | `i_needed_modify_power_channel_modify_description` | 修改频道描述 | Modify Channel Description |
| 32886 | `i_needed_modify_power_channel_modify_password` | 修改频道密码 | Modify Channel Password |
| 32887 | `i_needed_modify_power_channel_modify_banner` | 修改频道横幅 | Modify channel banner |
| 32888 | `i_needed_modify_power_channel_modify_codec` | 修改频道编解码器 | Modify Channel Codec |
| 32889 | `i_needed_modify_power_channel_modify_codec_quality` | 修改频道编解码器质量 | Modify Channel Codec Quality |
| 32890 | `i_needed_modify_power_channel_modify_codec_latency_factor` | 修改频道延迟系数 | Modify Channel Latency Factor |
| 32891 | `i_needed_modify_power_channel_modify_maxclients` | 修改频道客户端数量上限 | Modify Channel Max Clients |
| 32892 | `i_needed_modify_power_channel_modify_maxfamilyclients` | 修改频道最大系列客户端数量 | Modify Channel Max Family Clients |
| 32893 | `i_needed_modify_power_channel_modify_sortorder` | 修改频道排序顺序 | Modify Channel Sort Order |
| 32894 | `i_needed_modify_power_channel_modify_needed_talk_power` | 修改频道所需发言权限 | Modify Channel Needed Talk Power |
| 32895 | `i_needed_modify_power_channel_modify_power` | 频道修改权限 | Channel Modify Power |
| 32896 | `i_needed_modify_power_channel_needed_modify_power` | 必需频道修改权限 | Needed Channel Modify Power |
| 32897 | `i_needed_modify_power_channel_modify_make_codec_encrypted` | 修改频道语音加密 | Modify Channel Voice Encryption |
| 32898 | `i_needed_modify_power_channel_modify_temp_delete_delay` | 修改临时频道删除延迟 | Modify temporary channel delete delay |
| 32899 | `i_needed_modify_power_channel_modify_ft_quotas` | 修改文件传输配额 | Modify file transfer quotas |
| 32900 | `i_needed_modify_power_channel_delete_permanent` | 删除永久频道 | Delete Permanent Channels |
| 32901 | `i_needed_modify_power_channel_delete_semi_permanent` | 删除半永久频道 | Delete Semi Permanent Channels |
| 32902 | `i_needed_modify_power_channel_delete_temporary` | 删除临时频道 | Delete Temporary Channels |
| 32903 | `i_needed_modify_power_channel_delete_flag_force` | 强制删除频道 | Force Deletion of Channels |
| 32904 | `i_needed_modify_power_channel_delete_power` | 频道删除权限 | Channel Delete Power |
| 32905 | `i_needed_modify_power_channel_needed_delete_power` | 必需频道删除权限 | Needed Channel Delete Power |
| 32906 | `i_needed_modify_power_channel_join_permanent` | 加入永久频道 | Join Permanent Channels |
| 32907 | `i_needed_modify_power_channel_join_semi_permanent` | 加入半永久频道 | Join Semi Permanent Channels |
| 32908 | `i_needed_modify_power_channel_join_temporary` | 加入临时频道 | Join Temporary Channels |
| 32909 | `i_needed_modify_power_channel_join_ignore_password` | 忽略频道密码 | Ignore Channel Passwords |
| 32910 | `i_needed_modify_power_channel_join_ignore_maxclients` | 忽略频道客户端上限 | Ignore Channel Max Clients |
| 32911 | `i_needed_modify_power_channel_join_power` | 频道加入权限 | Channel Join Power |
| 32912 | `i_needed_modify_power_channel_needed_join_power` | 必需频道加入权限 | Needed Channel Join Power |
| 32913 | `i_needed_modify_power_channel_subscribe_power` | 频道订阅权限 | Channel Subscribe Power |
| 32914 | `i_needed_modify_power_channel_needed_subscribe_power` | 必需频道订阅权限 | Needed Channel Subscribe Power |
| 32915 | `i_needed_modify_power_channel_description_view_power` | 频道描述查看权限 | Channel Description View Power |
| 32916 | `i_needed_modify_power_channel_needed_description_view_power` | 必需频道描述查看权限 | Needed Channel Description View Power |
| 32917 | `i_needed_modify_power_icon_id` | 图标 ID | Icon ID |
| 32918 | `i_needed_modify_power_max_icon_filesize` | 图标最大文件大小（字节） | Icon Max file size (Bytes) |
| 32919 | `i_needed_modify_power_icon_manage` | 管理图标 | Manage Icons |
| 32920 | `i_needed_modify_power_group_is_permanent` | 组是永久的 | Group is Permanent |
| 32921 | `i_needed_modify_power_group_auto_update_type` | 组自动更新类型 | Group Auto Update Type |
| 32922 | `i_needed_modify_power_group_auto_update_max_value` | 组自动更新最大值 | Group Auto Update Max Value |
| 32923 | `i_needed_modify_power_group_sort_id` | 组排序 ID | Group Sort ID |
| 32924 | `i_needed_modify_power_group_show_name_in_tree` | 在树中显示组名称 | Show Group Name in Tree |
| 32925 | `i_needed_modify_power_virtualserver_servergroup_list` | ServerQuery：查看服务器组列表 | ServerQuery: View List of Server Groups |
| 32926 | `i_needed_modify_power_virtualserver_servergroup_permission_list` | 查看服务器组权限列表 | View List of Server Group Permissions |
| 32927 | `i_needed_modify_power_virtualserver_servergroup_client_list` | 查看服务器组成员列表 | View List of Server Group Members |
| 32928 | `i_needed_modify_power_virtualserver_channelgroup_list` | ServerQuery：查看频道组列表 | ServerQuery: View List of Channel Groups |
| 32929 | `i_needed_modify_power_virtualserver_channelgroup_permission_list` | 查看频道组权限列表 | View List of Channel Group Permissions |
| 32930 | `i_needed_modify_power_virtualserver_channelgroup_client_list` | 查看频道组成员列表 | View List of Channel Group Members |
| 32931 | `i_needed_modify_power_virtualserver_client_permission_list` | 查看客户端权限列表 | View List of Client Permissions |
| 32932 | `i_needed_modify_power_virtualserver_channel_permission_list` | 查看频道权限列表 | View List of Channel Permissions |
| 32933 | `i_needed_modify_power_virtualserver_channelclient_permission_list` | 查看频道客户端权限列表 | View List of Channel Client Permissions |
| 32934 | `i_needed_modify_power_virtualserver_servergroup_create` | 创建新的服务器组 | Create new Server Groups |
| 32935 | `i_needed_modify_power_virtualserver_channelgroup_create` | 创建新的频道组 | Create new Channel Groups |
| 32936 | `i_needed_modify_power_group_modify_power` | 组修改权限 | Group Modify Power |
| 32937 | `i_needed_modify_power_group_needed_modify_power` | 必需组修改权限 | Needed Group Modify Power |
| 32938 | `i_needed_modify_power_group_member_add_power` | 组成员添加权限 | Group Member Add Power |
| 32939 | `i_needed_modify_power_group_needed_member_add_power` | 必需组成员添加权限 | Needed Group Member Add Power |
| 32940 | `i_needed_modify_power_group_member_remove_power` | 组成员移除权限 | Group Member Remove Power |
| 32941 | `i_needed_modify_power_group_needed_member_remove_power` | 必需组成员移除权限 | Needed Group Member Remove Power |
| 32942 | `i_needed_modify_power_permission_modify_power` | 权限修改权限 | Permission Modify Power |
| 32943 | `i_needed_modify_power_permission_modify_power_ignore` | 忽略权限修改能力 | Ignore Permission Modify Power |
| 32944 | `i_needed_modify_power_virtualserver_servergroup_delete` | 删除现有服务器组 | Delete existing Server Group |
| 32945 | `i_needed_modify_power_virtualserver_channelgroup_delete` | 删除现有频道组 | Delete existing Channel Group |
| 32946 | `i_needed_modify_power_client_permission_modify_power` | 客户端权限修改权限 | Client Permission Modify Power |
| 32947 | `i_needed_modify_power_client_needed_permission_modify_power` | 必需客户端权限修改权限 | Needed Client Permission Modify Power |
| 32948 | `i_needed_modify_power_client_max_clones_uid` | 每身份最大附加连接数 | Max number of additional connections per Identity |
| 32949 | `i_needed_modify_power_client_max_idletime` | 最大空闲时间（秒） | Max Idle time (Seconds) |
| 32950 | `i_needed_modify_power_client_max_avatar_filesize` | 最大头像文件大小（字节） | Max Avatar file size (Bytes) |
| 32951 | `i_needed_modify_power_client_max_channel_subscriptions` | 最大频道订阅数 | Max Channel Subscriptions |
| 32952 | `i_needed_modify_power_client_is_priority_speaker` | 客户端是优先发言人 | Client is Priority Speaker |
| 32953 | `i_needed_modify_power_client_skip_channelgroup_permissions` | 跳过频道组和频道权限 | Skip Channel Group & Channel Permissions |
| 32954 | `i_needed_modify_power_client_force_push_to_talk` | 强制按键通话 | Force Push To Talk |
| 32955 | `i_needed_modify_power_client_ignore_bans` | 忽略封禁 | Ignore Bans |
| 32956 | `i_needed_modify_power_client_ignore_antiflood` | 忽略防洪测量 | Ignore AntiFlood Measurements |
| 32957 | `i_needed_modify_power_client_use_reserved_slot` | 使用预留空位 | Use Reserved Slots |
| 32958 | `i_needed_modify_power_client_use_channel_commander` | 使用频道指挥官 | Use Channel Commander |
| 32959 | `i_needed_modify_power_client_request_talker` | 在受限制的频道中请求发言权限 | Request Talk Power in moderated channels |
| 32960 | `i_needed_modify_power_client_avatar_delete_other` | 删除其他客户端头像 | Delete other clients avatar |
| 32961 | `i_needed_modify_power_client_is_sticky` | 粘性客户端 | Sticky client |
| 32962 | `i_needed_modify_power_client_ignore_sticky` | 忽略粘性客户端权限 | Ignore sticky client permission |
| 32963 | `i_needed_modify_power_client_info_view` | ServerQuery：查看客户端信息 | ServerQuery: View Client Info |
| 32964 | `i_needed_modify_power_client_permissionoverview_view` | 查看客户端权限概述 | View Client Permission Overview |
| 32965 | `i_needed_modify_power_client_permissionoverview_own` | 查看自己的客户端权限概述 | View Own Client Permission Overview |
| 32966 | `i_needed_modify_power_client_remoteaddress_view` | 查看客户端远端地址 | View Client Remote Address |
| 32967 | `i_needed_modify_power_client_serverquery_view_power` | ServerQuery 客户端查看权限 | ServerQuery Client View Power |
| 32968 | `i_needed_modify_power_client_needed_serverquery_view_power` | 必需 ServerQuery 客户端查看权限 | Needed ServerQuery Client View Power |
| 32969 | `i_needed_modify_power_client_custom_info_view` | ServerQuery：查看自定义客户端属性 | ServerQuery: View Custom Client Properties |
| 32970 | `i_needed_modify_power_client_kick_from_server_power` | 从服务器踢出客户端权限 | Client Kick From Server Power |
| 32971 | `i_needed_modify_power_client_needed_kick_from_server_power` | 必需从服务器踢出客户端权限 | Needed Client Kick From Server Power |
| 32972 | `i_needed_modify_power_client_kick_from_channel_power` | 从频道踢出客户端权限 | Client Kick from Channel Power |
| 32973 | `i_needed_modify_power_client_needed_kick_from_channel_power` | 必需从频道踢出客户端权限 | Needed Client Kick from Channel Power |
| 32974 | `i_needed_modify_power_client_ban_power` | 从服务器封禁客户端权限 | Client Ban From Server Power |
| 32975 | `i_needed_modify_power_client_needed_ban_power` | 必需客户端封禁权限 | Needed Client Ban Power |
| 32976 | `i_needed_modify_power_client_move_power` | 客户端移动权限 | Client Move Power |
| 32977 | `i_needed_modify_power_client_needed_move_power` | 必需客户端移动权限 | Needed Client Move Power |
| 32978 | `i_needed_modify_power_client_complain_power` | 客户端投诉权限 | Client Complain Power |
| 32979 | `i_needed_modify_power_client_needed_complain_power` | 必需客户端投诉权限 | Needed Client Complain Power |
| 32980 | `i_needed_modify_power_client_complain_list` | 查看客户端投诉列表 | View List of Client Complaints |
| 32981 | `i_needed_modify_power_client_complain_delete_own` | 删除自己的投诉 | Delete own Complaints |
| 32982 | `i_needed_modify_power_client_complain_delete` | 删除所有投诉 | Delete all Complaints |
| 32983 | `i_needed_modify_power_client_ban_list` | 查看封禁规则列表 | View List of Ban Rules |
| 32984 | `i_needed_modify_power_client_ban_create` | 创建新的封禁规则 | Create new Ban Rules |
| 32985 | `i_needed_modify_power_client_ban_delete_own` | 删除自己的封禁规则 | Delete own Ban Rules |
| 32986 | `i_needed_modify_power_client_ban_delete` | 删除所有封禁规则 | Delete all Ban Rules |
| 32987 | `i_needed_modify_power_client_ban_max_bantime` | 封禁规则的最长时间（秒） | Max Time for Ban Rules in seconds |
| 32988 | `i_needed_modify_power_channel_textmessage_delete` | 删除去中心化聊天消息 | Delete decentral chat messages |
| 32989 | `i_needed_modify_power_client_private_textmessage_power` | 私人文本消息权限 | Private Textmessage Power |
| 32990 | `i_needed_modify_power_client_needed_private_textmessage_power` | 必需私人文本消息权限 | Needed Private Textmessage Power |
| 32991 | `i_needed_modify_power_client_server_textmessage_send` | 向服务器发送文本消息 | Send Text Messages to Server |
| 32992 | `i_needed_modify_power_client_channel_textmessage_send` | 向频道发送文本消息 | Send Text Messages to Channel |
| 32993 | `i_needed_modify_power_client_offline_textmessage_send` | 向离线客户端发送文本消息 | Send Text Messages to Offline Clients |
| 32994 | `i_needed_modify_power_client_talk_power` | 客户端发言权限 | Client Talk Power |
| 32995 | `i_needed_modify_power_client_needed_talk_power` | 必需客户端发言权限 | Needed Client Talk Power |
| 32996 | `i_needed_modify_power_client_poke_power` | 客户端戳一戳权限 | Client Poke Power |
| 32997 | `i_needed_modify_power_client_needed_poke_power` | 必需客户端戳一戳权限 | Needed Client Poke Power |
| 32998 | `i_needed_modify_power_client_set_flag_talker` | 授予发言权限 | Grant Talk Power |
| 32999 | `i_needed_modify_power_client_whisper_power` | 客户端密语权限 | Client Whisper Power |
| 33000 | `i_needed_modify_power_client_needed_whisper_power` | 必需客户端密语权限 | Needed Client Whisper Power |
| 33001 | `i_needed_modify_power_client_modify_description` | 修改所有客户端描述 | Modify all Client Descriptions |
| 33002 | `i_needed_modify_power_client_modify_own_description` | 修改自己的客户端描述 | Modify own Client Description |
| 33003 | `i_needed_modify_power_client_modify_dbproperties` | ServerQuery：修改客户端设置 | ServerQuery: Modify Client Settings |
| 33004 | `i_needed_modify_power_client_delete_dbproperties` | 删除客户端数据库属性 | Delete Client Database Properties |
| 33005 | `i_needed_modify_power_client_create_modify_serverquery_login` | 创建 ServerQuery 帐户 | Create a ServerQuery Account |
| 33006 | `i_needed_modify_power_ft_ignore_password` | 浏览文件无需频道密码 | Browse files without channel password |
| 33007 | `i_needed_modify_power_ft_transfer_list` | ServerQuery：查看活动文件传输列表 | ServerQuery: View List of active File Transfers |
| 33008 | `i_needed_modify_power_ft_file_upload_power` | 文件上传权限 | File Upload Power |
| 33009 | `i_needed_modify_power_ft_needed_file_upload_power` | 必需文件上传权限 | Needed File Upload Power |
| 33010 | `i_needed_modify_power_ft_file_download_power` | 文件下载权限 | File Download Power |
| 33011 | `i_needed_modify_power_ft_needed_file_download_power` | 必需文件下载权限 | Needed File Download Power |
| 33012 | `i_needed_modify_power_ft_file_delete_power` | 文件删除权限 | File Delete Power |
| 33013 | `i_needed_modify_power_ft_needed_file_delete_power` | 必需文件删除权限 | Needed File Delete Power |
| 33014 | `i_needed_modify_power_ft_file_rename_power` | 文件重命名权限 | File Rename Power |
| 33015 | `i_needed_modify_power_ft_needed_file_rename_power` | 必需文件重命名权限 | Needed File Rename Power |
| 33016 | `i_needed_modify_power_ft_file_browse_power` | 文件浏览权限 | File Browse Power |
| 33017 | `i_needed_modify_power_ft_needed_file_browse_power` | 必需文件浏览权限 | Needed File Browse Power |
| 33018 | `i_needed_modify_power_ft_directory_create_power` | 目录创建权限 | Directory Create Power |
| 33019 | `i_needed_modify_power_ft_needed_directory_create_power` | 必需目录创建权限 | Needed Directory Create Power |
| 33020 | `i_needed_modify_power_ft_quota_mb_download_per_client` | 每客户端下载配额 (MB) | Download Quota per Client (MByte) |
| 33021 | `i_needed_modify_power_ft_quota_mb_upload_per_client` | 每客户端上传配额 (MB) | Upload Quota per Client (MByte) |
| 33022 | `i_needed_modify_power_ft_storage_mb_per_client` | 每客户端文件存储空间 (MB) | File Storage space per client in MByte |
| 33023 | `i_needed_modify_power_ft_max_file_size_mb` | 文件上传的最大文件大小 | Maximum file size for file uploads |

## 客户端语言包中额外存在的权限

以下 3 个权限存在于 TeamSpeak 客户端官方中文语言包，但本次服务端 `permissionlist` 报文中没有返回，因此没有服务端权限 ID：

| 权限 ID | 权限节点 | 官方中文描述 | Official English Description |
|---:|---|---|---|
| — | `b_virtualserver_homebase_list` | 列出将此虚拟服务器设置为 Homebase 的客户端 | List clients that have set this virtual server as Homebase |
| — | `b_virtualserver_homebase_manage` | 管理 Homebase 客户端列表 | Manage Homebase client list |
| — | `b_virtualserver_homebase_set` | 允许将此虚拟服务器设置为 Homebase | Allowed to set this virtual server as Homebase |
