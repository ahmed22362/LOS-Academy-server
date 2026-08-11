import { randomInt, randomUUID } from 'crypto';

const hiddenCharacters = ['\u200B', '\u200C', '\u200D', '\u2060'];

export const formatReportWhatsAppCaption = (message: string): string => {
  const spacedMessage = message.replace(/ /g, () => ' '.repeat(randomInt(1, 4)));
  const middle = Math.floor(spacedMessage.length / 2);

  return `${spacedMessage.slice(0, middle)}${hiddenCharacters[randomInt(hiddenCharacters.length)]}${spacedMessage.slice(middle)} ${randomUUID()}`;
};
