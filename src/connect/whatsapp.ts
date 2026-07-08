import axios from 'axios';
import logger from '../utils/logger';

const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0';
const graphBaseUrl = `https://graph.facebook.com/${graphApiVersion}`;

const getCloudApiConfig = () => ({
  token: process.env.WHATSAPP_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
});

const formatWhatsAppPhone = (phoneNumber: string): string => {
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.startsWith('00') ? digits.slice(2) : digits;
};

export const initializeWhatsApp = async () => {
  logger.info('WhatsApp Cloud API configured');
};

export const sendWhatsAppPDF = async (
  phoneNumber: string,
  pdfBuffer: Buffer,
  fileName: string,
  caption?: string,
): Promise<boolean> => {
  const { token, phoneNumberId } = getCloudApiConfig();

  if (!token || !phoneNumberId) {
    logger.error('WhatsApp Cloud API env vars are missing');
    return false;
  }

  try {
    const media = new FormData();
    media.append('messaging_product', 'whatsapp');
    media.append(
      'file',
      new Blob([pdfBuffer as any], { type: 'application/pdf' }),
      fileName,
    );

    const mediaResponse = await axios.post(
      `${graphBaseUrl}/${phoneNumberId}/media`,
      media,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    await axios.post(
      `${graphBaseUrl}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formatWhatsAppPhone(phoneNumber),
        type: 'document',
        document: {
          id: mediaResponse.data.id,
          filename: fileName,
          caption: caption || 'Your session report',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    logger.info(`WhatsApp PDF sent successfully to ${phoneNumber}`);
    return true;
  } catch (error: any) {
    logger.error(
      `Failed to send WhatsApp PDF: ${error.response?.data?.error?.message || error.message}`,
    );
    return false;
  }
};

export const getWhatsAppStatus = (): boolean => {
  const { token, phoneNumberId } = getCloudApiConfig();
  return Boolean(token && phoneNumberId);
};

export const getWhatsAppClient = () => {
  const { phoneNumberId } = getCloudApiConfig();
  return phoneNumberId ? { phoneNumberId } : null;
};
