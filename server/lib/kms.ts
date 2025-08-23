import crypto from 'crypto';

// Use SECRET_KEY env var for encryption - should be 32 bytes base64 or hex
const SECRET_KEY = process.env.SECRET_KEY || 'ZjBkYWM3MGE1ZGEyMmVkOGY3Njc4MWJhZWUzNWY2Yjk5MjE4NzBmNzg3MzE2NGI5'; // Default for dev

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(SECRET_KEY, SECRET_KEY.length === 64 ? 'hex' : 'base64');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(encB64: string): string {
  const buf = Buffer.from(encB64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const key = Buffer.from(SECRET_KEY, SECRET_KEY.length === 64 ? 'hex' : 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}