/**
 * Azerbaijani-aware ASCII slug helpers.
 *
 * URLs use ASCII segments (Luma-style). AZ titles are case-folded with the
 * `az` locale, transliterated to ASCII, then hyphenated.
 */

const AZ_TO_ASCII: Record<string, string> = {
  ə: "e",
  ı: "i",
  ö: "o",
  ü: "u",
  ş: "s",
  ç: "c",
  ğ: "g",
};

const AZ_LETTERS_PATTERN = /[əığıöüşç]/g;

/**
 * Lowercase with Azerbaijani rules (I → ı, İ → i) and map AZ letters to ASCII.
 */
export function transliterateAzerbaijani(text: string): string {
  const lower = text.trim().toLocaleLowerCase("az");
  return lower.replace(
    AZ_LETTERS_PATTERN,
    (char) => AZ_TO_ASCII[char] ?? char,
  );
}

/**
 * Produce a URL-safe ASCII slug segment from arbitrary text.
 */
export function slugifyAscii(text: string, maxLength = 60): string {
  return transliterateAzerbaijani(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
}
