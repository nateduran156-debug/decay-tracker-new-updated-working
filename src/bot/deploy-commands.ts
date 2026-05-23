import { REST, Routes } from "discord.js";
import * as track from "./commands/track/index.js";
import * as roblox from "./commands/roblox/index.js";
import * as discord from "./commands/discord/index.js";
import * as history from "./commands/history/index.js";
import * as server from "./commands/server/index.js";
import * as setme from "./commands/setme/index.js";
import * as setavatar from "./commands/botconfig/setavatar.js";
import * as setbanner from "./commands/botconfig/setbanner.js";
import * as setname from "./commands/botconfig/setname.js";
import * as trackremove from "./commands/botconfig/trackremove.js";
import * as cookie from "./commands/botconfig/cookie.js";
import * as help from "./commands/misc/help.js";
import * as status from "./commands/misc/status.js";
import * as ping from "./commands/misc/ping.js";
import * as invite from "./commands/misc/invite.js";

export async function deployCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    throw new Error("DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID must be set.");
  }

  const commands = [
    track.data.toJSON(),
    roblox.data.toJSON(),
    discord.data.toJSON(),
    history.data.toJSON(),
    server.data.toJSON(),
    setme.data.toJSON(),
    setavatar.data.toJSON(),
    setbanner.data.toJSON(),
    setname.data.toJSON(),
    trackremove.data.toJSON(),
    cookie.data.toJSON(),
    help.data.toJSON(),
    status.data.toJSON(),
    ping.data.toJSON(),
    invite.data.toJSON(),
  ];

  const rest = new REST({ version: "10" }).setToken(token);

  console.log(`[Deploy] Registering ${commands.length} global slash commands...`);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log("[Deploy] Global slash commands registered successfully.");
}
