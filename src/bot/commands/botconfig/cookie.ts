import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getBotConfig, setBotConfig } from "../../store.js";
import { setRobloxCookie, getRobloxCookieStatus } from "../../roblox.js";
import { createEmbed, errorEmbed, successEmbed } from "../../embed.js";

const OWNER_ID = "1456824205545967713";

export const data = new SlashCommandBuilder()
  .setName("cookie")
  .setDescription("Manage the Roblox session cookie used for authenticated API requests.")
  .setDMPermission(true)
  .addStringOption(opt =>
    opt
      .setName("value")
      .setDescription("The .ROBLOSECURITY cookie value to store. Leave blank to view current status.")
      .setRequired(false)
  )
  .addBooleanOption(opt =>
    opt
      .setName("clear")
      .setDescription("Set to true to remove the stored cookie.")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  if (interaction.user.id !== OWNER_ID) {
    return interaction.editReply({
      embeds: [errorEmbed("This command is restricted to the bot owner.")],
    });
  }

  const shouldClear = interaction.options.getBoolean("clear") ?? false;
  const value = interaction.options.getString("value") ?? null;

  if (shouldClear) {
    await setBotConfig("roblox_cookie", null);
    setRobloxCookie(null);
    return interaction.editReply({
      embeds: [successEmbed("The Roblox session cookie has been removed. Authenticated API requests will no longer be sent.")],
    });
  }

  if (value) {
    // Strip the cookie name prefix if the user pastes the full header value.
    const cleaned = value.replace(/^\.ROBLOSECURITY=/i, "").trim();
    await setBotConfig("roblox_cookie", cleaned);
    setRobloxCookie(cleaned);
    return interaction.editReply({
      embeds: [successEmbed("The Roblox session cookie has been stored and is now active. All authenticated API requests will use this cookie.")],
    });
  }

  // No options provided — show status.
  const active = getRobloxCookieStatus();
  const stored = await getBotConfig("roblox_cookie");
  const embed = createEmbed({
    title: "Roblox Cookie Status",
    fields: [
      { name: "Active", value: active ? "Yes" : "No", inline: true },
      { name: "Stored in Database", value: stored ? "Yes" : "No", inline: true },
    ],
    footer: "Bot Config",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
