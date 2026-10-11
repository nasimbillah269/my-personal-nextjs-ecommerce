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
import { getActiveSliders, getCategories, getDailyBestProducts, getPopularProducts } from "@/server/queries";

export default async function Home() {
  const [sliders, categories, popular, dailyBest] = await Promise.all([
    getActiveSliders(),
    getCategories(),
    getPopularProducts(),
    getDailyBestProducts(),
  ]);

  return (
    <main className={`${container} flex-1 pt-4 lg:pt-6`}>
      <Reveal variant="zoom">
        <HeroSlider images={sliders} />
      </Reveal>
      <ShopByCategories categories={categories} />
      <PopularProducts products={popular} />
      {dailyBest.length > 0 && <DailyBestSells products={dailyBest} />}
      <NewsletterBanner />
      <FeatureStrip />
    </main>
  );
}
