import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Noto_Serif_JP } from "next/font/google";
import CustomOrderForm from "@/components/CustomOrderForm";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

type Props = {
    params: Promise<{
        type: string;
    }>;
};

const typeLabels: Record<string, string> = {
    bracelet: "ブレスレット",
    earring: "イヤリング",
    piercing: "ピアス",
};

export default async function CustomOrderPage({ params }: Props) {
    const { type } = await params;

    if (!["bracelet", "earring", "piercing"].includes(type)) {
        notFound();
    }

    const supabase = await createClient();

    const { data: patterns, error: patternError } = await supabase
        .from("order_patterns")
        .select("*")
        .eq("product_type", type)
        .order("pattern_number", { ascending: true });

    const { data: stones, error: stoneError } = await supabase
        .from("stones")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (patternError) {
        console.error("PATTERN ERROR:", patternError);
    }

    if (stoneError) {
        console.error("STONE ERROR:", stoneError);
    }

    const getStonePrice = (stone: any) => {
        if (type === "bracelet") {
            return stone.bracelet_price;
        }

        if (type === "earring") {
            return stone.earring_price;
        }

        return stone.piercing_price;
    };

    return (
        <main
            className={`${notoSerif.className} wood-bg min-h-screen text-[#E7D9BE]`}
        >
            <div className="mx-auto w-full max-w-[1100px] px-6 py-12">
                <Link
                    href="/order"
                    className="text-sm transition hover:opacity-50"
                >
                    ← オーダーメイドに戻る
                </Link>

                <div className="mt-10">
                    <p className="text-sm tracking-[0.3em]">
                        CUSTOM ORDER
                    </p>

                    <h1 className="mt-3 text-3xl font-medium">
                        {typeLabels[type]}
                    </h1>
                </div>

                {/* Pattern */}
                <CustomOrderForm
                    type={type}
                    patterns={patterns ?? []}
                    stones={stones ?? []}
                />
            </div>
        </main>
    );
}