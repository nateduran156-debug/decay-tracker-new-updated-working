import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getUserByUsername } from "../../roblox.js";
import { addTrack, getTracksForUser, getSettings } from "../../store.js";
import { createEmbed, errorEmbed, successEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("add")
  .setDescription("Add a Roblox user to your track list.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Roblox username to track").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const username = interaction.options.getString("username", true);

  const [existing, settings] = await Promise.all([
    getTracksForUser(interaction.user.id),
    getSettings(interaction.user.id),
  ]);

  if (existing.length >= settings.maxTracks) {
    return interaction.editReply({ embeds: [errorEmbed(`You've reached the maximum of **${settings.maxTracks}** tracked users. Remove some first.`)] });
  }

  const user = await getUserByUsername(username);
  if (!user) {
    return interaction.editReply({ embeds: [errorEmbed(`Could not find a Roblox user named **${username}**.`)] });
  }

  const result = await addTrack(interaction.user.id, user.id, user.name);
  if (result.alreadyExists) {
    return interaction.editReply({ embeds: [errorEmbed(`You're already tracking **${user.name}**.`)] });
  }

  const embed = successEmbed(`Now tracking **${user.name}** (ID: \`${user.id}\`).\nYou'll receive a DM when they join a Roblox game.`);
  return interaction.editReply({ embeds: [embed] });
}
