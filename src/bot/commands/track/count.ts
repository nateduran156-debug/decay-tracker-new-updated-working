import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername } from "../../roblox.js";
import { getTrackCountForRoblox } from "../../store.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("count")
  .setDescription("Check how many users are tracking a specific Roblox user.")
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

  const count = await getTrackCountForRoblox(user.id);

  const embed = createEmbed({
    title: "Track Count",
    description: `**${user.displayName}** (@${user.name}) is being tracked by **${count}** user${count === 1 ? "" : "s"}.`,
    fields: [{ name: "Roblox ID", value: `\`${user.id}\``, inline: true }],
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
