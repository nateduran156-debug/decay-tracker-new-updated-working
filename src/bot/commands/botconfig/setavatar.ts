import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandBuilder()
  .setName("setavatar")
  .setDescription("Change the bot's avatar. Upload an image file or provide a direct URL.")
  .setDMPermission(false)
  .addAttachmentOption(opt =>
    opt.setName("image")
      .setDescription("Upload an image file directly (PNG, JPG, GIF, WebP)")
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName("url")
      .setDescription("Paste a direct link to an image instead of uploading a file")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.editReply({ embeds: [errorEmbed("You must have the **Manage Server** permission to use this command.")] });
  }

  const attachment = interaction.options.getAttachment("image");
  const url = interaction.options.getString("url");
  const imageSource = attachment?.url ?? url;

  if (!imageSource) {
    return interaction.editReply({
      embeds: [errorEmbed("An image must be provided. Either upload a file or enter a valid image URL.\n\nUsage: `/setavatar image:<file>` or `/setavatar url:<link>`")],
    });
  }

  const isValidImage = attachment
    ? attachment.contentType?.startsWith("image/") ?? true
    : /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(imageSource);

  if (!isValidImage) {
    return interaction.editReply({ embeds: [errorEmbed("The provided file does not appear to be a valid image. Accepted formats: PNG, JPG, GIF, WebP.")] });
  }

  try {
    await interaction.client.user.setAvatar(imageSource);

    const embed = createEmbed({
      title: "Bot Avatar Updated",
      description: "The bot's avatar has been changed successfully.",
      thumbnail: interaction.client.user.displayAvatarURL({ size: 256 }),
      footer: "Bot Config",
      timestamp: true,
    });

    return interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    const msg = err?.code === 50035
      ? "The image could not be processed. Ensure the file is a valid PNG, JPG, GIF, or WebP and does not exceed 8 MB."
      : "The avatar could not be updated. This may be due to Discord rate limiting. Please try again in a few minutes.";
    return interaction.editReply({ embeds: [errorEmbed(msg)] });
  }
}
