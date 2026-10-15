/**
 * Blog posts are stored as simple text so admins can write them in a textarea:
 *
 *   ## Section heading
 *   ### Sub heading
 *   A paragraph. Consecutive lines join into one paragraph; a blank line starts a new one.
 *   - A bullet item
 *   1. A numbered item
 *   > A quote
 *   Inline: **bold**, *italic*, [link text](https://example.com)
 *
 * Rendering never uses raw HTML, so content can't inject scripts.
 */
export type PostBlock =
  | { type: "h2" | "h3" | "p" | "quote"; text: string }
  | { type: "ul" | "ol"; items: string[] };

export function parsePostContent(text: string): PostBlock[] {
  const blocks: PostBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ") });
    para = [];
  };
  const pushItem = (type: "ul" | "ol", item: string) => {
    const last = blocks.at(-1);
    if (last && last.type === type) last.items.push(item);
    else blocks.push({ type, items: [item] });
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (!line) {
      flush();
      continue;
    }
    if (!numbered && !/^(#{2,3} |> |- )/.test(line)) {
      para.push(line);
      continue;
    }
    flush();
    if (line.startsWith("### ")) blocks.push({ type: "h3", text: line.slice(4).trim() });
    else if (line.startsWith("## ")) blocks.push({ type: "h2", text: line.slice(3).trim() });
    else if (line.startsWith("- ")) pushItem("ul", line.slice(2).trim());
    else if (numbered) pushItem("ol", numbered[1]);
    else {
      const last = blocks.at(-1);
      if (last?.type === "quote") last.text += ` ${line.slice(2).trim()}`;
      else blocks.push({ type: "quote", text: line.slice(2).trim() });
    }
  }
  flush();
  return blocks;
}

export type InlinePart = { type: "text" | "bold" | "italic"; text: string } | { type: "link"; text: string; href: string };

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Only http(s), mailto, tel and site-relative links are kept; anything else renders as plain text. */
const safeHref = (href: string) => /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(href);

export function parseInline(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) parts.push({ type: "text", text: text.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ type: "bold", text: m[1] });
    else if (m[2] !== undefined) parts.push({ type: "italic", text: m[2] });
    else if (safeHref(m[4])) parts.push({ type: "link", text: m[3], href: m[4] });
    else parts.push({ type: "text", text: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

/** Rough reading time at ~200 words a minute. */
export const readingMinutes = (text: string) => Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 200));

export const slugify = (s: string, max = 160) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
