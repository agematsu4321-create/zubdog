import Link from "next/link";
import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

const orderTypes = [
    {
        type: "bracelet",
        label: "ブレスレット",
        description: "15cm固定 / お好きな天然石を1種類お選びいただけます。",
    },
    {
        type: "earring",
        label: "イヤリング",
        description: "両耳1セット / 天然石を1種類お選びいただけます。",
    },
    {
        type: "piercing",
        label: "ピアス",
        description:
            "両耳1セット / 医療用サージカルステンレス / 天然石を1種類お選びいただけます。",
    },
];

export default function OrderPage() {
    return (
        <main
            className={`${notoSerif.className} wood-bg min-h-screen text-[#E7D9BE]`}
        >
            <div className="mx-auto w-full max-w-[1100px] px-6 py-16">
                <div className="text-center">
                    <p className="text-sm tracking-[0.3em]">CUSTOM ORDER</p>

                    <h1 className="mt-4 text-3xl font-medium md:text-4xl">
                        オーダーメイド
                    </h1>

                    <p className="mx-auto mt-6 max-w-2xl leading-8 text-[#E7D9BE]/80">
                        お好きなデザインと天然石を選んで、
                        あなただけのアクセサリーをお作りします。
                    </p>
                </div>

                <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {orderTypes.map((item) => (
                        <Link
                            key={item.type}
                            href={`/order/${item.type}`}
                            className="group border border-[#E7D9BE]/30 bg-black p-8 transition hover:-translate-y-1"
                        >
                            <p className="text-sm tracking-widest text-[#E7D9BE]/60">
                                CUSTOM
                            </p>

                            <h2 className="mt-4 text-2xl">{item.label}</h2>

                            <p className="mt-5 min-h-[80px] text-sm leading-7 text-[#E7D9BE]/70">
                                {item.description}
                            </p>

                            <p className="mt-8 text-sm transition group-hover:translate-x-1">
                                オーダーする →
                            </p>
                        </Link>
                    ))}
                </div>

                <div className="mt-16 border-t border-[#E7D9BE]/20 pt-8 text-sm leading-7 text-[#E7D9BE]/70">
                    <p>・制作期間は通常約1週間です。</p>
                    <p>・数量や注文状況により前後する場合があります。</p>
                    <p>・天然石の色・模様・形には個体差があります。</p>
                    <p>・オーダー商品はログイン後にご注文いただけます。</p>
                </div>
            </div>
        </main>
    );
}