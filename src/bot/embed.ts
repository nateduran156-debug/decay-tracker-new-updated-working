import { EmbedBuilder } from "discord.js";

export function createEmbed(options: {
  title?: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: string;
  thumbnail?: string;
  image?: string;
  timestamp?: boolean;
}) {
  const embed = new EmbedBuilder().setColor(0xffffff);

  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.fields && options.fields.length > 0) embed.addFields(options.fields);
  if (options.footer) embed.setFooter({ text: options.footer });
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.timestamp) embed.setTimestamp();

  return embed;
}

export function errorEmbed(message: string) {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle("Error")
    .setDescription(message)
    .setTimestamp();
}

export function successEmbed(message: string) {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle("Success")
    .setDescription(message)
    .setTimestamp();
}
