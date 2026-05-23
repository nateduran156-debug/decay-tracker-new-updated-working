import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandBuilder()
  .setName("setname")
  .setDescription("Change the bot's nickname in this server, or its global username if specified.")
  .setDMPermission(false)
  .addStringOption(opt =>
    opt.setName("name")
      .setDescription("The new name (leave blank to reset the server nickname)")
      .setRequired(false)
      .setMinLength(1)
      .setMaxLength(32)
  )
  .addBooleanOption(opt =>
    opt.setName("global")
      .setDescription("Set to true to change the bot's global username instead of the server nickname")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.editReply({ embeds: [errorEmbed("You must have the **Manage Server** permission to use this command.")] });
  }

  const name = interaction.options.getString("name") ?? null;
  const isGlobal = interaction.options.getBoolean("global") ?? false;

  if (isGlobal && !name) {
    return interaction.editReply({ embeds: [errorEmbed("A name must be provided when using the `global` option.")] });
  }

  try {
    if (isGlobal && name) {
      await interaction.client.user.setUsername(name);

      const embed = createEmbed({
        title: "Bot Username Updated",
        description: `The bot's global username has been changed to **${name}**.\n\nNote: Discord restricts username changes to twice per hour.`,
        thumbnail: interaction.client.user.displayAvatarURL({ size: 256 }),
        footer: "Bot Config",
        timestamp: true,
      });

      return interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.guild!.members.me?.setNickname(name);

      const embed = createEmbed({
        title: name ? "Bot Nickname Updated" : "Bot Nickname Reset",
        description: name
          ? `The bot's nickname in this server has been set to **${name}**.`
          : "The bot's nickname in this server has been reset to its default username.",
        thumbnail: interaction.client.user.displayAvatarURL({ size: 256 }),
        footer: "Bot Config",
        timestamp: true,
      });

      return interaction.editReply({ embeds: [embed] });
    }
  } catch (err: any) {
    const isRateLimit = err?.message?.toLowerCase().includes("rate");
    const msg = isRateLimit
      ? "The username change rate limit has been reached. Please try again in one hour."
      : "The bot's name could not be updated. Ensure the bot has the required permissions.";
    return interaction.editReply({ embeds: [errorEmbed(msg)] });
  }
}
