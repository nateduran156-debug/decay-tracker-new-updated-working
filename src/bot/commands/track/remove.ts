import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { removeTrack } from "../../store.js";
import { errorEmbed, successEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Remove a Roblox user from your tracking list.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Roblox username to remove").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const username = interaction.options.getString("username", true);

  const removed = await removeTrack(interaction.user.id, username);
  if (!removed) {
    return interaction.editReply({ embeds: [errorEmbed(`**${username}** was not found in your tracking list.`)] });
  }

  return interaction.editReply({ embeds: [successEmbed(`**${username}** has been removed from your tracking list.`)] });
}
