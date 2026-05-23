import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("reset")
  .setDescription("Clear all custom bot appearance settings (name, bio, avatar).");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guild) {
    return interaction.editReply({ embeds: [errorEmbed("This command can only be used inside a server.")] });
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.editReply({ embeds: [errorEmbed("You need the **Manage Server** permission to use this command.")] });
  }

  try {
    await interaction.guild.members.me?.setNickname(null);
    return interaction.editReply({ embeds: [successEmbed("Bot appearance reset. Nickname has been cleared.")] });
  } catch {
    return interaction.editReply({ embeds: [errorEmbed("Failed to reset bot appearance.")] });
  }
}
