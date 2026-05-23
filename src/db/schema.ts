import { pgTable, text, integer, bigint, timestamp, boolean } from "drizzle-orm/pg-core";

export const trackList = pgTable("track_list", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  discordUserId: text("discord_user_id").notNull(),
  robloxUserId: bigint("roblox_user_id", { mode: "number" }).notNull(),
  robloxUsername: text("roblox_username").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  lastGameId: text("last_game_id"),
  lastPlaceId: bigint("last_place_id", { mode: "number" }),
  notifyOnJoin: boolean("notify_on_join").default(true).notNull(),
  alertGame: text("alert_game"),
});

export const trackSettings = pgTable("track_settings", {
  discordUserId: text("discord_user_id").primaryKey(),
  maxTracks: integer("max_tracks").default(10).notNull(),
  dmOnJoin: boolean("dm_on_join").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const botConfig = pgTable("bot_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
