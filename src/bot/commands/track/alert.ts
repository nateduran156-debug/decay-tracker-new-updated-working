import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getTracksForUser, setTrackAlert } from "../../store.js";
import { createEmbed, errorEmbed, successEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("alert")
  .setDescription("Restrict notifications to a specific game. Leave the game field blank to receive all alerts.")
  .addStringOption(opt =>
    opt.setName("username").setDescription("Tracked Roblox username").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("game").setDescription("Game name to filter by (leave blank to receive all alerts)").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const username = interaction.options.getString("username", true);
  const game = interaction.options.getString("game") ?? null;

  const tracks = await getTracksForUser(interaction.user.id);
  const match = tracks.find(t => t.robloxUsername.toLowerCase() === username.toLowerCase());

  if (!match) {
    return interaction.editReply({ embeds: [errorEmbed(`**${username}** was not found in your tracking list. Use \`/track add\` to add them first.`)] });
  }

  await setTrackAlert(match.id, game);

  if (game) {
    return interaction.editReply({
      embeds: [successEmbed(`Alert filter set for **${username}**.\nYou will only be notified when they join a game matching **"${game}"**.`)]
    });
  } else {
    return interaction.editReply({
      embeds: [successEmbed(`Alert filter cleared for **${username}**.\nYou will now be notified whenever they join any game.`)]
    });
  }
}
