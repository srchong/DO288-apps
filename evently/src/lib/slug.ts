import { customAlphabet } from "nanoid";

// Lowercase letters + digits, no ambiguous characters, for short public URLs.
const nanoid = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 8);

export function generateSlug(): string {
  return nanoid();
}

// Random token used as a content hash in R2 object keys, so files can be
// served with an immutable Cache-Control header.
const hashId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

export function generateAssetHash(): string {
  return hashId();
}
