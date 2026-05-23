import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getUserPresence, getGameName, presenceTypeLabel, getAvatarThumbnail } from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("playtime")
  .setDescription("Retrieve the current game and activity status for a Roblox user.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Roblox username to check").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const username = interaction.options.getString("username", true);

  const user = await getUserByUsername(username);
  if (!user) {
    return interaction.editReply({ embeds: [errorEmbed(`Could not find Roblox user **${username}**.`)] });
  }

  const presence = await getUserPresence(user.id);
  const avatar = await getAvatarThumbnail(user.id);

  if (!presence || presence.userPresenceType !== 2) {
    const embed = createEmbed({
      title: `${user.displayName} (@${user.name})`,
      description: `This user is currently **${presenceTypeLabel(presence?.userPresenceType ?? 0)}** and is not in a game at this time.`,
      thumbnail: avatar ?? undefined,
      footer: "Roblox Tracker",
      timestamp: true,
    });
    return interaction.editReply({ embeds: [embed] });
  }

  const gameName = presence.placeId ? await getGameName(presence.placeId) : "Unknown";
  const joinUrl = presence.placeId ? `https://www.roblox.com/games/${presence.placeId}` : null;

  const fields = [
    { name: "Game", value: gameName, inline: false },
    { name: "Status", value: "In Game", inline: true },
    { name: "Place ID", value: `\`${presence.placeId}\``, inline: true },
  ];

  if (joinUrl) {
    fields.push({ name: "Join Link", value: `[Click to Join](${joinUrl})`, inline: false });
  }

  const embed = createEmbed({
    title: `${user.displayName} (@${user.name})`,
    fields,
    thumbnail: avatar ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
