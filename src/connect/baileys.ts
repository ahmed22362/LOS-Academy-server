import type { GroupMetadata, WASocket } from 'baileys';
import qrcode from 'qrcode-terminal';
import logger from '../utils/logger';

let socket: WASocket | null = null;
let connected = false;
let starting = false;
let reconnectAttempt = 0;
const groups = new Map<string, GroupMetadata>();
type BaileysModule = typeof import('baileys');
const loadBaileys = () =>
  Function('return import("baileys")')() as Promise<BaileysModule>;

export const isWhatsAppGroupJid = (jid?: string): jid is string =>
  Boolean(jid?.endsWith('@g.us'));

export const initializeBaileysWhatsApp = async (): Promise<void> => {
  if (socket || starting) return;
  starting = true;

  try {
    const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } =
      await loadBaileys();
    const { state, saveCreds } = await useMultiFileAuthState(
      process.env.BAILEYS_AUTH_DIR || '.baileys_auth',
    );
    const client = makeWASocket({
      auth: state,
      logger: logger.child({ service: 'baileys' }),
      markOnlineOnConnect: false,
      cachedGroupMetadata: async (jid) => groups.get(jid),
    });

    socket = client;
    client.ev.on('creds.update', saveCreds);
    client.ev.on('groups.upsert', (metadata) =>
      metadata.forEach((group) => groups.set(group.id, group)),
    );
    client.ev.on('groups.update', (updates) =>
      updates.forEach((update) => {
        if (!update.id) return;
        const group = groups.get(update.id);
        if (group) groups.set(update.id, { ...group, ...update });
      }),
    );
    client.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) qrcode.generate(qr, { small: true });
      if (connection === 'open') {
        connected = true;
        reconnectAttempt = 0;
        logger.info('Baileys WhatsApp connected');
      }
      if (connection === 'close') {
        connected = false;
        socket = null;
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        if (statusCode !== DisconnectReason.loggedOut) {
          const delay = Math.min(1000 * 2 ** reconnectAttempt++, 30000);
          logger.warn({ delay }, 'Baileys WhatsApp reconnect scheduled');
          setTimeout(() => void initializeBaileysWhatsApp(), delay);
        } else {
          logger.warn('Baileys WhatsApp logged out; delete .baileys_auth and link again');
        }
      }
    });

  } finally {
    starting = false;
  }
};

export const getBaileysWhatsAppStatus = (): boolean => connected;

export const listBaileysGroups = async () => {
  if (!socket || !connected) return [];
  const metadata = await socket.groupFetchAllParticipating();
  Object.values(metadata).forEach((group) => groups.set(group.id, group));
  return Object.values(metadata).map(({ id, subject }) => ({ id, subject }));
};

export const sendWhatsAppGroupPDF = async ({
  jid,
  pdfBuffer,
  fileName,
  caption,
}: {
  jid?: string;
  pdfBuffer: Buffer;
  fileName: string;
  caption: string;
}): Promise<boolean> => {
  if (!socket || !connected || !isWhatsAppGroupJid(jid)) return false;

  try {
    if (!groups.has(jid)) groups.set(jid, await socket.groupMetadata(jid));
    await socket.sendMessage(jid, {
      document: pdfBuffer,
      mimetype: 'application/pdf',
      fileName,
      caption,
    });
    return true;
  } catch (error: any) {
    logger.error({ err: error, jid }, 'Failed to send report PDF to WhatsApp group');
    return false;
  }
};
