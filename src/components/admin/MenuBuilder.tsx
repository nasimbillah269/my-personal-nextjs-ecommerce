"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Files,
  FolderTree,
  Indent,
  Link2,
  Loader2,
  MenuSquare,
  Outdent,
  Plus,
  Save,
  Search,
  Store,
  Tag,
  Trash2,
} from "lucide-react";
import { MENU_LOCATION_HINTS, MENU_LOCATION_LABELS, MENU_LOCATIONS, type MenuItemType, type MenuLocation } from "@/lib/constants";
import { deleteMenu, saveMenu } from "@/server/admin/menu-actions";
import { ActionButton, Toggle } from "./controls";
import { useToast } from "./Toast";
import { btnPrimary, Card, EmptyState, Field, inputCls } from "./ui";

type RefType = Exclude<MenuItemType, "custom">;
type Option = { id: number; title: string; note?: string };
export type MenuOptions = Record<RefType, Option[]>;

type SavedItem = { type: MenuItemType; refId: number | null; label: string; url: string; openInNewTab: boolean; depth: 0 | 1 };
export type MenuRow = { id: number; name: string; location: MenuLocation | null; isActive: boolean; items: SavedItem[] };

type DraftItem = SavedItem & { key: number };
type Draft = { id: number | null; name: string; location: MenuLocation | ""; isActive: boolean; items: DraftItem[] };

let nextKey = 1;
const withKeys = (items: SavedItem[]): DraftItem[] => items.map((i) => ({ ...i, key: nextKey++ }));
const toDraft = (m: MenuRow | null): Draft =>
  m
    ? { id: m.id, name: m.name, location: m.location ?? "", isActive: m.isActive, items: withKeys(m.items) }
    : { id: null, name: "", location: "", isActive: true, items: [] };
const plain = (i: DraftItem): SavedItem => ({
  type: i.type,
  refId: i.refId,
  label: i.label,
  url: i.url,
  openInNewTab: i.openInNewTab,
  depth: i.depth,
});
const serialize = (d: Draft) => JSON.stringify({ ...d, items: d.items.map(plain) });

const typeMeta: Record<MenuItemType, { label: string; icon: typeof Files }> = {
  custom: { label: "Custom link", icon: Link2 },
  page: { label: "Page", icon: Files },
  product_category: { label: "Product category", icon: FolderTree },
  post_category: { label: "Post category", icon: Tag },
  post: { label: "Blog post", icon: FileText },
};

const STORE_LINKS = [
  { label: "Home", url: "/" },
  { label: "All Products", url: "/products" },
  { label: "Blog", url: "/blog" },
  { label: "Cart", url: "/cart" },
  { label: "Checkout", url: "/checkout" },
  { label: "Contact", url: "#footer" },
];

/* ---------- Tree helpers on the flat, depth-tagged list ---------- */

/** Index just past item i and its children. */
const blockEnd = (items: DraftItem[], i: number) => {
  let j = i + 1;
  while (j < items.length && items[j].depth > items[i].depth) j++;
  return j;
};

function moveUp(items: DraftItem[], i: number) {
  if (i === 0) return items;
  let p = i - 1;
  while (p > 0 && items[p].depth > items[i].depth) p--;
  if (items[p].depth < items[i].depth) return items; // first child: can't leave its parent this way
  const end = blockEnd(items, i);
  return [...items.slice(0, p), ...items.slice(i, end), ...items.slice(p, i), ...items.slice(end)];
}

function moveDown(items: DraftItem[], i: number) {
  const end = blockEnd(items, i);
  if (end >= items.length || items[end].depth < items[i].depth) return items; // last item or last child
  const nextEnd = blockEnd(items, end);
  return [...items.slice(0, i), ...items.slice(end, nextEnd), ...items.slice(i, end), ...items.slice(nextEnd)];
}

/* ---------- Add-items panels ---------- */

