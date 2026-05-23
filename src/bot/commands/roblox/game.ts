import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getPlaceDetails, getUniverseIdFromPlace, getUniverseDetails, getGameThumbnail, formatNumber } from "../../roblox.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("game")
  .setDescription("Look up details about a Roblox game by place ID.")
  .addIntegerOption(opt =>
    opt.setName("place_id").setDescription("The Roblox place ID").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });
  const placeId = interaction.options.getInteger("place_id", true);

  const placeDetails = await getPlaceDetails(placeId);
  if (!placeDetails) {
    return interaction.editReply({ embeds: [errorEmbed(`No game found with place ID \`${placeId}\`.`)] });
  }

  const universeId = await getUniverseIdFromPlace(placeId);
  const [universe, thumbnail] = await Promise.all([
    universeId ? getUniverseDetails(universeId) : Promise.resolve(null),
    universeId ? getGameThumbnail(universeId) : Promise.resolve(null),
  ]);

  const creatorName = universe?.creator?.name ?? placeDetails.builderId ?? "Unknown";
  const activePlayers = universe?.playing ?? 0;
  const visits = universe?.visits ?? 0;
  const favorites = universe?.favoritedCount ?? 0;
  const maxPlayers = universe?.maxPlayers ?? placeDetails.maxPlayers ?? 0;

  const embed = createEmbed({
    title: placeDetails.name,
    description: (universe?.description ?? placeDetails.description ?? "No description available.").slice(0, 300),
    fields: [
      { name: "Place ID", value: `\`${placeId}\``, inline: true },
      { name: "Creator", value: creatorName, inline: true },
      { name: "Active Players", value: formatNumber(activePlayers), inline: true },
      { name: "Total Visits", value: formatNumber(visits), inline: true },
      { name: "Favorites", value: formatNumber(favorites), inline: true },
      { name: "Max Players", value: `${maxPlayers}`, inline: true },
      { name: "Join", value: `[Play on Roblox](https://www.roblox.com/games/${placeId})`, inline: false },
    ],
    thumbnail: thumbnail ?? undefined,
    footer: "Roblox Tracker",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
