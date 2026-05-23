import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getTracksForUser, getSettings } from "../../store.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("list")
  .setDescription("List all Roblox users you are currently tracking.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const [tracks, settings] = await Promise.all([
    getTracksForUser(interaction.user.id),
    getSettings(interaction.user.id),
  ]);

  if (tracks.length === 0) {
    return interaction.editReply({
      embeds: [createEmbed({
        title: "Your Track List",
        description: "You are not currently tracking any users. Use `/track add <username>` to begin tracking a Roblox user.",
        footer: "Roblox Tracker",
        timestamp: true,
      })]
    });
  }

  // Discord embed description cap is 4096 chars — paginate if needed
  const lines = tracks.map((t, i) => `**${i + 1}.** ${t.robloxUsername} \`(ID: ${t.robloxUserId})\``);
  const chunks: string[] = [];
  let current = "";
  for (const line of lines) {
    if ((current + "\n" + line).length > 3900) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? current + "\n" + line : line;
    }
  }
  if (current) chunks.push(current);

  const embed = createEmbed({
    title: "Your Track List",
    description: chunks[0],
    fields: [{ name: "Total", value: `${tracks.length} / ${settings.maxTracks}`, inline: true }],
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
