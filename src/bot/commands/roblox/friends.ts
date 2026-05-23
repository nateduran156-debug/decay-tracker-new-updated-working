import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getFriends, getAvatarThumbnail, getFriendCount } from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("friends")
  .setDescription("Retrieve the friend list for a specified Roblox user.")
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

  const [friends, avatar, total] = await Promise.all([
    getFriends(user.id),
    getAvatarThumbnail(user.id),
    getFriendCount(user.id),
  ]);

  if (friends.length === 0) {
    return interaction.editReply({
      embeds: [createEmbed({
        title: `${user.displayName}'s Friends`,
        description: "This user has no friends listed, or their friend list is set to private.",
        thumbnail: avatar ?? undefined,
        footer: "Roblox Tracker",
        timestamp: true,
      })]
    });
  }

  const listed = friends.slice(0, 20).map((f: any, i: number) =>
    `**${i + 1}.** [${f.displayName}](https://www.roblox.com/users/${f.id}/profile) (@${f.name})`
  ).join("\n");

  const embed = createEmbed({
    title: `${user.displayName}'s Friends`,
    description: listed,
    fields: [
      { name: "Total Friends", value: `${total}`, inline: true },
      { name: "Showing", value: `${Math.min(friends.length, 20)} of ${total}`, inline: true },
    ],
    thumbnail: avatar ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
