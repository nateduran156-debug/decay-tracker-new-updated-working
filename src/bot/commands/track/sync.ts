import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getUserPresence, presenceTypeLabel, getAvatarThumbnail, getGameName } from "../../roblox.js";
import { getTracksForUser, getAllTracked } from "../../store.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("sync")
  .setDescription("Force an immediate status check on a tracked user, or on all tracked users at once.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Roblox username to check (leave blank to check all)").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const username = interaction.options.getString("username");

  if (!username) {
    const tracks = await getTracksForUser(interaction.user.id);
    if (tracks.length === 0) {
      return interaction.editReply({ embeds: [errorEmbed("You have no tracked users to synchronize.")] });
    }

    const embed = createEmbed({
      title: "Sync Initiated",
      description: `A status check has been triggered for **${tracks.length}** tracked user(s). You will receive a direct message for any users who are currently in a game.`,
      footer: "Roblox Tracker",
      timestamp: true,
    });
    return interaction.editReply({ embeds: [embed] });
  }

  const tracks = await getTracksForUser(interaction.user.id);
  const match = tracks.find(t => t.robloxUsername.toLowerCase() === username.toLowerCase());
  if (!match) {
    return interaction.editReply({ embeds: [errorEmbed(`**${username}** was not found in your tracking list.`)] });
  }

  const presence = await getUserPresence(match.robloxUserId);
  const avatar = await getAvatarThumbnail(match.robloxUserId);

  let gameLine = "Not currently in a game";
  if (presence?.userPresenceType === 2 && presence.placeId) {
    const gameName = await getGameName(presence.placeId);
    gameLine = `${gameName} — [Join](https://www.roblox.com/games/${presence.placeId})`;
  }

  const embed = createEmbed({
    title: `Status Check: ${match.robloxUsername}`,
    fields: [
      { name: "Status", value: presenceTypeLabel(presence?.userPresenceType ?? 0), inline: true },
      { name: "Current Game", value: gameLine, inline: false },
    ],
    thumbnail: avatar ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
