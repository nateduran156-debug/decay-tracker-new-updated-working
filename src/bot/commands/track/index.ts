import { SlashCommandBuilder } from "discord.js";
import * as add from "./add.js";
import * as alert from "./alert.js";
import * as check from "./check.js";
import * as count from "./count.js";
import * as list from "./list.js";
import * as playtime from "./playtime.js";
import * as remove from "./remove.js";
import * as removeall from "./removeall.js";
import * as settings from "./settings.js";
import * as sync from "./sync.js";

export const data = new SlashCommandBuilder()
  .setName("track")
  .setDescription("Manage your Roblox tracking list.")
  .setDMPermission(true)
  .addSubcommand(add.data)
  .addSubcommand(alert.data)
  .addSubcommand(check.data)
  .addSubcommand(count.data)
  .addSubcommand(list.data)
  .addSubcommand(playtime.data)
  .addSubcommand(remove.data)
  .addSubcommand(removeall.data)
  .addSubcommand(settings.data)
  .addSubcommand(sync.data);

export async function execute(interaction: any) {
  const sub = interaction.options.getSubcommand();
  const map: Record<string, any> = { add, alert, check, count, list, playtime, remove, removeall, settings, sync };
  const handler = map[sub];
  if (handler) return handler.execute(interaction);
}
