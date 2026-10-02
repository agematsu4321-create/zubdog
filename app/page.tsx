import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default async function Home() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="p-8">
        商品を読み込めませんでした
      </main>
    );
  }

  const categories = [
    { key: "bracelet", label: "ブレスレット" },
    { key: "earring", label: "イヤリング" },
    { key: "piercing", label: "ピアス" },
  ];

  const featuredProduct = products?.[0];

  return (
    <main className="wood-bg min-h-screen text-[#E7D9BE]">

      {/* HERO */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-12 md:py-16">
        <div className="grid min-h-[430px] overflow-hidden bg-black md:grid-cols-2">

          {/* HERO TEXT */}
          <div className="flex flex-col justify-center px-8 py-12 md:px-14">
            <p className="mb-4 text-sm tracking-[0.25em] text-[#E7D9BE]/70">
              ZUBDOG
            </p>

            <h1
              className={`${notoSerif.className} text-3xl leading-relaxed md:text-5xl`}
            >
              天然石を、
              <br />
              日常のアクセサリーに。
            </h1>

            <p className="mt-6 max-w-md leading-8 text-[#E7D9BE]/75">
              天然石やビーズを使用した、
              一つひとつ表情の異なるアクセサリーをお届けします。
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#products"
                className="border border-[#E7D9BE] bg-[#E7D9BE] px-7 py-3 text-sm text-[#1F3A2E] transition hover:bg-transparent hover:text-[#E7D9BE]"
              >
                商品を見る
              </a>

              <Link
                href="/about"
                className="border border-[#E7D9BE]/60 px-7 py-3 text-sm transition hover:bg-[#E7D9BE] hover:text-[#1F3A2E]"
              >
                ショップについて
              </Link>
            </div>
          </div>

          {/* HERO IMAGE */}
          <div className="relative min-h-[350px] md:min-h-full">
            {featuredProduct?.image_url ? (
              <Image
                src={featuredProduct.image_url}
                alt={featuredProduct.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-zinc-800" />
            )}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-[900px] px-6 py-20 text-center">
        <p className="mb-5 text-xs tracking-[0.3em] text-[#E7D9BE]/60">
          ABOUT ZUBDOG
        </p>

        <h2
          className={`${notoSerif.className} text-2xl leading-relaxed md:text-3xl`}
        >
          石それぞれの表情を楽しむアクセサリー
        </h2>

        <p className="mx-auto mt-6 max-w-2xl leading-8 text-[#E7D9BE]/75">
          ブレスレット、イヤリング、ピアスを中心に、
          天然石やビーズを使用したアクセサリーを制作しています。
        </p>

        <Link
          href="/about"
          className="mt-8 inline-block text-sm underline underline-offset-8 transition-opacity hover:opacity-60"
        >
          ZUBDOGについて →
        </Link>
      </section>

      {/* CATEGORY LINKS */}
      <section className="mx-auto w-full max-w-[1000px] px-6 pb-20">
        <h2
          className={`${notoSerif.className} mb-10 text-center text-2xl font-medium`}
        >
          CATEGORY
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.key}
              href={`/category/${category.key}`}
              className="group flex min-h-[130px] items-center justify-between border border-[#E7D9BE]/40 bg-black/20 px-7 transition hover:bg-black/40"
            >
              <span className={`${notoSerif.className} text-xl`}>
                {category.label}
              </span>

              <span className="text-2xl transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <div
        id="products"
        className="mx-auto min-h-screen w-full max-w-[1200px] px-6 py-12"
      >
        <div className="mb-12 flex justify-center">
          <h2 className={`${notoSerif.className} text-2xl font-medium`}>
            商品一覧
          </h2>
        </div>

        <div className="space-y-16">
          {categories.map((category) => {
            const categoryProducts = (products ?? []).filter(
              (product) => product.category === category.key
            );

            if (categoryProducts.length === 0) {
              return null;
            }

            return (
              <section key={category.key}>
                <div className="mx-auto mb-8 flex max-w-[904px] items-center justify-between">
                  <h2
                    className={`${notoSerif.className} text-2xl font-medium`}
                  >
                    {category.label}
                  </h2>

                  <Link
                    href={`/category/${category.key}`}
                    className="flex h-10 w-10 items-center justify-center text-2xl transition-transform hover:translate-x-1"
                    aria-label={`${category.label}の商品一覧を見る`}
                  >
                    &gt;
                  </Link>
                </div>

                <div className="grid grid-cols-2 justify-center gap-6 sm:grid-cols-3 lg:grid-cols-4">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      name={product.name}
                      price={product.price}
                      slug={product.slug}
                      image={product.image_url}
                      soldOut={product.sold_out}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}