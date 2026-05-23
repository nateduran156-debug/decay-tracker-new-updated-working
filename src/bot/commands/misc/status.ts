import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../../embed.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Display current performance metrics and operational status of the bot.")
  .setDMPermission(true);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

  const memUsage = process.memoryUsage();
  const memMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);

  const ping = interaction.client.ws.ping;

  const embed = createEmbed({
    title: "Bot Status",
    fields: [
      { name: "Status", value: "Online", inline: true },
      { name: "Latency", value: `${ping}ms`, inline: true },
      { name: "Uptime", value: uptimeStr, inline: true },
      { name: "Memory Usage", value: `${memMB} MB`, inline: true },
      { name: "Servers", value: `${interaction.client.guilds.cache.size}`, inline: true },
      { name: "Slash Commands", value: "14 registered globally", inline: true },
    ],
    footer: "Roblox Tracker Bot",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
