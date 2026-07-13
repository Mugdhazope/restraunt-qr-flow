/**
 * Build India E.164 (+91…) from 10-digit local part or an existing numeric string.
 * Avoids double-prefixing if the context already stored 91XXXXXXXXXX.
 */
export function toIndiaE164(fromContext: string): string {
  const raw = (fromContext || "").replace(/\D/g, "");
  if (!raw) return "";
  if (raw.length === 12 && raw.startsWith("91")) {
    return `+${raw}`;
  }
  if (raw.length === 10) {
    return `+91${raw}`;
  }
  if (raw.startsWith("91") && raw.length >= 11) {
    return `+${raw}`;
  }
  return `+${raw}`;
}
