/** Basic email format check. Not exhaustive — just catches obvious typos. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Detects a 16-character alphanumeric magic-link token. */
export function isMagicLinkToken(value: string): boolean {
  return /^[A-Za-z0-9]{16}$/.test(value.trim());
}
