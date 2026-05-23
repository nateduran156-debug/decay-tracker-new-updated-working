import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { trackList, trackSettings, botConfig } from "./schema.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema: { trackList, trackSettings, botConfig } });

export { trackList, trackSettings, botConfig };

// Creates all required tables if they do not already exist.
// Called once at startup so the bot works without a manual migration step.
export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS track_list (
      id TEXT PRIMARY KEY,
      discord_user_id TEXT NOT NULL,
      roblox_user_id BIGINT NOT NULL,
      roblox_username TEXT NOT NULL,
      added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      last_game_id TEXT,
      last_place_id BIGINT,
      notify_on_join BOOLEAN DEFAULT TRUE NOT NULL,
      alert_game TEXT
    );

    CREATE TABLE IF NOT EXISTS track_settings (
      discord_user_id TEXT PRIMARY KEY,
      max_tracks INTEGER DEFAULT 10 NOT NULL,
      dm_on_join BOOLEAN DEFAULT TRUE NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bot_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
  `);
}
