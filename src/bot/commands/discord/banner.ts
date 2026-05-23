import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("banner")
  .setDescription("Retrieve the profile banner of a Discord user.")
  .addUserOption(opt =>
    opt.setName("user").setDescription("The Discord user").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });
  const target = interaction.options.getUser("user") ?? interaction.user;

  const fetched = await target.fetch();
  const bannerUrl = fetched.bannerURL({ size: 4096 });

  if (!bannerUrl) {
    return interaction.editReply({
      embeds: [errorEmbed(`**${target.username}** does not have a profile banner set.`)]
    });
  }

  const embed = createEmbed({
    title: `${target.username}'s Banner`,
    image: bannerUrl,
    fields: [{ name: "Download", value: `[Click here](${bannerUrl})`, inline: false }],
    footer: "Discord Info",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
