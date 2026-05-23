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

        // gameId is a UUID that identifies a specific server instance.
        // The Roblox presence API does not always return it — it can be null
        // even when the player is in the same server across polling cycles.
        // We store it when available, and fall back to a "p:<placeId>" key otherwise.
        const rawGameId = presence.gameId ?? null;
        const sessionKey = rawGameId ?? (currentPlaceId ? `p:${currentPlaceId}` : null);

        for (const entry of entries) {
          const wasInGame = entry.lastGameId !== null;

          // Determine whether the player has genuinely moved to a different server.
          //
          // The Roblox API sometimes returns gameId (a per-server UUID) and sometimes
          // returns null for the very same server across consecutive cycles. A naive
          // string comparison would treat that inconsistency as a server change and
          // fire a duplicate alert. To avoid that, we detect when gameId availability
          // has changed between cycles and fall back to placeId comparison instead.
          let sessionChanged = false;
          if (wasInGame) {
            const prevIsPlaceFallback = entry.lastGameId!.startsWith("p:");
            const currIsPlaceFallback = rawGameId === null;

            if (!prevIsPlaceFallback && !currIsPlaceFallback) {
              // Both cycles have real server UUIDs — compare them directly.
              sessionChanged = entry.lastGameId !== rawGameId;
            } else if (prevIsPlaceFallback && currIsPlaceFallback) {
              // Both cycles use the place-based fallback — compare place IDs.
              sessionChanged = entry.lastGameId !== sessionKey;
            } else {
              // Availability of gameId changed between cycles (API inconsistency).
              // Use placeId to decide — only notify if the player moved to a
              // completely different game, not just because the UUID appeared/vanished.
              sessionChanged = entry.lastPlaceId !== currentPlaceId;
            }
          }

          if (isInGame && (!wasInGame || sessionChanged)) {
            // Always store the session key so we do not re-fire on the next cycle
            await updateLastGame(entry.id, sessionKey, currentPlaceId ?? null);

            const settings = await getSettings(entry.discordUserId);
            if (!settings.dmOnJoin) continue;

            // Resolve the game name.
            // The presence payload carries universeId directly (when the cookie is set),
            // so we can resolve the name in a single call.
            // getGameName is used only as a fallback when universeId is absent.
            let gameName = "Unknown Game";
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
