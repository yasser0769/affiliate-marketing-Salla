import crypto from 'crypto';
import { env } from './env';

const IV_LENGTH = 16;

function getKey(): Buffer | null {
  if (!env.ENCRYPTION_KEY) return null;
  return crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest();
}

export function encryptIfPossible(value: string | null): string | null {
  if (!value) return null;
  const key = getKey();
  if (!key) return value;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptIfPossible(value: string | null): string | null {
  if (!value) return null;
  const key = getKey();
  if (!key) return value;
  const [ivHex, payloadHex] = value.split(':');
  if (!ivHex || !payloadHex) return value;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(payloadHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', env.SALLA_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const normalized = signature.replace(/^sha256=/, '');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(normalized, 'hex'));
  } catch {
    return false;
  }
}
