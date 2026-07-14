import { customAlphabet } from "nanoid";

// Unambiguous alphabet (no 0/O/1/l/I) for tokens that may be read out loud or typed.
const alphabet =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 24);

export function generateLinkToken(): string {
  return nanoid();
}

export function expiryDateFromDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}
