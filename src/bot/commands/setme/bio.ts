import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("bio")
  .setDescription("Update the bot's profile bio for this server.")
  .addStringOption(opt =>
    opt.setName("text").setDescription("Bio text (max 190 characters)").setRequired(true).setMaxLength(190)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guild) {
    return interaction.editReply({ embeds: [errorEmbed("This command can only be used inside a server.")] });
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.editReply({ embeds: [errorEmbed("You need the **Manage Server** permission to use this command.")] });
  }

  const text = interaction.options.getString("text", true);
  try {
    await (interaction.client.user as any).setAboutMe?.(text);
    return interaction.editReply({ embeds: [successEmbed(`The bot's profile bio has been updated to: *${text}*`)] });
  } catch {
    return interaction.editReply({ embeds: [errorEmbed("Failed to set bio. This feature may require specific bot account settings.")] });
  }
}
