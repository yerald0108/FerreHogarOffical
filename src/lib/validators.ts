/**
 * Validates a Cuban phone number.
 * Accepted formats: +53 5XXXXXXX, 535XXXXXXX, 5XXXXXXX
 * Cuban mobile numbers start with 5 and have 8 digits total.
 */
export function isValidCubanPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  // Match: optional +53 prefix, then 5 followed by 7 digits
  return /^(\+?53)?5\d{7}$/.test(cleaned);
}

/**
 * Formats a phone number for display
 */
export function formatCubanPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  const digits = cleaned.replace(/^\+?53/, '');
  if (digits.length === 8) {
    return `+53 ${digits.slice(0, 4)} ${digits.slice(4)}`;
  }
  return phone;
}
