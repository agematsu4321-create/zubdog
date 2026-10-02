import Link from "next/link";
import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

export default function AboutPage() {
    return (
        <main className="wood-bg min-h-screen text-[#E7D9BE]">
            <div className="mx-auto max-w-[1000px] px-6 py-16">

                <h1
                    className={`${notoSerif.className} mb-16 text-center text-3xl font-medium`}
                >
                    ショップについて
                </h1>

                {/* ABOUT */}
                <section className="mb-16">
                    <h2 className={`${notoSerif.className} mb-6 text-2xl`}>
                        ABOUT ZUBDOG
                    </h2>

                    <p className="max-w-2xl leading-8">
                        ZUBDOGは、天然石やビーズなどを使用した
                        アクセサリーを販売するオンラインショップです。
                    </p>
                </section>

                {/* CONTACT */}
                <section className="mb-16 border-t border-[#E7D9BE]/30 pt-10">
                    <h2 className={`${notoSerif.className} mb-6 text-2xl`}>
                        CONTACT
                    </h2>

                    <div className="space-y-4">

                        <p>
                            Instagram：
                            <a
                                href="https://www.instagram.com/chipee.0301/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4 hover:opacity-60"
                            >
                                @chipee

                            </a>
                            <span className="ml-2">

                            </span>
                        </p>

                        <p>
                            Email：
                            <a
                                href="mailto:ai.aloha86122@gmail.com"
                                className="ml-2 underline underline-offset-4 hover:opacity-60"
                            >
                                ai.aloha86122@gmail.com
                            </a>
                        </p>
                    </div>
                </section>

                {/* SHOPPING GUIDE */}
                <section className="mb-16 border-t border-[#E7D9BE]/30 pt-10">
                    <h2 className={`${notoSerif.className} mb-6 text-2xl`}>
                        SHOPPING GUIDE
                    </h2>

                    <div className="space-y-5 leading-7">
                        <div>
                            <h3 className="font-medium">お支払いについて</h3>
                            <p className="mt-1 text-[#E7D9BE]/80">
                                Stripeによるオンライン決済に対応しています。
                            </p>
                        </div>

                        <div>
                            <h3 className="font-medium">配送について</h3>
                            <p className="mt-1 text-[#E7D9BE]/80">
                                配送方法：クリックポスト
                                送料：全国一律185円
                                発送時期：ご注文・決済完了後3〜5営業日以内に発送
                                追跡：あり
                            </p>
                        </div>

                        <div>
                            <h3 className="font-medium">返品・キャンセルについて</h3>
                            <p className="mt-1 text-[#E7D9BE]/80">
                                返品・交換について

                                お客様都合による返品・交換は、原則として受け付けておりません。

                                商品に破損・不良がある場合、またはご注文と異なる商品が届いた場合は、
                                商品到着後7日以内にご連絡ください。

                                該当する場合の返品・交換にかかる送料は、当ショップが負担します。
                            </p>
                        </div>
                    </div>
                </section>

                {/* LEGAL */}
                <section className="border-t border-[#E7D9BE]/30 pt-10">
                    <h2 className={`${notoSerif.className} mb-6 text-2xl`}>
                        LEGAL
                    </h2>

                    <div className="flex flex-col gap-4">
                        <Link
                            href="/legal"
                            className="w-fit underline underline-offset-4 hover:opacity-60"
                        >
                            特定商取引法に基づく表記 →
                        </Link>

                        <Link
                            href="/privacy"
                            className="w-fit underline underline-offset-4 hover:opacity-60"
                        >
                            プライバシーポリシー →
                        </Link>
                    </div>
                </section>

            </div>
        </main>
    );
}