import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getUserBadges, getAvatarThumbnail } from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("user")
  .setDescription("Get the badge and game history of a Roblox player.")
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

  const createdTs = Math.floor(new Date(user.created).getTime() / 1000);
  const recentBadges = badges.slice(0, 8).map((b: any) => `• ${b.name}`).join("\n") || "No badges found.";

  const embed = createEmbed({
    title: `${user.displayName} (@${user.name})`,
    description: user.description?.slice(0, 200) || "No description provided.",
    fields: [
      { name: "User ID", value: `\`${user.id}\``, inline: true },
      { name: "Account Created", value: `<t:${createdTs}:D>`, inline: true },
      { name: "Banned", value: user.isBanned ? "Yes" : "No", inline: true },
      { name: "Total Badges", value: `${badges.length}`, inline: true },
      { name: "Recent Badges", value: recentBadges, inline: false },
    ],
    thumbnail: avatar ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
