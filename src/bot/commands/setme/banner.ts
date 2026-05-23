import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("banner")
  .setDescription("Set the bot's profile banner.")
  .addAttachmentOption(opt =>
    opt.setName("image").setDescription("Image to use as the bot banner").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guild) {
    return interaction.editReply({ embeds: [errorEmbed("This command can only be used inside a server.")] });
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.editReply({ embeds: [errorEmbed("You need the **Manage Server** permission to use this command.")] });
  }

  const attachment = interaction.options.getAttachment("image", true);
  try {
    await interaction.client.user.setBanner(attachment.url);
    return interaction.editReply({ embeds: [successEmbed("Bot banner updated successfully.")] });
  } catch {
    return interaction.editReply({ embeds: [errorEmbed("Failed to update banner. Note: A banner requires Discord Nitro on the bot account.")] });
  }
}
