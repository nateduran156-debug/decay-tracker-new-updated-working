import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../../embed.js";

export const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Retrieve the invite link to add this bot to another server.")
  .setDMPermission(true);

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const clientId = interaction.client.user.id;
  const permissions = "277025508352";
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot+applications.commands`;

  const embed = createEmbed({
    title: "Invite Roblox Tracker",
    description: `Use the link below to add this bot to your server.\n\n[**Add to Server**](${inviteUrl})`,
    fields: [
      { name: "Required Permissions", value: "Send Messages, Embed Links, Read Message History", inline: false },
    ],
    footer: "Roblox Tracker Bot",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
