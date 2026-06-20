import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  Colors,
} from "discord.js";
import axios from "axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RobloxServer {
  id: string;
  maxPlayers: number;
  playing: number;
  ping: number;
  fps: number;
}

interface GameInfo {
  placeId: number;
  universeId: number;
  name: string;
  thumbnail: string | null;
}

// ─── Roblox API ───────────────────────────────────────────────────────────────

async function resolveGame(input: string): Promise<GameInfo | null> {
  const urlMatch = input.match(/roblox\.com\/games\/(\d+)/i);
  const raw = urlMatch ? urlMatch[1] : input.trim();
  const placeId = parseInt(raw, 10);
  if (isNaN(placeId) || placeId <= 0) return null;

  try {
    const uniRes = await axios.get(
      `https://apis.roblox.com/universes/v1/places?placeIds=${placeId}`,
      { timeout: 10_000 },
    );
    const universeId: number | undefined = uniRes.data?.data?.[0]?.universeId;
    if (!universeId) return null;

    const [detailRes, thumbRes] = await Promise.all([
      axios.get(`https://games.roblox.com/v1/games?universeIds=${universeId}`, {
        timeout: 10_000,
      }),
      axios.get(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=150x150&format=Png&isCircular=false`,
        { timeout: 10_000 },
      ),
    ]);

    const game = detailRes.data?.data?.[0];
    const thumbnail: string | null =
      thumbRes.data?.data?.[0]?.imageUrl ?? null;

    return {
      placeId,
      universeId,
      name: game?.name ?? `Place ${placeId}`,
      thumbnail,
    };
  } catch {
    return null;
  }
}

async function fetchServers(placeId: number): Promise<RobloxServer[]> {
  const all: RobloxServer[] = [];
  let cursor = "";
  let attempts = 0;

  do {
    try {
      const url =
        `https://games.roblox.com/v1/games/${placeId}/servers/Public` +
        `?sortOrder=Asc&excludeFullGames=false&limit=100` +
        (cursor ? `&cursor=${cursor}` : "");
      const res = await axios.get(url, { timeout: 12_000 });
      const data = res.data;
      all.push(...(data.data ?? []));
      cursor = data.nextPageCursor ?? "";
    } catch {
      break;
    }
    attempts++;
  } while (cursor && all.length < 600 && attempts < 8);

  return all;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

function pingLabel(ping: number): string {
  if (ping < 80) return "LOW";
  if (ping < 150) return "MED";
  return "HIGH";
}

function fillBar(playing: number, max: number, width = 8): string {
  const filled = Math.round((playing / Math.max(max, 1)) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

const REGION_FLAGS: [RegExp, string][] = [
  [/united states|, us\b|usa/i, "🇺🇸"],
  [/united kingdom|, uk\b|, gb\b/i, "🇬🇧"],
  [/canada|, ca\b/i, "🇨🇦"],
  [/australia|, au\b/i, "🇦🇺"],
  [/germany|, de\b/i, "🇩🇪"],
  [/france|, fr\b/i, "🇫🇷"],
  [/netherlands|, nl\b/i, "🇳🇱"],
  [/brazil|, br\b/i, "🇧🇷"],
  [/singapore|, sg\b/i, "🇸🇬"],
  [/japan|, jp\b/i, "🇯🇵"],
  [/south korea|, kr\b/i, "🇰🇷"],
  [/india|, in\b/i, "🇮🇳"],
  [/poland|, pl\b/i, "🇵🇱"],
  [/sweden|, se\b/i, "🇸🇪"],
  [/russia|, ru\b/i, "🇷🇺"],
  [/hong kong|, hk\b/i, "🇭🇰"],
  [/turkey|, tr\b/i, "🇹🇷"],
  [/mexico|, mx\b/i, "🇲🇽"],
  [/argentina|, ar\b/i, "🇦🇷"],
  [/south africa|, za\b/i, "🇿🇦"],
];

function flagForRegion(region: string): string {
  for (const [pattern, flag] of REGION_FLAGS) {
    if (pattern.test(region)) return flag;
  }
  return "";
}

// ─── State ────────────────────────────────────────────────────────────────────

interface ServersState {
  game: GameInfo;
  servers: RobloxServer[];
  regions: string[];
  currentRegion: string;
  page: number;
}

const PAGE_SIZE = 5;
const COLLECTOR_TTL = 5 * 60 * 1000;

// ─── Embed / component builders ───────────────────────────────────────────────

function buildServersEmbed(state: ServersState): EmbedBuilder {
  const { game, servers, currentRegion, page, regions } = state;

  const filtered =
    currentRegion === "all"
      ? servers
      : servers.filter((s: any) => (s.location ?? "") === currentRegion);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  let description = "";

  if (slice.length === 0) {
    description = "No servers found for this region.";
  } else {
    description = slice
      .map((s, i) => {
        const idx = page * PAGE_SIZE + i;
        const location: string = (s as any).location ?? currentRegion;
        const flag = location !== "all" ? flagForRegion(location) : "";
        const ping = Math.round(s.ping);
        const label = pingLabel(ping);
        const bar = fillBar(s.playing, s.maxPlayers);
        return (
          `**Server #${idx}** ${flag ? `${flag}` : ""}\n` +
          `Players: \`${s.playing} / ${s.maxPlayers}\`  ·  \`${ping}ms\`  ·  \`${label}\``
        );
      })
      .join("\n");
  }

  const regionLabel =
    currentRegion === "all" ? "All Regions" : currentRegion;
  const flag = currentRegion === "all" ? "" : flagForRegion(currentRegion);

  const embed = new EmbedBuilder()
    .setTitle(`Servers — ${game.name}`)
    .setDescription(description)
    .setColor(0x5865f2)
    .addFields([
      {
        name: "Region",
        value: `${flag ? `${flag}  ` : ""}${regionLabel}`,
        inline: true,
      },
      {
        name: "Total Servers",
        value: `${filtered.length}`,
        inline: true,
      },
      {
        name: "Page",
        value: `${page + 1} / ${totalPages}`,
        inline: true,
      },
    ])
    .setFooter({ text: "Roblox Server Browser" })
    .setTimestamp();

  if (game.thumbnail) embed.setThumbnail(game.thumbnail);

  return embed;
}

function buildComponents(
  state: ServersState,
  iid: string,
  showingRegionPicker = false,
): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
  const { game, servers, currentRegion, page, regions } = state;

  const filtered =
    currentRegion === "all"
      ? servers
      : servers.filter((s: any) => (s.location ?? "") === currentRegion);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const rows: ActionRowBuilder<any>[] = [];

  if (showingRegionPicker) {
    const options = [
      new StringSelectMenuOptionBuilder()
        .setLabel("All Regions")
        .setValue("all")
        .setDescription(`${servers.length} servers total`)
        .setDefault(currentRegion === "all"),
      ...regions.map((r) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(r)
          .setValue(r)
          .setDescription(
            `${servers.filter((s: any) => (s.location ?? "") === r).length} servers`,
          )
          .setEmoji(flagForRegion(r) || "🌐")
          .setDefault(r === currentRegion),
      ),
    ];

    const select = new StringSelectMenuBuilder()
      .setCustomId(`srv:${iid}:region`)
      .setPlaceholder("Select a region...")
      .addOptions(options.slice(0, 25));

    rows.push(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select),
    );

    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`srv:${iid}:cancel_region`)
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Secondary),
      ),
    );

    return rows;
  }

  // Join buttons (link buttons — open exact server)
  if (slice.length > 0) {
    const joinRow = new ActionRowBuilder<ButtonBuilder>();
    slice.forEach((s, i) => {
      const idx = page * PAGE_SIZE + i;
      joinRow.addComponents(
        new ButtonBuilder()
          .setLabel(`Join #${idx}`)
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://www.roblox.com/games/start?placeId=${game.placeId}&gameInstanceId=${s.id}`,
          ),
      );
    });
    rows.push(joinRow);
  }

  // Navigation row
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`srv:${iid}:first`)
      .setLabel("«")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`srv:${iid}:prev`)
      .setLabel("‹")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`srv:${iid}:pick_region`)
      .setLabel("Region")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`srv:${iid}:next`)
      .setLabel("›")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`srv:${iid}:last`)
      .setLabel("»")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );
  rows.push(navRow);

  return rows;
}

