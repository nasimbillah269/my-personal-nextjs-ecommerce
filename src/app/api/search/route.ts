import { nameMatches, searchWords } from "@/lib/search";
import { getActiveProducts } from "@/server/queries";

const LIMIT = 6;

/** Live suggestions for the header search box: GET /api/search?q=pink&category=salt */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const category = searchParams.get("category") ?? "";
  const words = searchWords(q);
  if (words.length === 0) return Response.json({ items: [], total: 0 });

  const matches = (await getActiveProducts()).filter((p) => (!category || p.category === category) && nameMatches(p.name, words));
  // Names that start with the first word come first.
  const first = words[0];
  matches.sort((a, b) => Number(b.name.toLowerCase().startsWith(first)) - Number(a.name.toLowerCase().startsWith(first)));

  const items = matches.slice(0, LIMIT).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    oldPrice: p.oldPrice ?? null,
    category: p.category,
    image: p.image ?? null,
    emoji: p.emoji,
    tint: p.tint,
    stock: p.stock,
  }));
  return Response.json({ items, total: matches.length });
}
