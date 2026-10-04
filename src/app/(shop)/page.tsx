import { HeroSlider } from "@/components/HeroSlider";
import {
  DailyBestSells,
  FeatureStrip,
  NewsletterBanner,
  PopularProducts,
  ShopByCategories,
} from "@/components/HomeSections";
import { Reveal } from "@/components/Reveal";
import { container } from "@/lib/ui";
import { getCategories, getDailyBestProducts, getPopularProducts } from "@/server/queries";

export default async function Home() {
  const [categories, popular, dailyBest] = await Promise.all([
    getCategories(),
    getPopularProducts(),
    getDailyBestProducts(),
  ]);

  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <Reveal variant="zoom">
        <HeroSlider />
      </Reveal>
      <ShopByCategories categories={categories} />
      <PopularProducts products={popular} />
      {dailyBest.length > 0 && <DailyBestSells products={dailyBest} />}
      <NewsletterBanner />
      <FeatureStrip />
    </main>
  );
}
