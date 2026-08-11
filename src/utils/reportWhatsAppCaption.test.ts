import assert from 'assert';
import { formatReportWhatsAppCaption } from './reportWhatsAppCaption';

const caption = formatReportWhatsAppCaption('Session report: Quran session — August 6, 2026');

assert.match(caption, / [0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.match(caption, /[\u200B\u200C\u200D\u2060]/);
