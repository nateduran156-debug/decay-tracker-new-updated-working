import { SlashCommandBuilder } from "discord.js";
import * as info from "./info.js";
import * as icon from "./icon.js";
import * as banner from "./banner.js";

export const data = new SlashCommandBuilder()
  .setName("server")
  .setDescription("Server information and utilities.")
  .setDMPermission(false)
  .addSubcommand(info.data)
  .addSubcommand(icon.data)
  .addSubcommand(banner.data);

export async function execute(interaction: any) {
  const sub = interaction.options.getSubcommand();
  const map: Record<string, any> = { info, icon, banner };
  const handler = map[sub];
  if (handler) return handler.execute(interaction);
}
