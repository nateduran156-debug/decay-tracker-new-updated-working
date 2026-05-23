import { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getAllTracked, updateLastGame, getSettings } from "./store.js";
import { getUserPresence, getAvatarThumbnail, getUniverseDetails, getGameName } from "./roblox.js";
import { createEmbed } from "./embed.js";

export async function runTrackerCycle(client: Client) {
  try {
    const tracks = await getAllTracked();
    if (tracks.length === 0) return;

    const grouped = new Map<number, typeof tracks>();
    for (const t of tracks) {
      const list = grouped.get(t.robloxUserId) ?? [];
      list.push(t);
      grouped.set(t.robloxUserId, list);
    }

    for (const [robloxUserId, entries] of grouped) {
      try {
        const presence = await getUserPresence(robloxUserId);
        if (!presence) continue;

        const currentPlaceId = presence.placeId ?? null;
        const currentUniverseId = presence.universeId ?? null;
        const isInGame = presence.userPresenceType === 2;

        // Session key uniquely identifies which server instance the player is in.
        // If the API provides a gameId (UUID per-server), use it for precision.
        // Otherwise fall back to placeId so we at least detect game switches.
        const rawGameId = presence.gameId ?? null;
        const sessionKey = rawGameId ?? (currentPlaceId ? `p:${currentPlaceId}` : null);

        for (const entry of entries) {
          const wasInGame = entry.lastGameId !== null;
          // sessionChanged is true when the player switches servers or games
          const sessionChanged = wasInGame && entry.lastGameId !== sessionKey;

          if (isInGame && (!wasInGame || sessionChanged)) {
            // Always store the session key so we do not re-fire on the next cycle
            await updateLastGame(entry.id, sessionKey, currentPlaceId ?? null);

            const settings = await getSettings(entry.discordUserId);
            if (!settings.dmOnJoin) continue;

            // Resolve the game name.
            // The presence payload carries universeId directly, so we can skip
            // an extra round-trip and resolve the name in a single call.
            // getGameName is used only as a fallback when universeId is absent.
            let gameName = "Untitled Game";
            if (currentUniverseId) {
              const details = await getUniverseDetails(currentUniverseId);
              gameName = details?.name ?? gameName;
            } else if (currentPlaceId) {
              gameName = await getGameName(currentPlaceId);
            }

            // Alert filter: only notify if game name matches the filter
            if (entry.alertGame) {
              const filter = entry.alertGame.toLowerCase();
              if (!gameName.toLowerCase().includes(filter)) continue;
            }

            const avatar = await getAvatarThumbnail(robloxUserId);
            const joinUrl = currentPlaceId
              ? `https://www.roblox.com/games/${currentPlaceId}`
              : null;

            const embed = createEmbed({
              title: `${entry.robloxUsername} joined a game`,
              description: `${entry.robloxUsername} is now playing ${gameName}.`,
              fields: [
                { name: "Game", value: gameName, inline: true },
                { name: "Roblox Profile", value: `[View Profile](https://www.roblox.com/users/${robloxUserId}/profile)`, inline: true },
                ...(entry.alertGame ? [{ name: "Alert Filter", value: entry.alertGame, inline: true }] : []),
              ],
              thumbnail: avatar ?? undefined,
              footer: "@decay073117",
              timestamp: true,
            });

            const components = joinUrl
              ? [
                  new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                      .setLabel("Join")
                      .setStyle(ButtonStyle.Link)
                      .setURL(joinUrl)
                  ),
                ]
              : [];

            try {
              const discordUser = await client.users.fetch(entry.discordUserId);
              await discordUser.send({ embeds: [embed], components });
            } catch {
              // DMs may be closed or blocked — silently skip
            }
          } else if (!isInGame && wasInGame) {
            await updateLastGame(entry.id, null, null);
          }
        }
      } catch {
        // Skip individual user errors silently
      }
    }
  } catch (err) {
    console.error("[Tracker] Cycle error:", err);
  }
}
