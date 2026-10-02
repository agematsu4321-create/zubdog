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
    bracelet: "ブレスレット",
    earring: "イヤリング",
    piercing: "ピアス",
};

export default async function CategoryPage({ params }: Props) {
    const { category } = await params;

    const categoryLabel =
        categories[category as keyof typeof categories];

    if (!categoryLabel) {
        notFound();
    }

    const supabase = await createClient();

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .eq("category", category)
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <main className="p-8">
                商品を読み込めませんでした
            </main>
        );
    }

    return (
        <main className={`${notoSerif.className} wood-bg min-h-screen text-[#E7D9BE]`}>
            <div className="mx-auto w-full max-w-[1200px] px-6 py-12">
                <Link
                    href="/#products"
                    className="mb-10 inline-block text-sm text-[#E7D9BE] transition-opacity hover:opacity-60"
                >
                    ← 商品一覧に戻る
                </Link>

                <h1 className="mb-12 text-center text-3xl font-medium">
                    {categoryLabel}
                </h1>

                <div className="mx-auto grid w-full max-w-[904px] grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
                    {(products ?? []).map((product) => (
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
            </div>
        </main>
    );
}