// ─── Command ──────────────────────────────────────────────────────────────────

export const data = new SlashCommandBuilder()
  .setName("servers")
  .setDescription("Browse live Roblox game servers by region.")
  .setDMPermission(true)
  .addStringOption((opt) =>
    opt
      .setName("game")
      .setDescription("Roblox game link or Place ID")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const input = interaction.options.getString("game", true);

  // ── Discovering embed ──────────────────────────────────────────────────────
  const discoveringEmbed = new EmbedBuilder()
    .setTitle("Scanning Servers...")
    .setDescription(
      "Retrieving server list from Roblox. This may take a moment for large games.",
    )
    .setColor(0x2b2d31)
    .setFooter({ text: "Roblox Server Browser" })
    .setTimestamp();

  await interaction.editReply({ embeds: [discoveringEmbed] });

  // ── Resolve game ───────────────────────────────────────────────────────────
  const game = await resolveGame(input);
  if (!game) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Game Not Found")
          .setDescription(
            `No Roblox game could be found for **${input}**.\nProvide a valid Place ID or Roblox game URL.`,
          )
          .setColor(Colors.Red)
          .setTimestamp(),
      ],
      components: [],
    });
  }

  // ── Fetch all servers ──────────────────────────────────────────────────────
  const rawServers = await fetchServers(game.placeId);

  if (rawServers.length === 0) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`No Servers — ${game.name}`)
          .setDescription("No public servers are currently available.")
          .setColor(Colors.Orange)
          .setThumbnail(game.thumbnail)
          .setTimestamp(),
      ],
      components: [],
    });
  }

  // ── Build region list ──────────────────────────────────────────────────────
  const regionSet = new Set<string>();
  for (const s of rawServers) {
    const loc = (s as any).location;
    if (loc) regionSet.add(loc);
  }
  const regions = Array.from(regionSet).sort();

  const state: ServersState = {
    game,
    servers: rawServers,
    regions,
    currentRegion: "all",
    page: 0,
  };

  const iid = interaction.id;

  const reply = await interaction.editReply({
    embeds: [buildServersEmbed(state)],
    components: buildComponents(state, iid),
  });

  // ── Collector ──────────────────────────────────────────────────────────────
  const collector = reply.createMessageComponentCollector({
    time: COLLECTOR_TTL,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        content: "This server browser belongs to another user.",
        ephemeral: true,
      });
      return;
    }

    const id = i.customId;

    // ── Select menu — region pick ──────────────────────────────────────────
    if (i.isStringSelectMenu() && id === `srv:${iid}:region`) {
      state.currentRegion = i.values[0];
      state.page = 0;
      await i.update({
        embeds: [buildServersEmbed(state)],
        components: buildComponents(state, iid, false),
      });
      return;
    }

    if (!i.isButton()) return;

    // ── Buttons ────────────────────────────────────────────────────────────
    if (id === `srv:${iid}:pick_region`) {
      await i.update({
        embeds: [buildServersEmbed(state)],
        components: buildComponents(state, iid, true),
      });
      return;
    }

    if (id === `srv:${iid}:cancel_region`) {
      await i.update({
        embeds: [buildServersEmbed(state)],
        components: buildComponents(state, iid, false),
      });
      return;
    }

    const filtered =
      state.currentRegion === "all"
        ? state.servers
        : state.servers.filter(
            (s: any) => (s.location ?? "") === state.currentRegion,
          );
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    if (id === `srv:${iid}:first`) state.page = 0;
    else if (id === `srv:${iid}:prev`) state.page = Math.max(0, state.page - 1);
    else if (id === `srv:${iid}:next`)
      state.page = Math.min(totalPages - 1, state.page + 1);
    else if (id === `srv:${iid}:last`) state.page = totalPages - 1;

    await i.update({
      embeds: [buildServersEmbed(state)],
      components: buildComponents(state, iid, false),
    });
  });

  collector.on("end", async () => {
    try {
      const disabledComponents = buildComponents(state, iid).map((row) => {
        const r = row as ActionRowBuilder<ButtonBuilder>;
        r.components.forEach((c) => {
          if (c instanceof ButtonBuilder && c.data.style !== ButtonStyle.Link) {
            c.setDisabled(true);
          }
        });
        return r;
      });
      await interaction.editReply({ components: disabledComponents });
    } catch {
      // Message may have been deleted
    }
  });
}
