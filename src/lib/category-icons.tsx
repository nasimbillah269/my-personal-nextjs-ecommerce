import { createElement } from "react";
import {
  Apple,
  BadgePercent,
  Candy,
  Coffee,
  Cookie,
  Droplets,
  Egg,
  Fish,
  Gem,
  LayoutGrid,
  Leaf,
  Milk,
  Nut,
  Package,
  Salad,
  Soup,
  Sparkles,
  Wheat,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** Icons an admin can pick for a category. Stored in the DB by name. */
export const categoryIcons: Record<string, LucideIcon> = {
  Nut,
  Droplets,
  Package,
  LayoutGrid,
  Gem,
  BadgePercent,
  Coffee,
  Leaf,
  Wheat,
  Milk,
  Apple,
  Candy,
  Cookie,
  Egg,
  Fish,
  Salad,
  Soup,
  Sparkles,
};

export const categoryIcon = (name: string): LucideIcon => categoryIcons[name] ?? LayoutGrid;

export function CategoryIcon({ name, ...props }: LucideProps & { name: string }) {
  return createElement(categoryIcon(name), props);
}
