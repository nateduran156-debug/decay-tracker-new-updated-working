import axios from "axios";

const USERS = "https://users.roblox.com";
const PRESENCE = "https://presence.roblox.com";
const THUMBNAILS = "https://thumbnails.roblox.com";
const GAMES = "https://games.roblox.com";
const BADGES = "https://badges.roblox.com";
const FRIENDS = "https://friends.roblox.com";
const APIS = "https://apis.roblox.com";

// In-memory Roblox session cookie (.ROBLOSECURITY).
// Populated at startup from the database and updated via /cookie.
let _robloxCookie: string | null = null;

export function setRobloxCookie(value: string | null): void {
  _robloxCookie = value;
}

export function getRobloxCookieStatus(): boolean {
  return _robloxCookie !== null;
}

function cookieHeaders(): Record<string, string> {
  if (!_robloxCookie) return {};
  return { Cookie: `.ROBLOSECURITY=${_robloxCookie}` };
}

export interface RobloxUser {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
}

export interface RobloxPresence {
  userPresenceType: number;
  lastLocation: string;
  placeId: number | null;
  rootPlaceId: number | null;
  gameId: string | null;
  universeId: number | null;
  userId: number;
  lastOnline: string;
}

export async function getUserByUsername(username: string): Promise<RobloxUser | null> {
  try {
    const res = await axios.post(`${USERS}/v1/usernames/users`, {
      usernames: [username],
      excludeBannedUsers: false,
    });
    const data = res.data.data?.[0];
    if (!data) return null;
    return getUserById(data.id);
  } catch {
    return null;
  }
}

export async function getUserById(userId: number): Promise<RobloxUser | null> {
  try {
    const res = await axios.get(`${USERS}/v1/users/${userId}`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getUserPresence(userId: number): Promise<RobloxPresence | null> {
  try {
    const res = await axios.post(
      `${PRESENCE}/v1/presence/users`,
      { userIds: [userId] },
      { headers: cookieHeaders() }
    );
    return res.data.userPresences?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getAvatarThumbnail(userId: number): Promise<string | null> {
  try {
    const res = await axios.get(
      `${THUMBNAILS}/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`
    );
    return res.data.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}

export async function getFullAvatarThumbnail(userId: number): Promise<string | null> {
  try {
    const res = await axios.get(
      `${THUMBNAILS}/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`
    );
    return res.data.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}

export async function getGameName(placeId: number): Promise<string> {
  try {
    // Primary path: resolve universeId from the place, then fetch the universe name.
    // This endpoint is public and does not require authentication, making it far
    // more reliable than multiget-place-details for unauthenticated requests.
    const universeRes = await axios.get(`${APIS}/universes/v1/places/${placeId}/universe`);
    const universeId: number | undefined = universeRes.data?.universeId;
    if (universeId) {
      const gameRes = await axios.get(`${GAMES}/v1/games?universeIds=${universeId}`, {
        headers: cookieHeaders(),
      });
      const name: string | undefined = gameRes.data?.data?.[0]?.name;
      if (name) return name;
    }
  } catch {
    // Fall through to the secondary path below.
  }

  try {
    // Secondary path: place details endpoint, sent with the session cookie when available.
    const res = await axios.get(
      `${GAMES}/v1/games/multiget-place-details?placeIds=${placeId}`,
      { headers: cookieHeaders() }
    );
    const name: string | undefined = res.data?.[0]?.name;
    if (name) return name;
  } catch {
    // Fall through to the final fallback.
  }

  return "Untitled Game";
}

export async function getPlaceDetails(placeId: number) {
  try {
    const res = await axios.get(
      `${GAMES}/v1/games/multiget-place-details?placeIds=${placeId}`,
      { headers: cookieHeaders() }
    );
    return res.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getUniverseIdFromPlace(placeId: number): Promise<number | null> {
  try {
    const res = await axios.get(`${APIS}/universes/v1/places/${placeId}/universe`);
    return res.data?.universeId ?? null;
  } catch {
    return null;
  }
}

export async function getUniverseDetails(universeId: number) {
  try {
    const res = await axios.get(`${GAMES}/v1/games?universeIds=${universeId}`, {
      headers: cookieHeaders(),
    });
    return res.data.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getGameThumbnail(universeId: number): Promise<string | null> {
  try {
    const res = await axios.get(
      `${THUMBNAILS}/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png`
    );
    return res.data.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}

export async function getUserBadges(userId: number) {
  try {
    const res = await axios.get(`${BADGES}/v1/users/${userId}/badges?limit=100&sortOrder=Desc`);
    return res.data.data ?? [];
  } catch {
    return [];
  }
}

export async function getFriendCount(userId: number): Promise<number> {
  try {
    const res = await axios.get(`${FRIENDS}/v1/users/${userId}/friends/count`);
    return res.data.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getFollowerCount(userId: number): Promise<number> {
  try {
    const res = await axios.get(`${FRIENDS}/v1/users/${userId}/followers/count`);
    return res.data.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getFollowingCount(userId: number): Promise<number> {
  try {
    const res = await axios.get(`${FRIENDS}/v1/users/${userId}/followings/count`);
    return res.data.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getFriends(userId: number) {
  try {
    const res = await axios.get(`${FRIENDS}/v1/users/${userId}/friends`);
    return res.data.data ?? [];
  } catch {
    return [];
  }
}

export function presenceTypeLabel(type: number): string {
  switch (type) {
    case 0: return "Offline";
    case 1: return "Online (Website)";
    case 2: return "In Game";
    case 3: return "In Studio";
    default: return "Unknown";
  }
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
