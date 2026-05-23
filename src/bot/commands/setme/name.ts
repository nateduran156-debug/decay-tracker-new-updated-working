import { SlashCommandSubcommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { successEmbed, errorEmbed } from "../../embed.js";

export const data = new SlashCommandSubcommandBuilder()
  .setName("name")
  .setDescription("Set the bot's nickname in this server.")
  .addStringOption(opt =>
    opt.setName("nickname").setDescription("New nickname (leave blank to reset)").setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  if (!interaction.guild) {
    return interaction.editReply({ embeds: [errorEmbed("This command can only be used inside a server.")] });
  }

  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.editReply({ embeds: [errorEmbed("You need the **Manage Server** permission to use this command.")] });
  }

  const nickname = interaction.options.getString("nickname") ?? null;
  try {
    await interaction.guild.members.me?.setNickname(nickname);
    return interaction.editReply({
      embeds: [successEmbed(nickname ? `Bot nickname set to **${nickname}**.` : "Bot nickname has been reset.")]
    });
  } catch {
    return interaction.editReply({ embeds: [errorEmbed("Failed to set nickname.")] });
  }
}
