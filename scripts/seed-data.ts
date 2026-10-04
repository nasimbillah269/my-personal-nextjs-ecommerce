/** Initial catalog used by scripts/seed.ts. After seeding, manage data in the admin panel. */

export type Category = {
  slug: string;
  name: string;
  icon: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  /** Path under /public, e.g. "/products/chia-seed.png". Falls back to the emoji tile. */
  image?: string;
  emoji: string;
  tint: string;
};

export const categories: Category[] = [
  { slug: "nuts-seeds", name: "Nuts & Seeds", icon: "Nut" },
  { slug: "oil", name: "Oil", icon: "Droplets" },
  { slug: "organic-sugar", name: "Organic Sugar", icon: "Package" },
  { slug: "others", name: "Others", icon: "LayoutGrid" },
  { slug: "salt", name: "Salt", icon: "Gem" },
  { slug: "special-offer", name: "Special Offer", icon: "BadgePercent" },
  { slug: "coffee", name: "Coffee & Cacao", icon: "Coffee" },
  { slug: "herbal-care", name: "Herbal Care", icon: "Leaf" },
];

export const products: Product[] = [
  { id: "chia-seed", name: "Ultimate Organic Chia seed", price: 1490, category: "nuts-seeds", emoji: "🌱", tint: "#e6f4ea" },
  { id: "black-rice", name: "Ultimate Organic Black Rice", price: 1090, category: "others", emoji: "🍚", tint: "#ede7f6" },
  { id: "olive-oil", name: "UOL Organic Extra Virgin Olive Oil", price: 2490, category: "oil", emoji: "🛢️", tint: "#f1f8e9" },
  { id: "mustard-oil", name: "Mustard Oil", price: 380, category: "oil", emoji: "🌼", tint: "#fff6dc" },
  { id: "coconut-vinegar", name: "Ultimate Organic Coconut Cider Vinegar", price: 1590, category: "others", emoji: "🥥", tint: "#f3ece8" },
  { id: "arabica-coffee", name: "Ultimate Organic Arabica Whole Coffee Bean", price: 1490, category: "coffee", emoji: "☕", tint: "#e6f4ea" },
  { id: "pink-salt", name: "Himalayan Pink Salt", price: 1320, category: "salt", emoji: "🧂", tint: "#fce4ec" },
  { id: "maca-cacao", name: "UOL Organic Black maca & Cacao Powder Blend", price: 2190, category: "coffee", emoji: "🍫", tint: "#f3ece8" },
  { id: "galangal-toothpaste", name: "Lesser Galanga Herbal Toothpaste", price: 1490, category: "herbal-care", emoji: "🦷", tint: "#e0f2f1" },
  { id: "huanarpo", name: "Ultimate Organic Huanarpo Macho", price: 2590, category: "herbal-care", emoji: "🌿", tint: "#fbe9e7" },
  { id: "deshi-ghee", name: "Deshi Ghee", price: 1050, category: "others", emoji: "🧈", tint: "#fff6dc" },
  { id: "coconut-oil", name: "UOL Coconut Cooking Oil", price: 1790, category: "oil", emoji: "🥥", tint: "#f4f6fa" },
  { id: "steel-cut-oats", name: "Ultimate Organic Steel Cut Oats", price: 1490, category: "others", emoji: "🌾", tint: "#fff3e0" },
  { id: "lavender-soap", name: "Organic Lavender Bar Soap", price: 1390, category: "herbal-care", emoji: "🧼", tint: "#f3e5f5" },
  { id: "hair-serum", name: "Organic Hair Serum Bergamot & Argan Oil", price: 2190, category: "herbal-care", emoji: "💧", tint: "#fbe9e7" },
  { id: "toothpaste-cardamom", name: "Organic Toothpaste Clove Cardamom", price: 1791, oldPrice: 1990, category: "special-offer", emoji: "🦷", tint: "#fce4ec" },
  { id: "raw-honey", name: "Organic Raw Honey Unfiltered", price: 2390, category: "others", emoji: "🍯", tint: "#fff6dc" },
  { id: "apple-cider", name: "Organic Apple Cider Vinegar With Mother", price: 1590, category: "others", emoji: "🍎", tint: "#ffebee" },
  { id: "coffee-enema", name: "Coffee Enema kit Silicone Bag 2 liter", price: 2490, category: "coffee", emoji: "☕", tint: "#f1f8e9" },
  { id: "whey-protein", name: "LIFE Grass-Fed Whey Protein Powder - Vanilla Flavor 289g | High Protein", price: 5990, category: "others", emoji: "💪", tint: "#e3f2fd" },
  { id: "toothpaste-aloe", name: "Organic Toothpaste Mint Aloe Neem", price: 1791, oldPrice: 1990, category: "special-offer", emoji: "🦷", tint: "#e0f2f1" },
];

const byId = (id: string) => products.find((p) => p.id === id)!;

