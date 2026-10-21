/** Lower-cased search words; "  Pink   SALT " → ["pink", "salt"]. */
export const searchWords = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean);

/** True when every word appears in the name, in any order — shared by the header suggestions and the product listing. */
export function nameMatches(name: string, words: string[]) {
  const n = name.toLowerCase();
  return words.every((w) => n.includes(w));
}
