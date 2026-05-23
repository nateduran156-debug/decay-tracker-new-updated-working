import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("avatar")
  .setDescription("Retrieve the full-resolution avatar of a Discord user.")
  .addUserOption(opt =>
    opt.setName("user").setDescription("The Discord user").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });
  const target = interaction.options.getUser("user") ?? interaction.user;
  const avatarUrl = target.displayAvatarURL({ size: 4096 });

  const embed = createEmbed({
    title: `${target.username}'s Avatar`,
    image: avatarUrl,
    fields: [{ name: "Download", value: `[Click here](${avatarUrl})`, inline: false }],
    footer: "Discord Info",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
