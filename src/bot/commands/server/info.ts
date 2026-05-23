import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, Guild } from "discord.js";
import { createEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Get detailed information about this server.");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });

  if (!interaction.guild) {
    return interaction.editReply({ embeds: [errorEmbed("This command can only be used inside a server.")] });
  }

  const guild = interaction.guild as Guild;
  await guild.fetch();

  const createdTs = Math.floor(guild.createdTimestamp / 1000);
  const owner = await guild.fetchOwner().catch(() => null);

  const verificationLevels: Record<number, string> = {
    0: "None", 1: "Low", 2: "Medium", 3: "High", 4: "Very High"
  };

  const embed = createEmbed({
    title: guild.name,
    description: guild.description ?? undefined,
    fields: [
      { name: "Server ID", value: `\`${guild.id}\``, inline: true },
      { name: "Owner", value: owner ? `${owner.user.username}` : "Unknown", inline: true },
      { name: "Created", value: `<t:${createdTs}:D> (<t:${createdTs}:R>)`, inline: true },
      { name: "Members", value: `${guild.memberCount.toLocaleString()}`, inline: true },
      { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
      { name: "Roles", value: `${guild.roles.cache.size}`, inline: true },
      { name: "Boost Level", value: `Level ${guild.premiumTier}`, inline: true },
      { name: "Boosts", value: `${guild.premiumSubscriptionCount ?? 0}`, inline: true },
      { name: "Verification", value: verificationLevels[guild.verificationLevel] ?? "Unknown", inline: true },
    ],
    thumbnail: guild.iconURL({ size: 256 }) ?? undefined,
    footer: "Server Info",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
