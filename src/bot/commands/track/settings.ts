import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getSettings, upsertSettings } from "../../store.js";
import { createEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("settings")
  .setDescription("View or update your tracking settings.")
  .addBooleanOption(opt =>
    opt.setName("dm_on_join").setDescription("Receive a DM when a tracked user joins a game").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const dmOnJoin = interaction.options.getBoolean("dm_on_join");

  if (dmOnJoin !== null) {
    await upsertSettings(interaction.user.id, { dmOnJoin });
  }

  const settings = await getSettings(interaction.user.id);

  const embed = createEmbed({
    title: "Your Tracking Settings",
    fields: [
      { name: "DM on Game Join", value: settings.dmOnJoin ? "Enabled" : "Disabled", inline: true },
      { name: "Max Tracks", value: `${settings.maxTracks}`, inline: true },
    ],
    footer: "To toggle notifications, run /track settings dm_on_join:true or false",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
