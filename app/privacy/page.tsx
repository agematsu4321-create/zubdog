import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

export default function PrivacyPage() {
    return (
        <main className="wood-bg min-h-screen text-[#E7D9BE]">
            <div className="mx-auto max-w-[1000px] px-6 py-16">
                <h1
                    className={`${notoSerif.className} mb-12 text-center text-3xl font-medium`}
                >
                    プライバシーポリシー
                </h1>

                <div className="space-y-12 leading-8">
                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            1. 取得する情報
                        </h2>

                        <p>
                            ZUBDOGでは、商品の購入、会員登録、お問い合わせ等の際に、
                            メールアドレス、氏名、電話番号、配送先住所、注文情報などを
                            取得する場合があります。
                        </p>
                    </section>

                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            2. 個人情報の利用目的
                        </h2>

                        <p>
                            取得した情報は、商品の発送、注文および決済の管理、
                            お問い合わせへの対応、購入履歴の表示、
                            不正利用の防止その他ECショップの運営に必要な目的で利用します。
                        </p>
                    </section>

                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            3. 決済について
                        </h2>

                        <p>
                            当ショップでは、決済処理にStripeを利用しています。
                            決済に必要な情報はStripeによって処理され、
                            当ショップではクレジットカード番号そのものを保存しません。
                        </p>
                    </section>

                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            4. 外部サービスについて
                        </h2>

                        <p>
                            当ショップでは、認証・データ管理等にSupabase、
                            決済処理にStripeなどの外部サービスを利用しています。
                            これらのサービスでは、それぞれのプライバシーポリシー等に基づき
                            情報が取り扱われる場合があります。
                        </p>
                    </section>

                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            5. 第三者への提供
                        </h2>

                        <p>
                            法令に基づく場合、または商品の配送・決済など
                            サービス提供に必要な場合を除き、
                            本人の同意なく個人情報を第三者に提供しません。
                        </p>
                    </section>

                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            6. 個人情報の管理
                        </h2>

                        <p>
                            個人情報への不正アクセス、紛失、漏えい等を防ぐため、
                            適切な安全管理に努めます。
                        </p>
                    </section>

                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            7. お問い合わせ
                        </h2>

                        <p>
                            個人情報の取り扱いに関するお問い合わせは、
                            ショップについてページに記載されている
                            お問い合わせ先までご連絡ください。
                        </p>
                    </section>

                    <section>
                        <h2 className={`${notoSerif.className} mb-4 text-xl`}>
                            8. プライバシーポリシーの変更
                        </h2>

                        <p>
                            必要に応じて本ポリシーを変更する場合があります。
                            変更後の内容は本ページに掲載した時点から適用します。
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}