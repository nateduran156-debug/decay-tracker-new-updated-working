import { SlashCommandBuilder } from "discord.js";
import * as avatar from "./avatar.js";
import * as banner from "./banner.js";
import * as info from "./info.js";

export const data = new SlashCommandBuilder()
  .setName("discord")
  .setDescription("Discord user utilities.")
  .setDMPermission(true)
  .addSubcommand(avatar.data)
  .addSubcommand(banner.data)
  .addSubcommand(info.data);

export async function execute(interaction: any) {
  const sub = interaction.options.getSubcommand();
  const map: Record<string, any> = { avatar, banner, info };
  const handler = map[sub];
  if (handler) return handler.execute(interaction);
}
