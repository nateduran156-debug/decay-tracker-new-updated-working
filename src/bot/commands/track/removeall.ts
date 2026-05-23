import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { removeAllTracks } from "../../store.js";
import { successEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("removeall")
  .setDescription("Remove all users from your tracking list at once.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  await removeAllTracks(interaction.user.id);
  return interaction.editReply({ embeds: [successEmbed("Your tracking list has been cleared. All tracked users have been removed.")] });
}
