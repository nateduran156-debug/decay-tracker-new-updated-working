import { Client, GatewayIntentBits, Collection } from "discord.js";
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
import { runTrackerCycle } from "./tracker.js";
import { deployCommands } from "./deploy-commands.js";
import { getBotConfig } from "./store.js";
import { setRobloxCookie } from "./roblox.js";

const TRACKER_INTERVAL_MS = 30_000;

export async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error("[Bot] DISCORD_BOT_TOKEN not set, skipping bot startup.");
    return;
  }

  // Load the stored Roblox session cookie before the tracker starts so that
  // the first poll cycle already benefits from authenticated API requests.
  try {
    const storedCookie = await getBotConfig("roblox_cookie");
    if (storedCookie) {
      setRobloxCookie(storedCookie);
      console.log("[Bot] Roblox session cookie loaded from database.");
    }
  } catch (err) {
    console.warn("[Bot] Could not load Roblox session cookie from database:", err);
  }

  await deployCommands();

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  });

  const commands = new Collection<string, { execute: (i: any) => Promise<any> }>();
  for (const mod of [
    track, roblox, discord, history, server, setme,
    setavatar, setbanner, setname, trackremove, cookie,
    help, status, ping, invite,
  ]) {
    commands.set((mod.data as any).name, mod);
  }

  client.once("ready", () => {
    console.log(`[Bot] Logged in as ${client.user?.tag}`);
    client.user?.setActivity("Roblox games", { type: 3 });

    setInterval(() => runTrackerCycle(client), TRACKER_INTERVAL_MS);
    setTimeout(() => runTrackerCycle(client), 5_000);
  });

  client.on("interactionCreate", async (interaction) => {
    if (interaction.isAutocomplete()) {
      const command = commands.get(interaction.commandName) as any;
      if (command?.autocomplete) {
        try { await command.autocomplete(interaction); } catch {}
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err: any) {
      console.error(`[Bot] Error in /${interaction.commandName}:`, err?.message ?? err);
      const content = "An error occurred while processing that command. Please try again.";
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content });
        } else {
          await interaction.reply({ content, ephemeral: true });
        }
      } catch {}
    }
  });

  await client.login(token);
}
