import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../../embed.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check the bot's response time and connection latency.")
  .setDMPermission(true);

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ content: "Measuring latency...", fetchReply: true });

  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
  const wsPing = interaction.client.ws.ping;

  const embed = createEmbed({
    title: "Latency",
    fields: [
      { name: "Roundtrip", value: `${roundtrip}ms`, inline: true },
      { name: "WebSocket", value: `${wsPing}ms`, inline: true },
      { name: "Status", value: wsPing < 100 ? "Excellent" : wsPing < 200 ? "Good" : wsPing < 400 ? "Fair" : "Poor", inline: true },
    ],
    footer: "Roblox Tracker Bot",
    timestamp: true,
  });

  return interaction.editReply({ content: "", embeds: [embed] });
}
