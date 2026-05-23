ROBLOX TRACKER BOT - SOURCE CODE
=================================

Required environment variables:
  DISCORD_BOT_TOKEN   -- Your Discord bot token
  DISCORD_CLIENT_ID   -- Your Discord application client ID
  DATABASE_URL        -- PostgreSQL connection string

Stack:
  Node.js / TypeScript, discord.js v14, drizzle-orm + PostgreSQL, axios

Global slash commands (14):
  /track add/remove/removeall/list/check/count/playtime/sync/alert/settings
  /trackremove        -- Quick remove with autocomplete
  /roblox profile/friends/game/avatar
  /discord avatar/banner/info
  /history user/compare/graph
  /server info/icon/banner
  /setme bio/reset
  /setavatar, /setbanner, /setname
  /help, /status, /ping, /invite

All user-facing text is written at a professional, formal register.
No contractions, no casual language, no emojis anywhere.
