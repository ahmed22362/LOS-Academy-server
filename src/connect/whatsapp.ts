import axios from 'axios';
import logger from '../utils/logger';
import AppError from '../utils/AppError';

const graphApiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0';
const graphBaseUrl = `https://graph.facebook.com/${graphApiVersion}`;

const getCloudApiConfig = () => ({
  token: process.env.WHATSAPP_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  defaultCountryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '20',
  sessionReportTemplateName:
    process.env.WHATSAPP_SESSION_REPORT_TEMPLATE_NAME || 'session_report_ready',
  sessionReportTemplateLanguage:
    process.env.WHATSAPP_SESSION_REPORT_TEMPLATE_LANGUAGE || 'en',
});

const formatWhatsAppPhone = (
  phoneNumber: string,
  countryCode?: string,
): string => {
  const { defaultCountryCode } = getCloudApiConfig();
  const digits = phoneNumber.replace(/\D/g, '');
  const normalizedCountryCode = (countryCode || defaultCountryCode).replace(
    /\D/g,
    '',
  );

  if (digits.startsWith('00')) {
    return digits.slice(2);
  }

  if (phoneNumber.trim().startsWith('+')) {
    return digits;
  }

  if (digits.startsWith('0')) {
    return `${normalizedCountryCode}${digits.slice(1)}`;
  }

  return digits;
};

export const initializeWhatsApp = async () => {
  logger.info('WhatsApp Cloud API configured');
};

export const sendWhatsAppPDF = async (
  phoneNumber: string,
  pdfBuffer: Buffer,
  fileName: string,
  caption?: string,
  countryCode?: string,
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
        to: formatWhatsAppPhone(phoneNumber, countryCode),
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

const uploadWhatsAppPDF = async (
  pdfBuffer: Buffer,
  fileName: string,
): Promise<string | null> => {
  const { token, phoneNumberId } = getCloudApiConfig();

  if (!token || !phoneNumberId) {
    logger.error('WhatsApp Cloud API env vars are missing');
    return null;
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

    return mediaResponse.data.id;
  } catch (error: any) {
    logger.error(
      `Failed to upload WhatsApp PDF: ${error.response?.data?.error?.message || error.message}`,
    );
    return null;
  }
};

export const sendSessionReportReadyTemplate = async ({
  phoneNumber,
  pdfBuffer,
  fileName,
  studentName,
  sessionName,
  sessionDate,
  templateName,
  templateLanguage,
  countryCode,
}: {
  phoneNumber: string;
  pdfBuffer: Buffer;
  fileName: string;
  studentName: string;
  sessionName: string;
  sessionDate: string;
  templateName?: string;
  templateLanguage?: string;
  countryCode?: string;
}): Promise<boolean> => {
  const {
    token,
    phoneNumberId,
    sessionReportTemplateName,
    sessionReportTemplateLanguage,
  } = getCloudApiConfig();

  if (!token || !phoneNumberId) {
    logger.error('WhatsApp Cloud API env vars are missing');
    return false;
  }

  try {
    const mediaId = await uploadWhatsAppPDF(pdfBuffer, fileName);
    if (!mediaId) {
      return false;
    }

    await axios.post(
      `${graphBaseUrl}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formatWhatsAppPhone(phoneNumber, countryCode),
        type: 'template',
        template: {
          name: templateName || sessionReportTemplateName,
          language: {
            code: templateLanguage || sessionReportTemplateLanguage,
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'document',
                  document: {
                    id: mediaId,
                    filename: fileName,
                  },
                },
              ],
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: studentName,
                },
                {
                  type: 'text',
                  text: sessionName,
                },
                {
                  type: 'text',
                  text: sessionDate,
                },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    logger.info(
      `WhatsApp session report template sent successfully to ${phoneNumber}`,
    );
    return true;
  } catch (error: any) {
    logger.error(
      `Failed to send WhatsApp session report template: ${error.response?.data?.error?.message || error.message}`,
    );
    return false;
  }
};

export const listWhatsAppTemplates = async ({
  limit = 25,
  after,
  before,
  name,
  status,
}: {
  limit?: number;
  after?: string;
  before?: string;
  name?: string;
  status?: string;
}) => {
  const { token, businessAccountId } = getCloudApiConfig();

  if (!token || !businessAccountId) {
    throw new AppError(
      400,
      'Missing WhatsApp template config. Set WHATSAPP_TOKEN and WHATSAPP_BUSINESS_ACCOUNT_ID to list or get templates.',
    );
  }

  const response = await axios.get(
    `${graphBaseUrl}/${businessAccountId}/message_templates`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        fields:
          'name,language,status,category,components,rejected_reason,quality_score',
        limit,
        after,
        before,
        name,
        status,
      },
    },
  );

  return response.data;
};

export const getWhatsAppTemplate = async ({
  name,
  language,
}: {
  name: string;
  language?: string;
}) => {
  const templates = await listWhatsAppTemplates({
    limit: 100,
    name,
  });

  const template = templates.data?.find((item: any) => {
    const sameName = item.name === name;
    const sameLanguage = !language || item.language === language;
    return sameName && sameLanguage;
  });

  return template || null;
};

export const getSessionReportTemplateConfig = () => {
  const { sessionReportTemplateName, sessionReportTemplateLanguage } =
    getCloudApiConfig();

  return {
    name: sessionReportTemplateName,
    language: sessionReportTemplateLanguage,
  };
};

export const getWhatsAppConfigStatus = () => {
  const {
    token,
    phoneNumberId,
    businessAccountId,
    defaultCountryCode,
    sessionReportTemplateName,
    sessionReportTemplateLanguage,
  } = getCloudApiConfig();

  return {
    hasToken: Boolean(token),
    hasPhoneNumberId: Boolean(phoneNumberId),
    hasBusinessAccountId: Boolean(businessAccountId),
    defaultCountryCode,
    sessionReportTemplate: {
      name: sessionReportTemplateName,
      language: sessionReportTemplateLanguage,
    },
  };
};

export const getWhatsAppStatus = (): boolean => {
  const { token, phoneNumberId } = getCloudApiConfig();
  return Boolean(token && phoneNumberId);
};

export const getWhatsAppClient = () => {
  const { phoneNumberId } = getCloudApiConfig();
  return phoneNumberId ? { phoneNumberId } : null;
};
