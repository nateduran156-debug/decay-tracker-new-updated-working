import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("icon")
  .setDescription("Display this server's icon at full resolution.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });

  if (!interaction.guild) {
    return interaction.editReply({ embeds: [errorEmbed("This command can only be used inside a server.")] });
  }

  const iconUrl = interaction.guild.iconURL({ size: 4096 });
  if (!iconUrl) {
    return interaction.editReply({ embeds: [errorEmbed("This server does not have an icon set.")] });
  }

  const embed = createEmbed({
    title: `${interaction.guild.name} — Server Icon`,
    image: iconUrl,
    fields: [{ name: "Download", value: `[Click here](${iconUrl})`, inline: false }],
    footer: "Server Info",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
