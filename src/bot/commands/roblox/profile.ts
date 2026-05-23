import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import {
  getUserByUsername, getUserPresence, getAvatarThumbnail,
  getFriendCount, getFollowerCount, getFollowingCount,
  presenceTypeLabel, getGameName, formatNumber
} from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("profile")
  .setDescription("Look up a Roblox user's full profile.")
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

  const [presence, avatar, friends, followers, following] = await Promise.all([
    getUserPresence(user.id),
    getAvatarThumbnail(user.id),
    getFriendCount(user.id),
    getFollowerCount(user.id),
    getFollowingCount(user.id),
  ]);

  let statusLine = presenceTypeLabel(presence?.userPresenceType ?? 0);
  if (presence?.userPresenceType === 2 && presence.placeId) {
    const gameName = await getGameName(presence.placeId);
    statusLine = `In Game — ${gameName}`;
  }

  const createdTs = Math.floor(new Date(user.created).getTime() / 1000);

  const embed = createEmbed({
    title: `${user.displayName} (@${user.name})`,
    description: user.description?.slice(0, 300) || "No description provided.",
    fields: [
      { name: "User ID", value: `\`${user.id}\``, inline: true },
      { name: "Status", value: statusLine, inline: true },
      { name: "Account Created", value: `<t:${createdTs}:D>`, inline: true },
      { name: "Friends", value: formatNumber(friends), inline: true },
      { name: "Followers", value: formatNumber(followers), inline: true },
      { name: "Following", value: formatNumber(following), inline: true },
      { name: "Banned", value: user.isBanned ? "Yes" : "No", inline: true },
      { name: "Profile", value: `[View on Roblox](https://www.roblox.com/users/${user.id}/profile)`, inline: true },
    ],
    thumbnail: avatar ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
