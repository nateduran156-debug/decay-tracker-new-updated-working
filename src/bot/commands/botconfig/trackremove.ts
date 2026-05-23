import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import { getTracksForUser, removeTrack } from "../../store.js";
import { successEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandBuilder()
  .setName("trackremove")
  .setDescription("Remove a Roblox user from your tracking list.")
  .setDMPermission(true)
  .addStringOption(opt =>
    opt
      .setName("username")
      .setDescription("Roblox username to remove (shows your current tracked list)")
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const tracks = await getTracksForUser(interaction.user.id);
  const choices = tracks
    .filter(t => t.robloxUsername.toLowerCase().includes(focused))
    .slice(0, 25)
    .map(t => ({ name: t.robloxUsername, value: t.robloxUsername }));
  await interaction.respond(choices);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const username = interaction.options.getString("username", true);

  const removed = await removeTrack(interaction.user.id, username);
  if (!removed) {
    return interaction.editReply({
      embeds: [errorEmbed(`**${username}** was not found in your tracking list.`)],
    });
  }

  return interaction.editReply({
    embeds: [successEmbed(`Removed **${username}** from your tracking list.`)],
  });
}
