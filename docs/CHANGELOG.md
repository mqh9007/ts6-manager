# Changelog

## [Unreleased] - 2026-09-04

### Added

- Added `!help` and `!帮助` commands to display all available music bot commands and usage examples.
- Added Chinese aliases for music bot commands, including playback, queue, playlist, volume, video, and streaming commands.
- Added support for TeamSpeak 6 mention commands in the format `<@mention-id|BotName> command`.
- Added sequential and random playlist playback modes:
  - `!playlist <playlist-url>` for sequential playback.
  - `!playlist <playlist-url> random` or `!歌单 <playlist-url> 随机` for random playback.
- Added optional artist filtering for music search with `!play <song> <artist>`.
- Added a configurable music-source test keyword through `MUSIC_SOURCE_TEST_KEYWORD`, defaulting to `summer`.

### Changed

- Music bot replies now use TeamSpeak BBCode formatting, with highlighted headings and color-coded error messages.
- Channel commands now reply in the channel, while private messages reply privately to the sender.
- Music-source tests now validate the practical playback path: search, playable URL resolution, and audio URL availability for each supported platform.
- Music-source upload validation now performs syntax and LX compatibility checks without executing third-party remote initialization code.
- Music-source runtime compatibility was expanded with timer support, longer request timeouts, and retry handling for safe GET/HEAD requests.
- Manual music requests made during playback are inserted immediately after the current track and start playing immediately.
- Playlist preloading now works with both sequential and randomized track order.
- Bilibili video streaming now supports DASH video/audio streams, CDN request headers, and separate audio/video inputs in the Sidecar.
- Video streaming defaults were optimized for real-time ARM/Linux transcoding with 480p, 24 FPS, and a lower default bitrate.

### Fixed

- Fixed TeamSpeak 6 mention commands being ignored because the numeric mention identifier was incorrectly treated as a client ID.
- Fixed channel replies falling back to private messages when no channel ID was present in `notifytextmessage`.
- Fixed missing text notification registration for private, channel, and server messages.
- Fixed Bilibili stream failures caused by unsupported format selection, missing CDN headers, Markdown-wrapped URLs, and separate DASH streams.
- Fixed music-source failures caused by missing `setTimeout` and `clearTimeout` in the VM runtime.

