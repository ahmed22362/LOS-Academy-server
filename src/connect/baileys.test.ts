import assert from 'node:assert/strict';
import { isWhatsAppGroupJid } from './baileys';

assert.equal(isWhatsAppGroupJid('1234567890-1234567890@g.us'), true);
assert.equal(isWhatsAppGroupJid('201234567890@s.whatsapp.net'), false);
