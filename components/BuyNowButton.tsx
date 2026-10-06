"use client";

import { useState } from "react";

type BuyNowButtonProps = {
    slug: string;
};

export default function BuyNowButton({
    slug,
}: BuyNowButtonProps) {
    const [loading, setLoading] = useState(false);

    async function handleBuyNow() {
        if (loading) return;

        try {
            setLoading(true);

            const response = await fetch("/api/checkout", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    slugs: [slug],
                    customLockIds: [],
                }),
            });

            const data = await response.json();

            // 未ログイン
            if (response.status === 401) {
                window.location.href =
                    `/login?next=${encodeURIComponent(
                        `/products/${slug}`
                    )}`;

                return;
            }

            // その他のエラー
            if (!response.ok) {
                alert(
                    data.error ||
                    "購入手続きを開始できませんでした"
                );

                return;
            }

            // Stripe Checkoutへ移動
            if (data.url) {
                window.location.href = data.url;
                return;
            }

            alert(
                "Stripeの決済ページを取得できませんでした"
            );
        } catch (error) {
            console.error(
                "Buy now error:",
                error
            );

            alert(
                "購入手続きを開始できませんでした"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleBuyNow}
            disabled={loading}
            className="w-full bg-cyan-400 px-4 py-4 text-lg text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading
                ? "購入ページを準備中..."
                : "購入する"}
        </button>
    );
}