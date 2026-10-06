import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

type Props = {
    params: Promise<{
        category: string;
    }>;
};

const categories = {
    bracelet: {
        jp: "ブレスレット",
        en: "Bracelet",
    },
    earring: {
        jp: "イヤリング",
        en: "Earring",
    },
    piercing: {
        jp: "ピアス",
        en: "Piercing",
    },
};

export default async function CategoryPage({
    params,
}: Props) {
    const { category } = await params;

    const categoryInfo =
        categories[
        category as keyof typeof categories
        ];

    if (!categoryInfo) {
        notFound();
    }

    const supabase = await createClient();

    const { data: products, error } =
        await supabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .eq("category", category)
            .order("created_at", {
                ascending: false,
            });

    if (error) {
        return (
            <main className="p-8">
                商品を読み込めませんでした
            </main>
        );
    }

    return (
        <main
            className={`${notoSerif.className} wood-bg min-h-screen text-[#E7D9BE]`}
        >
            <div className="mx-auto w-full max-w-[1200px] px-2 py-6 md:px-6 md:py-12">
                <Link
                    href="/#products"
                    className="mb-6 inline-block text-xs text-[#E7D9BE] transition-opacity hover:opacity-60 md:mb-10 md:text-sm"
                >
                    ← 商品一覧に戻る
                </Link>

                {/* MOBILE */}
                <h1 className="mb-2 text-left text-xs font-medium tracking-[0.15em] md:hidden">
                    {categoryInfo.en}
                </h1>

                {/* PC */}
                <h1 className="mb-12 hidden text-center text-3xl font-medium md:block">
                    {categoryInfo.jp}
                </h1>

                <div className="mx-auto grid w-full grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-6 lg:max-w-[904px] lg:grid-cols-4">
                    {(products ?? []).map(
                        (product) => (
                            <ProductCard
                                key={product.id}
                                name={product.name}
                                price={product.price}
                                slug={product.slug}
                                image={product.image_url}
                                soldOut={
                                    product.sold_out
                                }
                            />
                        )
                    )}
                </div>
            </div>
        </main>
    );
}