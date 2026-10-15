"use client";

import { useRef, useState } from "react";
import { Bold, Eye, Heading2, Heading3, Italic, Link2, List, ListOrdered, PencilLine, Quote } from "lucide-react";
import { PostContent } from "../PostContent";
import { inputCls } from "./ui";

type Tool =
  | { kind: "wrap"; before: string; after: string; placeholder: string }
  | { kind: "line"; prefix: string | ((i: number) => string); placeholder: string };

const tools: { label: string; icon: typeof Bold; tool: Tool }[] = [
  { label: "Heading", icon: Heading2, tool: { kind: "line", prefix: "## ", placeholder: "Heading" } },
  { label: "Sub heading", icon: Heading3, tool: { kind: "line", prefix: "### ", placeholder: "Sub heading" } },
  { label: "Bold", icon: Bold, tool: { kind: "wrap", before: "**", after: "**", placeholder: "bold text" } },
  { label: "Italic", icon: Italic, tool: { kind: "wrap", before: "*", after: "*", placeholder: "italic text" } },
  { label: "Bullet list", icon: List, tool: { kind: "line", prefix: "- ", placeholder: "List item" } },
  { label: "Numbered list", icon: ListOrdered, tool: { kind: "line", prefix: (i) => `${i + 1}. `, placeholder: "List item" } },
  { label: "Quote", icon: Quote, tool: { kind: "line", prefix: "> ", placeholder: "Quote" } },
  { label: "Link", icon: Link2, tool: { kind: "wrap", before: "[", after: "](https://)", placeholder: "link text" } },
];

/**
 * Textarea for the lightweight markup in src/lib/post-content.ts, with a formatting toolbar and a live preview.
 * The textarea stays mounted during preview so its value still submits with the form.
 */
export function MarkupEditor({
  name,
  value,
  onChange,
  error,
  rows = 18,
  placeholder,
  label,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
  placeholder?: string;
  label: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  const apply = (tool: Tool) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    let next: string;
    let selFrom: number;
    let selTo: number;

    if (tool.kind === "wrap") {
      const text = value.slice(start, end) || tool.placeholder;
      next = value.slice(0, start) + tool.before + text + tool.after + value.slice(end);
      selFrom = start + tool.before.length;
      selTo = selFrom + text.length;
    } else {
      // Prefix every line the selection touches; a line block also needs blank-line separation from paragraphs.
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const nl = value.indexOf("\n", end);
      const lineEnd = nl === -1 ? value.length : nl;
      const lines = (value.slice(lineStart, lineEnd) || tool.placeholder).split("\n");
      const block = lines
        .map((l, i) => {
          const bare = l.replace(/^(#{2,3} |> |- |\d+[.)] )/, "");
          return (typeof tool.prefix === "function" ? tool.prefix(i) : tool.prefix) + (bare || tool.placeholder);
        })
        .join("\n");
      next = value.slice(0, lineStart) + block + value.slice(lineEnd);
      selFrom = lineStart;
      selTo = lineStart + block.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selFrom, selTo);
    });
  };

  const btn = "grid size-8 place-items-center rounded-md text-body transition hover:bg-surface hover:text-brand disabled:opacity-40";

  return (
    <div>
      <div className={`overflow-hidden rounded-lg border bg-surface ${error ? "border-red-400" : "border-line"} focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-light`}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-soft px-2 py-1.5" role="toolbar" aria-label="Formatting">
          {tools.map(({ label: l, icon: Icon, tool }) => (
            <button key={l} type="button" title={l} aria-label={l} disabled={preview} onClick={() => apply(tool)} className={btn}>
              <Icon className="size-4" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold text-brand transition hover:bg-surface"
          >
            {preview ? <PencilLine className="size-3.5" /> : <Eye className="size-3.5" />}
            {preview ? "Edit" : "Preview"}
          </button>
        </div>
        <textarea
          ref={ref}
          id={name}
          name={name}
          aria-label={label}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          hidden={preview}
          placeholder={placeholder}
          className={`${inputCls} h-auto resize-y rounded-none border-0 py-3 font-mono text-[13px] leading-6 focus:ring-0`}
        />
        {preview && (
          <div className="min-h-64 p-5">
            {value.trim() ? <PostContent content={value} /> : <p className="text-sm text-body">Nothing to preview yet.</p>}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
      ) : (
        <p className="mt-1.5 text-xs text-body">Select text and use the toolbar, or type the marks yourself. Leave a blank line between paragraphs.</p>
      )}
    </div>
  );
}
