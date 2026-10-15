import Link from "next/link";
import { parseInline, parsePostContent } from "@/lib/post-content";

function Inline({ text }: { text: string }) {
  return parseInline(text).map((part, i) => {
    switch (part.type) {
      case "bold":
        return <strong key={i} className="font-bold text-heading">{part.text}</strong>;
      case "italic":
        return <em key={i}>{part.text}</em>;
      case "link":
        return part.href.startsWith("/") ? (
          <Link key={i} href={part.href} className="font-semibold text-brand underline-offset-2 hover:underline">
            {part.text}
          </Link>
        ) : (
          <a key={i} href={part.href} target="_blank" rel="noopener noreferrer nofollow" className="font-semibold text-brand underline-offset-2 hover:underline">
            {part.text}
          </a>
        );
      default:
        return part.text;
    }
  });
}

/** Renders post markup (see src/lib/post-content.ts) as React elements — never as raw HTML. */
export function PostContent({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div className={`space-y-4 text-[15px] leading-7 text-heading/85 ${className}`}>
      {parsePostContent(content).map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2 key={i} className="pt-3 text-xl font-bold text-heading sm:text-2xl">
                <Inline text={b.text} />
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="pt-1 text-lg font-bold text-heading">
                <Inline text={b.text} />
              </h3>
            );
          case "quote":
            return (
              <blockquote key={i} className="rounded-r-xl border-l-4 border-brand bg-brand-light/40 px-5 py-3 italic">
                <Inline text={b.text} />
              </blockquote>
            );
          case "ul":
          case "ol": {
            const List = b.type;
            return (
              <List key={i} className={`space-y-1.5 pl-6 ${b.type === "ul" ? "list-disc" : "list-decimal"} marker:text-brand`}>
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </List>
            );
          }
          default:
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
        }
      })}
    </div>
  );
}