export const popularProducts = products.filter((p) => p.id !== "toothpaste-aloe");

export const dailyBestSells = ["olive-oil", "pink-salt", "toothpaste-aloe", "raw-honey", "deshi-ghee"].map(byId);

export const contact = {
  phone: "09678242404",
  email: "info@ultimateorganiclife.com",
  address: "Dhaka, Bangladesh",
};

/* ---------- Product detail page data ---------- */

export type Variant = { label: string; price: number; oldPrice?: number };

export type DescriptionBlock = {
  heading: string;
  lines?: string[];
  points?: { title: string; text: string }[];
  bullets?: string[];
};

export type ProductDetails = {
  summary: string;
  variants: Variant[];
  stock: number;
  tags: string[];
  brand: string;
  weight: string;
  origin: string;
  description: DescriptionBlock[];
};

const detailOverrides: Record<string, Partial<ProductDetails>> = {
  "olive-oil": {
    summary:
      "অলিভ অয়েলের উৎপত্তি হয় প্রাচীন ভূমধ্যসাগরীয় অঞ্চলে। প্রায় ৬০০০ বছর আগে থেকে এই অঞ্চলের মানুষ জলপাই চাষ করে আসছে এবং জলপাই থেকে তেল সংগ্রহ করে আসছে। প্রাচীন মিশরীয়, গ্রিক এবং রোমানরা অলিভ অয়েলকে তাদের দৈনন্দিন জীবনে বিভিন্নভাবে ব্যবহার করত — রান্না, চিকিৎসা এবং সৌন্দর্য রক্ষায়। আধুনিক কালে অলিভ অয়েল তার স্বাস্থ্য উপকারিতা এবং উৎকৃষ্ট মানের জন্য বিশ্বজুড়ে সমাদৃত।",
    variants: [
      { label: "500 ML", price: 2490 },
      { label: "1000 ML", price: 4690 },
    ],
    stock: 5474,
    tags: ["organic olive oil", "olive oil", "extra virgin olive oil", "virgin olive oil"],
    weight: "500 ML / 1000 ML",
    origin: "Spain",
    description: [
      {
        heading: "প্রোডাক্ট পরিচিতি",
        lines: [
          "জলপাই থেকে Centrifugal Cold Extraction Process-এ প্রস্তুত — কোনো Heat বা Chemical ব্যবহার করা হয়নি।",
          "এতে প্রাকৃতিকভাবে থাকে Monounsaturated Fat (Oleic Acid), Vitamin E, Polyphenols।",
          "এটি Premium গ্রেড Extra Virgin Olive Oil → Cooking, Salad Dressing ও Therapeutic ব্যবহারের জন্য আদর্শ।",
        ],
      },
      {
        heading: "মূল উপকারিতা (Key Benefits)",
        points: [
          {
            title: "হৃদপিণ্ডের সুরক্ষা দেয়",
            text: "এতে থাকা মনোআনস্যাচুরেটেড ফ্যাটি অ্যাসিড (MUFA) খারাপ কোলেস্টেরল (LDL) কমিয়ে ভালো কোলেস্টেরল (HDL) বাড়ায়, যা হার্ট অ্যাটাক ও স্ট্রোকের ঝুঁকি কমায়।",
          },
          {
            title: "ওজন নিয়ন্ত্রণে সহায়ক",
            text: "স্বাস্থ্যকর ফ্যাট মেটাবলিজম বাড়ায় এবং দীর্ঘসময় পেট ভরা রাখে, ফলে অতিরিক্ত খাওয়ার প্রবণতা কমে যায়।",
          },
          {
            title: "ডায়াবেটিস প্রতিরোধে সহায়তা করে",
            text: "অলিভ অয়েল রক্তে শর্করার মাত্রা নিয়ন্ত্রণ করে এবং ইনসুলিন সেনসিটিভিটি উন্নত করে।",
          },
          {
            title: "মস্তিষ্কের কার্যক্ষমতা বাড়ায়",
            text: "অ্যান্টিঅক্সিডেন্ট ও হেলদি ফ্যাট মস্তিষ্কের কোষকে সুরক্ষা দেয়, স্মৃতিশক্তি বৃদ্ধি করে এবং স্নায়বিক রোগ প্রতিরোধে সহায়তা করে।",
          },
          {
            title: "ত্বক ও চুলের যত্নে কার্যকর",
            text: "ভিটামিন ই ও অ্যান্টিঅক্সিডেন্ট ত্বককে নরম ও উজ্জ্বল রাখে। চুলে ব্যবহার করলে খুশকি কমে, চুল মজবুত হয় ও প্রাকৃতিক উজ্জ্বলতা ফিরে আসে।",
          },
          {
            title: "ইমিউন সিস্টেম শক্তিশালী করে",
            text: "অলিভ অয়েল শরীরে প্রদাহ কমায় এবং রোগ প্রতিরোধ ক্ষমতা বাড়ায়।",
          },
        ],
      },
      {
        heading: "JK Lifestyle কানেকশন",
        lines: [
          "Fat Adaptation ধাপ: Healthy Fat দিয়ে ফ্যাট বার্ন ও এনার্জি সাপোর্ট",
          "Fasting Support: অল্প পরিমাণে খেলে ক্ষুধা নিয়ন্ত্রণ করে",
          "Maintaining ধাপ: Long-term Heart & Brain Protection",
        ],
      },
      {
        heading: "খাওয়ার/ব্যবহার এর উপায় (Usage Guideline)",
        lines: [
          "ডোজ: দিনে ১–২ টেবিল চামচ",
          "সালাদ ড্রেসিং-এ Raw ব্যবহার",
          "হালকা রান্নায় (Low–Medium Heat)",
          "সকালে খালি পেটে ১ চা চামচ সোজা খাওয়া যায়",
          "বাহ্যিক ব্যবহার: Skin & Hair Care → Natural Moisturizer",
        ],
      },
      {
        heading: "সতর্কতা (Precautions)",
        lines: [
          "High Heat Cooking (Deep Fry)-এ ব্যবহার করা উচিত নয় → পুষ্টিগুণ নষ্ট হয়",
          "অতিরিক্ত খেলে Loose Motion হতে পারে",
          "কিডনি/লিভারের রোগীদের ডাক্তারের পরামর্শক্রমে ব্যবহার করা উচিত",
          "শিশুদের জন্য সীমিত ডোজ (½ চা চামচ যথেষ্ট)",
        ],
      },
      {
        heading: "ব্যবহার পদ্ধতি",
        bullets: [
          "প্রতিদিন ১–২ চা চামচ সরাসরি খাওয়া যায়।",
          "সালাদ ড্রেসিং, স্মুদি, ভিনেগার বা হালকা রান্নায় ব্যবহার করা যায়।",
          "ত্বকে ময়েশ্চারাইজার হিসেবে এবং চুলে প্রাকৃতিক তেল হিসেবে ব্যবহার করা যায়।",
        ],
      },
    ],
  },
  "mustard-oil": {
    variants: [
      { label: "1 Litre", price: 380 },
      { label: "5 Litre", price: 1850 },
    ],
  },
  "coconut-oil": {
    variants: [
      { label: "500 ML", price: 1790 },
      { label: "1000 ML", price: 3390 },
    ],
  },
  "raw-honey": {
    variants: [
      { label: "500 g", price: 2390 },
      { label: "1 kg", price: 4590 },
    ],
  },
  "deshi-ghee": {
    variants: [
      { label: "500 g", price: 1050 },
      { label: "1 kg", price: 1990 },
    ],
  },
};

