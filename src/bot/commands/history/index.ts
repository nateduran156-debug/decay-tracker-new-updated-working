import { SlashCommandBuilder } from "discord.js";
import * as compare from "./compare.js";
import * as graph from "./graph.js";
import * as user from "./user.js";

export const data = new SlashCommandBuilder()
  .setName("history")
  .setDescription("Roblox game and badge history.")
  .setDMPermission(true)
  .addSubcommand(compare.data)
  .addSubcommand(graph.data)
  .addSubcommand(user.data);

export async function execute(interaction: any) {
  const sub = interaction.options.getSubcommand();
  const map: Record<string, any> = { compare, graph, user };
  const handler = map[sub];
  if (handler) return handler.execute(interaction);
}
