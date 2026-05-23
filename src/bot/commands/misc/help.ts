import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Browse all available bot commands.")
  .setDMPermission(true);

interface HelpPage {
  category: string;
  note?: string;
  items: string[];
}

const PAGES: HelpPage[] = [
  {
    category: "Tracking — 1 of 2",
    items: [
      "`/track add <username>` — Add a Roblox user to your track list",
      "`/track remove <username>` — Remove a tracked user (or use `/trackremove`)",
      "`/track removeall` — Clear your entire track list at once",
      "`/track list` — View every user you are currently tracking",
      "`/track check <username>` — Check a user's current status and game",
      "`/track count <username>` — See how many people are tracking a user",
      "`/track playtime <username>` — View the current game with a direct join link",
    ],
  },
  {
    category: "Tracking — 2 of 2",
    items: [
      "`/track sync <username>` — Force an immediate check on a tracked user",
      "`/track alert <username> [game]` — Only get notified when they join a specific game",
      "`/track settings [dm_on_join]` — Toggle DM notifications on or off",
    ],
  },
  {
    category: "Roblox Lookup",
    items: [
      "`/roblox profile <username>` — Full profile with friends, followers, and status",
      "`/roblox friends <username>` — List up to 20 of a user's friends",
      "`/roblox game <place_id>` — Look up a game's stats, creator, and visit count",
      "`/roblox avatar <username>` — Get a user's full-body avatar image",
    ],
  },
  {
    category: "History",
    items: [
      "`/history user <username>` — Get a player's badge and account history",
      "`/history compare <user1> <user2>` — Compare two players side by side",
      "`/history graph <username>` — View badge progression data for a user",
    ],
  },
  {
    category: "Discord Utilities",
    items: [
      "`/discord avatar [user]` — Get a Discord user's avatar in full resolution",
      "`/discord banner [user]` — Get a Discord user's profile banner",
      "`/discord info [user]` — Get detailed information about a Discord user",
    ],
  },
  {
    category: "Server Utilities",
    note: "Server only",
    items: [
      "`/server info` — View member count, boost level, owner, and more",
      "`/server icon` — Get this server's icon in full resolution",
      "`/server banner` — Get this server's banner image",
    ],
  },
  {
    category: "Bot Settings",
    note: "Server only — requires Manage Server",
    items: [
      "`/setavatar [image] [url]` — Change the bot's avatar (upload or URL)",
      "`/setbanner [image] [url]` — Change the bot's banner (upload or URL)",
      "`/setname [name] [global]` — Set the bot's nickname or global username",
      "`/setme bio <text>` — Set the bot's profile bio",
      "`/setme reset` — Reset the bot's nickname, bio, and appearance",
    ],
  },
  {
    category: "General",
    items: [
      "`/ping` — Check roundtrip and WebSocket latency",
      "`/status` — View uptime, memory usage, and server count",
      "`/invite` — Get the link to add this bot to your server",
      "`/help` — Browse this command reference",
    ],
  },
];

function buildEmbed(page: number): EmbedBuilder {
  const p = PAGES[page];
  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(`Command Reference — ${p.category}`)
    .setDescription(p.items.join("\n"))
    .setFooter({ text: `Page ${page + 1} of ${PAGES.length}${p.note ? ` • ${p.note}` : ""}` })
    .setTimestamp();
  return embed;
}

function buildRow(page: number, disabled = false): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("help_prev")
      .setLabel("< Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page === 0),
    new ButtonBuilder()
      .setCustomId("help_next")
      .setLabel("Next >")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || page === PAGES.length - 1),
  );
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  let page = 0;

  const message = await interaction.editReply({
    embeds: [buildEmbed(page)],
    components: [buildRow(page)],
  });

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id,
    time: 120_000,
  });

  collector.on("collect", async (i) => {
    if (i.customId === "help_prev") page = Math.max(0, page - 1);
    if (i.customId === "help_next") page = Math.min(PAGES.length - 1, page + 1);
    await i.update({
      embeds: [buildEmbed(page)],
      components: [buildRow(page)],
    });
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [buildRow(page, true)] }).catch(() => {});
  });
}
