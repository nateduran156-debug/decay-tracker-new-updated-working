import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername, getUserBadges, getAvatarThumbnail } from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("compare")
  .setDescription("Compare the game/badge history of two Roblox players.")
  .addStringOption(opt =>
    opt.setName("user1").setDescription("First Roblox username").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("user2").setDescription("Second Roblox username").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });
  const u1name = interaction.options.getString("user1", true);
  const u2name = interaction.options.getString("user2", true);

  const [user1, user2] = await Promise.all([
    getUserByUsername(u1name),
    getUserByUsername(u2name),
  ]);

  if (!user1) return interaction.editReply({ embeds: [errorEmbed(`Could not find Roblox user **${u1name}**.`)] });
  if (!user2) return interaction.editReply({ embeds: [errorEmbed(`Could not find Roblox user **${u2name}**.`)] });

  const [badges1, badges2, avatar1, avatar2] = await Promise.all([
    getUserBadges(user1.id),
    getUserBadges(user2.id),
    getAvatarThumbnail(user1.id),
    getAvatarThumbnail(user2.id),
  ]);

  const created1 = new Date(user1.created);
  const created2 = new Date(user2.created);

  const embed = createEmbed({
    title: `History Comparison`,
    description: `**${user1.displayName}** vs **${user2.displayName}**`,
    fields: [
      { name: `${user1.name} — Badges`, value: `${badges1.length}`, inline: true },
      { name: `${user2.name} — Badges`, value: `${badges2.length}`, inline: true },
      { name: "\u200b", value: "\u200b", inline: true },
      { name: `${user1.name} — Account Age`, value: `<t:${Math.floor(created1.getTime() / 1000)}:R>`, inline: true },
      { name: `${user2.name} — Account Age`, value: `<t:${Math.floor(created2.getTime() / 1000)}:R>`, inline: true },
    ],
    thumbnail: avatar1 ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
