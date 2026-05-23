import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getFullAvatarThumbnail } from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("avatar")
  .setDescription("Get the full-body avatar image of a Roblox user.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Roblox username").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });
  const username = interaction.options.getString("username", true);

  const user = await getUserByUsername(username);
  if (!user) {
    return interaction.editReply({ embeds: [errorEmbed(`No Roblox user found with the username **${username}**.`)] });
  }

  const avatarUrl = await getFullAvatarThumbnail(user.id);
  if (!avatarUrl) {
    return interaction.editReply({ embeds: [errorEmbed(`Could not retrieve avatar for **${username}**.`)] });
  }

  const embed = createEmbed({
    title: `${user.displayName}'s Avatar`,
    image: avatarUrl,
    fields: [
      { name: "Profile", value: `[View on Roblox](https://www.roblox.com/users/${user.id}/profile)`, inline: true },
      { name: "User ID", value: `\`${user.id}\``, inline: true },
    ],
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
