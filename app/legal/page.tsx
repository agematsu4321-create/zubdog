import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

export default function LegalPage() {
    const rows = [
        ["販売業者", "上松 樹"],
        ["運営責任者", "上松 樹"],
        ["所在地", "請求があった場合、遅滞なく開示いたします。"],
        ["電話番号", "請求があった場合、遅滞なく開示いたします。"],
        ["メールアドレス", "ai.aloha86122@gmail.com"],

        ["販売価格", "各商品ページに表示された価格（税込）"],

        [
            "商品代金以外の必要料金",
            "送料：全国一律185円（クリックポスト）",
        ],

        [
            "支払方法",
            "クレジットカード決済（Stripe）",
        ],

        [
            "支払時期",
            "ご注文確定時に決済されます。",
        ],

        [
            "商品の引渡時期",
            "ご注文・決済完了後、3〜5営業日以内に発送いたします。",
        ],

        [
            "配送方法",
            "日本郵便 クリックポスト（追跡あり・郵便受けへの配達）",
        ],

        [
            "返品・交換",
            "お客様都合による返品・交換は、原則として受け付けておりません。商品に破損・不良がある場合、またはご注文と異なる商品が届いた場合は、商品到着後7日以内にご連絡ください。該当する場合の返品・交換にかかる送料は当ショップが負担します。",
        ],

        [
            "キャンセル",
            "ご注文確定後のキャンセルは原則として受け付けておりません。ただし、発送前で対応可能な場合に限り、お問い合わせ内容を確認のうえ対応する場合があります。",
        ],
    ];

    return (
        <main className="wood-bg min-h-screen text-[#E7D9BE]">
            <div className="mx-auto max-w-[1000px] px-6 py-16">
                <h1
                    className={`${notoSerif.className} mb-12 text-center text-3xl font-medium`}
                >
                    特定商取引法に基づく表記
                </h1>

                <div className="overflow-hidden border border-[#E7D9BE]/30">
                    {rows.map(([label, value]) => (
                        <div
                            key={label}
                            className="grid border-b border-[#E7D9BE]/20 last:border-b-0 md:grid-cols-[220px_1fr]"
                        >
                            <div className="bg-black/20 px-5 py-4 font-medium">
                                {label}
                            </div>

                            <div className="px-5 py-4 leading-7">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                <p className="mt-8 text-sm text-[#E7D9BE]/70">
                    ※ 販売開始前に、実際の販売条件に合わせて内容を確認・更新してください。
                </p>
            </div>
        </main>
    );
}