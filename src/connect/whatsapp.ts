import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import logger from "../utils/logger";
import Mail from "./sendMail";
import fs from "fs";
import path from "path";

let whatsappClient: Client | null = null;
let isReady = false;

export const initializeWhatsApp = async () => {
  try {
    logger.info("Initializing WhatsApp client...");
    logger.info("This may take 1-2 minutes on first run (downloading Chromium)...");
    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth' // Explicit path
      }),
      restartOnAuthFail: true,
      webVersion: "2.2412.54",
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--single-process",
          "--no-zygote",
        ],
        handleSIGINT: false,
      },
    });
    whatsappClient.on("qr", async (qr) => {
      logger.info("QR Code received, scan to authenticate WhatsApp");

      // Display QR in terminal
      qrcode.generate(qr, { small: true });

      // Send QR code to admin email
      try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.MAIL_FROM;
        if (adminEmail) {
          const mail = new Mail(adminEmail, "Admin");
          await mail.sendQRCode(qr);
          logger.info("QR code sent to admin email");
        } else {
          logger.warn("No admin email configured for QR code sending");
        }
      } catch (error: any) {
        logger.error(`Failed to send QR code email: ${error.message}`);
      }
    });

    whatsappClient.on("ready", () => {
      logger.info("WhatsApp client is ready!");
      isReady = true;
    });

    whatsappClient.on("authenticated", () => {
      logger.info("WhatsApp client authenticated");
    });

    whatsappClient.on("auth_failure", (msg) => {
      logger.error(`WhatsApp authentication failure: ${msg}`);
      isReady = false;
    });

    whatsappClient.on("disconnected", (reason) => {
      logger.warn(`WhatsApp client disconnected: ${reason}`);
      isReady = false;
    });

    whatsappClient.on("loading_screen", (percent, message) => {
      logger.info(`WhatsApp loading: ${percent}% - ${message}`);
    });

    logger.info("Starting WhatsApp client initialization (this takes 30-60 seconds)...");
    await whatsappClient.initialize();
    logger.info("WhatsApp client initialization complete");
  } catch (error: any) {
    logger.error(`Failed to initialize WhatsApp client: ${error.message}`);
    throw error;
  }
};

export const sendWhatsAppPDF = async (
  phoneNumber: string,
  pdfBuffer: Buffer,
  fileName: string,
  caption?: string,
): Promise<boolean> => {
  try {
    if (!whatsappClient || !isReady) {
      logger.error("WhatsApp client is not ready");
      return false;
    }

    // Format phone number (remove spaces, dashes, etc.)
    // Assuming international format with country code
    const formattedPhone = phoneNumber.replace(/[^\d]/g, "");

    // WhatsApp number format: countrycode + number + @c.us
    const chatId = `2${formattedPhone}@c.us`;

    // Convert buffer to base64
    const media = new (require("whatsapp-web.js").MessageMedia)(
      "application/pdf",
      pdfBuffer.toString("base64"),
      fileName,
    );
    await whatsappClient.sendMessage(chatId, media, {
      caption: caption || "Your session report",
    });

    logger.info(`WhatsApp PDF sent successfully to ${phoneNumber}`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to send WhatsApp PDF: ${error.message}`);
    return false;
  }
};

export const getWhatsAppStatus = (): boolean => {
  return isReady;
};

export const getWhatsAppClient = (): Client | null => {
  return whatsappClient;
};