function Panel({ title, icon: Icon, open, onToggle, children }: { title: string; icon: typeof Files; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className={`overflow-hidden rounded-xl border transition ${open ? "border-brand/60" : "border-dashed border-line"}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-bold text-heading hover:bg-soft">
        <Icon className="size-4 text-brand" />
        <span className="flex-1">{title}</span>
        <ChevronDown className={`size-4 text-body transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-line p-4">{children}</div>}
    </div>
  );
}

function ChecklistPanel({ options, empty, onAdd }: { options: Option[]; empty: string; onAdd: (picked: Option[]) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const shown = options.filter((o) => o.title.toLowerCase().includes(q.trim().toLowerCase()));

  if (!options.length) return <p className="text-sm text-body">{empty}</p>;
  return (
    <div className="space-y-3">
      {options.length > 6 && (
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-body" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={`${inputCls} h-10 pl-9`} />
        </label>
      )}
      <ul className="max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-line p-1.5">
        {shown.map((o) => (
          <li key={o.id}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-heading hover:bg-soft">
              <input
                type="checkbox"
                checked={picked.includes(o.id)}
                onChange={(e) => setPicked((p) => (e.target.checked ? [...p, o.id] : p.filter((x) => x !== o.id)))}
                className="size-4 accent-brand"
              />
              <span className="min-w-0 flex-1 truncate">{o.title}</span>
              {o.note && <span className="rounded bg-soft px-1.5 text-[11px] font-semibold text-body">{o.note}</span>}
            </label>
          </li>
        ))}
        {!shown.length && <li className="px-2.5 py-1.5 text-sm text-body">No matches.</li>}
      </ul>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setPicked(picked.length === options.length ? [] : options.map((o) => o.id))}
          className="text-xs font-bold text-brand hover:underline"
        >
          {picked.length === options.length ? "Clear" : "Select all"}
        </button>
        <button
          type="button"
          disabled={!picked.length}
          onClick={() => {
            onAdd(options.filter((o) => picked.includes(o.id)));
            setPicked([]);
          }}
          className={`${btnPrimary} h-9`}
        >
          <Plus className="size-4" /> Add{picked.length ? ` (${picked.length})` : ""}
        </button>
      </div>
    </div>
  );
}

function CustomLinkPanel({ onAdd }: { onAdd: (label: string, url: string) => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const valid = label.trim() && /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(url.trim());
  return (
    <div className="space-y-3">
      <Field label="URL" htmlFor="custom-url" hint="e.g. /products, #footer or https://facebook.com/…">
        <input id="custom-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className={inputCls} />
      </Field>
      <Field label="Link text" htmlFor="custom-label">
        <input id="custom-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Facebook" className={inputCls} />
      </Field>
      <button
        type="button"
        disabled={!valid}
        onClick={() => {
          onAdd(label.trim(), url.trim());
          setLabel("");
          setUrl("");
        }}
        className={`${btnPrimary} h-9 w-full`}
      >
        <Plus className="size-4" /> Add to menu
      </button>
    </div>
  );
}

/* ---------- Builder ---------- */

/** Config screen for one menu (new when `menu` is null). */
export function MenuBuilder({
  menu,
  options,
  locationOwners,
  initialLocation,
}: {
  menu: MenuRow | null;
  options: MenuOptions;
  /** Active menus already holding each location, to warn before replacing them. */
  locationOwners: Partial<Record<MenuLocation, { id: number; name: string }>>;
  initialLocation?: MenuLocation;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => ({ ...toDraft(menu), ...(menu ? {} : { location: initialLocation ?? "" }) }));
  const [saved, setSaved] = useState(() => serialize(toDraft(menu)));
  const [openPanel, setOpenPanel] = useState<string>("custom");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const toast = useToast();
  const [pending, startSave] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = serialize(draft) !== saved;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submitted = draft;
    startSave(async () => {
      const result = await saveMenu(null, formData);
      if (!result) return;
      toast(result.ok, result.message ?? "");
      setErrors(result.errors ?? {});
      if (result.ok && result.id) {
        // Mark what was sent as saved; edits made while saving still show as unsaved.
        setSaved(serialize({ ...submitted, id: result.id }));
        setDraft((d) => ({ ...d, id: result.id! }));
        if (!submitted.id) router.replace(`/admin/menus/${result.id}`);
      }
    });
  };

  const titles = useMemo(() => {
    const map = new Map<string, Option>();
    for (const type of Object.keys(options) as RefType[]) for (const o of options[type]) map.set(`${type}:${o.id}`, o);
    return map;
  }, [options]);

  const setItems = (fn: (items: DraftItem[]) => DraftItem[]) =>
    setDraft((d) => {
      const items = fn(d.items);
      if (items[0]) items[0] = { ...items[0], depth: 0 }; // the first item can't be a child
      return { ...d, items };
    });
  const add = (items: SavedItem[]) => setItems((cur) => [...cur, ...withKeys(items)]);
  const update = (key: number, patch: Partial<DraftItem>) => setItems((cur) => cur.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  const remove = (keys: number[]) => {
    // Removing a parent removes its children too.
    setItems((cur) => {
      const drop = new Set<number>();
      cur.forEach((item, idx) => {
        if (keys.includes(item.key)) for (let j = idx; j < blockEnd(cur, idx); j++) drop.add(cur[j].key);
      });
      return cur.filter((i) => !drop.has(i.key));
    });
    setChecked((c) => c.filter((k) => !keys.includes(k)));
  };

  const refPanels: { type: RefType; title: string; icon: typeof Files; empty: string }[] = [
    { type: "page", title: "Pages", icon: Files, empty: "No pages yet — create them under Pages." },
    { type: "product_category", title: "Product Categories", icon: FolderTree, empty: "No product categories yet." },
    { type: "post_category", title: "Post Categories", icon: Tag, empty: "No post categories yet." },
    { type: "post", title: "Blog Posts", icon: FileText, empty: "No blog posts yet." },
  ];

  const allChecked = draft.items.length > 0 && checked.length === draft.items.length;
  const iconBtn = "grid size-7 place-items-center rounded-md text-body transition hover:bg-soft hover:text-brand disabled:pointer-events-none disabled:opacity-30";

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* Add items */}
      <Card title="Add items" className="self-start xl:sticky xl:top-24">
        <div className="space-y-2.5">
          <Panel title="Custom Link" icon={Link2} open={openPanel === "custom"} onToggle={() => setOpenPanel((p) => (p === "custom" ? "" : "custom"))}>
            <CustomLinkPanel onAdd={(label, url) => add([{ type: "custom", refId: null, label, url, openInNewTab: /^https?:/i.test(url), depth: 0 }])} />
          </Panel>
          <Panel title="Store Links" icon={Store} open={openPanel === "store"} onToggle={() => setOpenPanel((p) => (p === "store" ? "" : "store"))}>
            <ChecklistPanel
              options={STORE_LINKS.map((l, i) => ({ id: i + 1, title: l.label, note: l.url }))}
              empty=""
              onAdd={(picked) =>
                add(picked.map((o) => ({ type: "custom", refId: null, label: o.title, url: STORE_LINKS[o.id - 1].url, openInNewTab: false, depth: 0 })))
              }
            />
          </Panel>
          {refPanels.map((p) => (
            <Panel key={p.type} title={p.title} icon={p.icon} open={openPanel === p.type} onToggle={() => setOpenPanel((o) => (o === p.type ? "" : p.type))}>
              <ChecklistPanel
                options={options[p.type]}
                empty={p.empty}
                onAdd={(picked) => add(picked.map((o) => ({ type: p.type, refId: o.id, label: o.title, url: "", openInNewTab: false, depth: 0 })))}
              />
            </Panel>
          ))}
        </div>
      </Card>

      {/* Menu config */}
      <form onSubmit={onSubmit} className="min-w-0">
        <input type="hidden" name="id" value={draft.id ?? ""} />
        <input type="hidden" name="items" value={JSON.stringify(draft.items.map(plain))} />

        <Card
          title={draft.id ? "Menu config" : "New menu"}
          action={dirty && <span className="text-xs font-semibold text-amber-600">Unsaved changes</span>}
        >
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Menu name *" htmlFor="menu-name" error={errors.name} hint="Footer menus use this as the column title.">
                <input
                  id="menu-name"
                  name="name"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  aria-invalid={!!errors.name}
                  placeholder="e.g. Main menu"
                  className={inputCls}
                />
              </Field>
              <Field label="Menu location" htmlFor="menu-location" error={errors.location} hint={draft.location ? MENU_LOCATION_HINTS[draft.location] : "Pick where this menu appears in the store."}>
                <select
                  id="menu-location"
                  name="location"
                  value={draft.location}
                  onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value as MenuLocation | "" }))}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">Not shown anywhere</option>
                  {MENU_LOCATIONS.map((l) => {
                    const owner = locationOwners[l]?.id === draft.id ? undefined : locationOwners[l];
                    return (
                      <option key={l} value={l}>
                        {MENU_LOCATION_LABELS[l]}
                        {owner ? ` (replaces “${owner.name}”)` : ""}
                      </option>
                    );
                  })}
                </select>
              </Field>
            </div>

            {/* Structure */}
            <div className="rounded-xl border border-line">
              <div className="flex flex-wrap items-center gap-3 border-b border-line bg-soft px-4 py-2.5">
                <p className="flex-1 text-sm font-bold text-heading">
                  Menu structure <span className="font-normal text-body">· {draft.items.length} item{draft.items.length === 1 ? "" : "s"}</span>
                </p>
                {draft.items.length > 0 && (
                  <>
                    <button
                      type="button"
                      disabled={!checked.length}
                      onClick={() => remove(checked)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" /> Delete{checked.length ? ` (${checked.length})` : ""}
                    </button>
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-heading">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => setChecked(allChecked ? [] : draft.items.map((i) => i.key))}
                        className="size-4 accent-brand"
                      />
                      All
                    </label>
                  </>
                )}
              </div>

              {draft.items.length === 0 ? (
                <EmptyState icon={MenuSquare} title="No items yet" text="Pick pages, categories or links on the left and press Add." />
              ) : (
                <ul className="space-y-2 p-3">
                  {draft.items.map((item, idx) => {
                    const meta = typeMeta[item.type];
                    const ref = item.refId ? titles.get(`${item.type}:${item.refId}`) : undefined;
                    const missing = item.type !== "custom" && !ref;
                    const isOpen = expanded === item.key;
                    const hasChildren = blockEnd(draft.items, idx) > idx + 1;
                    return (
                      <li key={item.key} className={item.depth ? "ml-8" : ""}>
                        <div className={`rounded-lg border bg-surface ${isOpen ? "border-brand/60 shadow-sm" : "border-line"} ${missing ? "border-red-300" : ""}`}>
                          <div className="flex items-center gap-2 px-3 py-2">
                            <input
                              type="checkbox"
                              aria-label={`Select ${item.label}`}
                              checked={checked.includes(item.key)}
                              onChange={(e) => setChecked((c) => (e.target.checked ? [...c, item.key] : c.filter((k) => k !== item.key)))}
                              className="size-4 shrink-0 accent-brand"
                            />
                            <button
                              type="button"
                              onClick={() => setExpanded(isOpen ? null : item.key)}
                              aria-expanded={isOpen}
                              className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            >
                              <meta.icon className="size-4 shrink-0 text-brand" />
                              <span className="truncate text-sm font-bold text-heading">{item.label}</span>
                              {item.openInNewTab && <ExternalLink className="size-3 shrink-0 text-body" />}
                              <span className="hidden shrink-0 rounded bg-soft px-1.5 py-0.5 text-[11px] font-semibold text-body sm:inline">
                                {missing ? "Deleted" : meta.label}
                              </span>
                              <ChevronRight className={`ml-auto size-4 shrink-0 text-body transition ${isOpen ? "rotate-90" : ""}`} />
                            </button>
                            <div className="flex shrink-0 items-center">
                              <button type="button" title="Move up" aria-label="Move up" onClick={() => setItems((c) => moveUp(c, idx))} className={iconBtn}>
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button type="button" title="Move down" aria-label="Move down" onClick={() => setItems((c) => moveDown(c, idx))} className={iconBtn}>
                                <ArrowDown className="size-3.5" />
                              </button>
                              {item.depth === 0 ? (
                                <button
                                  type="button"
                                  title="Make sub-item of the item above"
                                  aria-label="Indent"
                                  disabled={idx === 0 || hasChildren}
                                  onClick={() => update(item.key, { depth: 1 })}
                                  className={iconBtn}
                                >
                                  <Indent className="size-3.5" />
                                </button>
                              ) : (
                                <button type="button" title="Move out of dropdown" aria-label="Outdent" onClick={() => update(item.key, { depth: 0 })} className={iconBtn}>
                                  <Outdent className="size-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {isOpen && (
                            <div className="space-y-3 border-t border-line px-3 py-3">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Field label="Navigation label" htmlFor={`label-${item.key}`}>
                                  <input
                                    id={`label-${item.key}`}
                                    value={item.label}
                                    onChange={(e) => update(item.key, { label: e.target.value })}
                                    className={`${inputCls} h-10`}
                                  />
                                </Field>
                                {item.type === "custom" ? (
                                  <Field label="URL" htmlFor={`url-${item.key}`}>
                                    <input
                                      id={`url-${item.key}`}
                                      value={item.url}
                                      onChange={(e) => update(item.key, { url: e.target.value })}
                                      className={`${inputCls} h-10 font-mono text-xs`}
                                    />
                                  </Field>
                                ) : (
                                  <div>
                                    <span className="mb-1.5 block text-sm font-bold text-heading">Links to</span>
                                    <p className={`flex h-10 items-center rounded-lg bg-soft px-3 text-sm ${missing ? "text-red-500" : "text-body"}`}>
                                      {missing ? "This item was deleted — remove it from the menu." : `${meta.label}: ${ref!.title}`}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-heading">
                                  <input
                                    type="checkbox"
                                    checked={item.openInNewTab}
                                    onChange={(e) => update(item.key, { openInNewTab: e.target.checked })}
                                    className="size-4 accent-brand"
                                  />
                                  Open in a new tab
                                </label>
                                <button type="button" onClick={() => remove([item.key])} className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:underline">
                                  <Trash2 className="size-3.5" /> Remove{hasChildren ? " with sub-items" : ""}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {errors.items && <p className="px-4 pb-3 text-xs font-semibold text-red-500">{errors.items}</p>}
              {draft.items.length > 1 && (
                <p className="border-t border-line px-4 py-2.5 text-xs text-body">
                  Tip: use <Indent className="inline size-3.5" /> to tuck an item under the one above it — in the header it becomes a dropdown.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
              <div className="min-w-56 flex-1">
                <ActiveToggle key={draft.id ?? "new"} isActive={draft.isActive} onChange={(v) => setDraft((d) => ({ ...d, isActive: v }))} />
              </div>
              <div className="flex items-center gap-2">
                {draft.id && (
                  <ActionButton
                    action={async () => {
                      const result = await deleteMenu(draft.id!);
                      if (result?.ok) router.push("/admin/menus");
                      return result;
                    }}
                    confirmText={`Delete the menu “${draft.name}”?`}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    <Trash2 className="size-4" /> Delete menu
                  </ActionButton>
                )}
                <button type="submit" disabled={pending} className={btnPrimary}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {draft.id ? "Save changes" : "Create menu"}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}

/** The shared Toggle is uncontrolled; mirror its value into the draft so "unsaved changes" stays accurate. */
function ActiveToggle({ isActive, onChange }: { isActive: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onChange={(e) => onChange((e.target as HTMLInputElement).checked)}>
      <Toggle name="isActive" label="Active" hint="Inactive menus are kept but not shown in the store." defaultChecked={isActive} />
    </div>
  );
}
