import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getUserPresence, getAvatarThumbnail, presenceTypeLabel, getGameName } from "../../roblox.js";
import { getTracksForUser } from "../../store.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("check")
  .setDescription("Check the tracking status of a Roblox user.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Roblox username to check").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const username = interaction.options.getString("username", true);

  const user = await getUserByUsername(username);
  if (!user) {
    return interaction.editReply({ embeds: [errorEmbed(`No Roblox user was found with the username **${username}**.`)] });
  }

  const tracks = await getTracksForUser(interaction.user.id);
  const tracked = tracks.find(t => t.robloxUserId === user.id);
  const presence = await getUserPresence(user.id);
  const avatar = await getAvatarThumbnail(user.id);

  let statusLine = presenceTypeLabel(presence?.userPresenceType ?? 0);
  let gameLine = "";
  if (presence?.userPresenceType === 2 && presence.placeId) {
    const gameName = await getGameName(presence.placeId);
    gameLine = gameName;
  }

  const fields = [
    { name: "Status", value: statusLine, inline: true },
    { name: "Tracked", value: tracked ? "Yes" : "No", inline: true },
    { name: "User ID", value: `\`${user.id}\``, inline: true },
  ];

  if (gameLine) {
    fields.push({ name: "Current Game", value: gameLine, inline: false });
  }

  if (presence?.lastOnline) {
    const d = new Date(presence.lastOnline);
    fields.push({ name: "Last Online", value: `<t:${Math.floor(d.getTime() / 1000)}:R>`, inline: true });
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
