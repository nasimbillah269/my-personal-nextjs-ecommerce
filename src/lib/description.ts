import type { DescriptionBlock } from "./types";

/**
 * Product descriptions are stored as simple text so admins can edit them in a textarea:
 *
 *   ## Section heading
 *   A plain line of text
 *   ### Highlighted point title
 *   Text for that point
 *   - A bullet item
 */
export function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let block: DescriptionBlock | null = null;
  let openPoint: { title: string; text: string } | null = null;

  const current = () => {
    if (!block) {
      block = { heading: "" };
      blocks.push(block);
    }
    return block;
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("### ")) {
      openPoint = { title: line.slice(4).trim(), text: "" };
      (current().points ??= []).push(openPoint);
    } else if (line.startsWith("## ")) {
      block = { heading: line.slice(3).trim() };
      blocks.push(block);
      openPoint = null;
    } else if (line.startsWith("- ")) {
      (current().bullets ??= []).push(line.slice(2).trim());
      openPoint = null;
    } else if (openPoint && !openPoint.text) {
      openPoint.text = line;
    } else {
      (current().lines ??= []).push(line);
      openPoint = null;
    }
  }
  return blocks;
}

export function serializeDescription(blocks: DescriptionBlock[]): string {
  return blocks
    .map((b) =>
      [
        b.heading && `## ${b.heading}`,
        ...(b.lines ?? []),
        ...(b.points ?? []).flatMap((p) => [`### ${p.title}`, p.text]),
        ...(b.bullets ?? []).map((x) => `- ${x}`),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}
