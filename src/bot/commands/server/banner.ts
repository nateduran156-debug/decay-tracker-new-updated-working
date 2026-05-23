import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("banner")
  .setDescription("Display this server's banner at full resolution.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });

  if (!interaction.guild) {
    return interaction.editReply({ embeds: [errorEmbed("This command can only be used inside a server.")] });
  }

  const bannerUrl = interaction.guild.bannerURL({ size: 4096 });
  if (!bannerUrl) {
    return interaction.editReply({ embeds: [errorEmbed("This server does not have a banner set.")] });
  }

  const embed = createEmbed({
    title: `${interaction.guild.name} — Server Banner`,
    image: bannerUrl,
    fields: [{ name: "Download", value: `[Click here](${bannerUrl})`, inline: false }],
    footer: "Server Info",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
