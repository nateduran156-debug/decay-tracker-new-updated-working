import { SlashCommandBuilder } from "discord.js";
import * as profile from "./profile.js";
import * as friends from "./friends.js";
import * as game from "./game.js";
import * as avatar from "./avatar.js";

export const data = new SlashCommandBuilder()
  .setName("roblox")
  .setDescription("Roblox user and game lookup tools.")
  .setDMPermission(true)
  .addSubcommand(profile.data)
  .addSubcommand(friends.data)
  .addSubcommand(game.data)
  .addSubcommand(avatar.data);

export async function execute(interaction: any) {
  const sub = interaction.options.getSubcommand();
  const map: Record<string, any> = { profile, friends, game, avatar };
  const handler = map[sub];
  if (handler) return handler.execute(interaction);
}
