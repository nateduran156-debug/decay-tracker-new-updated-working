import { db, trackList, trackSettings, botConfig } from "../db/index.js";
import { eq, and } from "drizzle-orm";

export async function addTrack(discordUserId: string, robloxUserId: number, robloxUsername: string) {
  const existing = await db
    .select()
    .from(trackList)
    .where(and(eq(trackList.discordUserId, discordUserId), eq(trackList.robloxUserId, robloxUserId)));
  if (existing.length > 0) return { alreadyExists: true };

  await db.insert(trackList).values({
    discordUserId,
    robloxUserId,
    robloxUsername,
    notifyOnJoin: true,
    alertGame: null,
  });
  return { alreadyExists: false };
}

export async function removeTrack(discordUserId: string, robloxUsername: string) {
  const rows = await db.select().from(trackList).where(eq(trackList.discordUserId, discordUserId));
  const match = rows.find(r => r.robloxUsername.toLowerCase() === robloxUsername.toLowerCase());
  if (!match) return false;
  await db.delete(trackList).where(eq(trackList.id, match.id));
  return true;
}

export async function removeAllTracks(discordUserId: string) {
  await db.delete(trackList).where(eq(trackList.discordUserId, discordUserId));
}

export async function getTracksForUser(discordUserId: string) {
  return db.select().from(trackList).where(eq(trackList.discordUserId, discordUserId));
}

export async function getAllTracked() {
  return db.select().from(trackList);
}

export async function getTrackCountForRoblox(robloxUserId: number) {
  const rows = await db.select().from(trackList).where(eq(trackList.robloxUserId, robloxUserId));
  return rows.length;
}

export async function updateLastGame(id: string, gameId: string | null, placeId: number | null) {
  await db.update(trackList).set({ lastGameId: gameId, lastPlaceId: placeId }).where(eq(trackList.id, id));
}

export async function setTrackAlert(id: string, gameName: string | null) {
  await db.update(trackList).set({ alertGame: gameName }).where(eq(trackList.id, id));
}

export async function getSettings(discordUserId: string) {
  const rows = await db.select().from(trackSettings).where(eq(trackSettings.discordUserId, discordUserId));
  if (rows.length > 0) return rows[0];
  return { discordUserId, maxTracks: 100, dmOnJoin: true };
}

export async function upsertSettings(discordUserId: string, updates: { dmOnJoin?: boolean; maxTracks?: number }) {
  const existing = await db.select().from(trackSettings).where(eq(trackSettings.discordUserId, discordUserId));
  if (existing.length > 0) {
    await db.update(trackSettings).set({ ...updates, updatedAt: new Date() }).where(eq(trackSettings.discordUserId, discordUserId));
  } else {
    await db.insert(trackSettings).values({ discordUserId, dmOnJoin: true, maxTracks: 100, ...updates });
  }
}

export async function getBotConfig(key: string): Promise<string | null> {
  try {
    const rows = await db.select().from(botConfig).where(eq(botConfig.key, key));
    return rows[0]?.value ?? null;
  } catch {
    return null;
  }
}

export async function setBotConfig(key: string, value: string | null): Promise<void> {
  if (value === null) {
    await db.delete(botConfig).where(eq(botConfig.key, key));
    return;
  }
  const existing = await db.select().from(botConfig).where(eq(botConfig.key, key));
  if (existing.length > 0) {
    await db.update(botConfig).set({ value, updatedAt: new Date() }).where(eq(botConfig.key, key));
  } else {
    await db.insert(botConfig).values({ key, value });
  }
}