export const getProduct = (id: string) => products.find((p) => p.id === id);

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);

/** Stable pseudo-random stock number so pages render the same on server and client. */
const stockFor = (id: string) => 120 + ([...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7) % 4800);

export function getProductDetails(product: Product): ProductDetails {
  const category = getCategory(product.category)?.name ?? "Organic";
  const defaults: ProductDetails = {
    summary: `${product.name} — ১০০% প্রাকৃতিক ও অর্গানিক পণ্য। কোনো ক্ষতিকর কেমিক্যাল বা প্রিজারভেটিভ ছাড়াই সংগ্রহ ও প্যাকেট করা হয়েছে, যাতে আপনি পান খাঁটি মান ও পূর্ণ পুষ্টিগুণ।`,
    variants: [{ label: "Regular", price: product.price, oldPrice: product.oldPrice }],
    stock: stockFor(product.id),
    tags: [product.name.toLowerCase(), category.toLowerCase(), "organic"],
    brand: "Ultimate Organic Life",
    weight: "Standard pack",
    origin: "Bangladesh",
    description: [
      {
        heading: "প্রোডাক্ট পরিচিতি",
        lines: [
          `${product.name} সম্পূর্ণ প্রাকৃতিক উৎস থেকে সংগ্রহ করা একটি প্রিমিয়াম মানের পণ্য।`,
          "কোনো কৃত্রিম রং, ফ্লেভার বা প্রিজারভেটিভ ব্যবহার করা হয়নি।",
        ],
      },
      {
        heading: "মূল উপকারিতা (Key Benefits)",
        bullets: [
          "প্রাকৃতিক পুষ্টিগুণে ভরপুর",
          "দৈনন্দিন সুস্থ জীবনযাপনে সহায়ক",
          "পরিবারের সবার জন্য নিরাপদ",
        ],
      },
      {
        heading: "সতর্কতা (Precautions)",
        lines: ["ঠান্ডা ও শুকনো স্থানে সংরক্ষণ করুন।", "শিশুদের নাগালের বাইরে রাখুন।"],
      },
    ],
  };
  return { ...defaults, ...detailOverrides[product.id] };
}
