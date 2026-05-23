import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getUserBadges, getAvatarThumbnail } from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("graph")
  .setDescription("Show badge progression data for a Roblox user.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Roblox username").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });
  const username = interaction.options.getString("username", true);

  const user = await getUserByUsername(username);
  if (!user) return interaction.editReply({ embeds: [errorEmbed(`Could not find Roblox user **${username}**.`)] });

  const [badges, avatar] = await Promise.all([
    getUserBadges(user.id),
    getAvatarThumbnail(user.id),
  ]);

  const totalBadges = badges.length;
  const recentBadges = badges.slice(0, 5);

  const recentList = recentBadges.length > 0
    ? recentBadges.map((b: any) => `• ${b.name}`).join("\n")
    : "No recent badges found.";

  const embed = createEmbed({
    title: `Badge Progression — ${user.displayName}`,
    fields: [
      { name: "Total Badges", value: `${totalBadges}`, inline: true },
      { name: "User ID", value: `\`${user.id}\``, inline: true },
      { name: "Recent Badges", value: recentList, inline: false },
    ],
    thumbnail: avatar ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
