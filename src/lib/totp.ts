import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function getEncryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
  }
  return createHash("sha256").update(`portfolio-totp:${secret}`).digest();
}

function encodeBase32(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += base32Alphabet[(value << (5 - bits)) & 31];
  return output;
}

function decodeBase32(value: string): Buffer {
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];
  for (const character of value.replace(/=+$/, "").toUpperCase()) {
    const digit = base32Alphabet.indexOf(character);
    if (digit < 0) throw new Error("Invalid authenticator secret.");
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function createTotpSecret(): string {
  return encodeBase32(randomBytes(20));
}

export function createTotpUri(secret: string, email: string): string {
  const label = encodeURIComponent(`Portfolio Admin:${email}`);
  const issuer = encodeURIComponent("Portfolio Admin");
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTotpSecret(encryptedSecret: string): string {
  const [encodedIv, encodedTag, encodedData] = encryptedSecret.split(".");
  if (!encodedIv || !encodedTag || !encodedData) throw new Error("Stored authenticator secret is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(encodedIv, "base64url"));
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedData, "base64url")),
    decipher.final()
  ]).toString("utf8");
}

export function verifyTotpCode(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const currentStep = Math.floor(now / 30_000);
  for (const step of [currentStep, currentStep - 1, currentStep + 1]) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24)
      | ((digest[offset + 1] & 0xff) << 16)
      | ((digest[offset + 2] & 0xff) << 8)
      | (digest[offset + 3] & 0xff);
    if ((binary % 1_000_000).toString().padStart(6, "0") === code) return step;
  }
  return null;
}
