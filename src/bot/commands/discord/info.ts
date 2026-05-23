import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { createEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("info")
  .setDescription("Get detailed information about a Discord user.")
  .addUserOption(opt =>
    opt.setName("user").setDescription("The Discord user").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: false });
  const target = interaction.options.getUser("user") ?? interaction.user;
  const fetched = await target.fetch();

  const member = interaction.guild
    ? await interaction.guild.members.fetch(target.id).catch(() => null)
    : null;

  const created = Math.floor(target.createdTimestamp / 1000);
  const fields = [
    { name: "Username", value: target.username, inline: true },
    { name: "User ID", value: `\`${target.id}\``, inline: true },
    { name: "Bot", value: target.bot ? "Yes" : "No", inline: true },
    { name: "Account Created", value: `<t:${created}:F> (<t:${created}:R>)`, inline: false },
  ];

  if (member) {
    const joined = Math.floor((member.joinedTimestamp ?? 0) / 1000);
    fields.push({ name: "Joined Server", value: `<t:${joined}:F> (<t:${joined}:R>)`, inline: false });
    if (member.nickname) {
      fields.push({ name: "Nickname", value: member.nickname, inline: true });
    }
    const topRole = member.roles.highest;
    if (topRole && topRole.id !== interaction.guild?.id) {
      fields.push({ name: "Top Role", value: `${topRole}`, inline: true });
    }
  }

  const embed = createEmbed({
    title: `${target.displayName} (@${target.username})`,
    thumbnail: target.displayAvatarURL({ size: 256 }),
    image: fetched.bannerURL({ size: 1024 }) ?? undefined,
    fields,
    footer: "Discord Info",
    timestamp: true,
  });

  return interaction.editReply({ embeds: [embed] });
}
