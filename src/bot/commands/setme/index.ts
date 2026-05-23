import { SlashCommandBuilder } from "discord.js";
import * as avatar from "./avatar.js";
import * as banner from "./banner.js";
import * as bio from "./bio.js";
import * as name from "./name.js";
import * as reset from "./reset.js";

export const data = new SlashCommandBuilder()
  .setName("setme")
  .setDescription("Configure the bot's appearance in this server.")
  .setDMPermission(true)
  .addSubcommand(avatar.data)
  .addSubcommand(banner.data)
  .addSubcommand(bio.data)
  .addSubcommand(name.data)
  .addSubcommand(reset.data);

export async function execute(interaction: any) {
  const sub = interaction.options.getSubcommand();
  const map: Record<string, any> = { avatar, banner, bio, name, reset };
  const handler = map[sub];
  if (handler) return handler.execute(interaction);
}
