"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart, type CustomCartItem } from "@/context/cartContext";
import { useRouter } from "next/navigation";

type Pattern = {
    id: number;
    pattern_number: number;
    image_url: string;
    base_price: number;
    is_active: boolean;
};

type Stone = {
    id: number;
    name: string;
    image_url: string;
    bracelet_price: number;
    earring_price: number;
    piercing_price: number;
    is_popular: boolean;
};

type Props = {
    type: string;
    patterns: Pattern[];
    stones: Stone[];
};

export default function CustomOrderForm({
    type,
    patterns,
    stones,
}: Props) {
    const { addToCart } = useCart();
    const router = useRouter();

    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedPattern, setSelectedPattern] =
        useState<Pattern | null>(null);

    const [selectedStone, setSelectedStone] =
        useState<Stone | null>(null);

    const [quantity, setQuantity] = useState(1);
    const [requestText, setRequestText] = useState("");

    const getStonePrice = (stone: Stone) => {
        if (type === "bracelet") return stone.bracelet_price;
        if (type === "earring") return stone.earring_price;

        return stone.piercing_price;
    };

    const unitPrice =
        selectedPattern && selectedStone
            ? Number(selectedPattern.base_price) +
            Number(getStonePrice(selectedStone))
            : 0;
    const [showAllStones, setShowAllStones] = useState(false);
    const popularStones = stones.filter((stone) => stone.is_popular);

    const displayedStones =
        showAllStones || popularStones.length === 0
            ? stones
            : popularStones;
    const sortedStones = [...displayedStones].sort((a, b) => {
        if (stoneSort === "price-asc") {
            return getStonePrice(a) - getStonePrice(b);
        }

        if (stoneSort === "price-desc") {
            return getStonePrice(b) - getStonePrice(a);
        }

        if (a.is_popular !== b.is_popular) {
            return Number(b.is_popular) - Number(a.is_popular);
        }

        return 0;
    });
    const totalPrice = unitPrice * quantity;
    const [stoneSort, setStoneSort] = useState<
        "popular" | "price-asc" | "price-desc"
    >("popular");
    async function handleAddToCart() {
        if (!selectedPattern || !selectedStone) {
            return;
        }

        try {
            const response = await fetch("/api/custom-cart-lock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    productType: type,
                    patternId: selectedPattern.id,
                    stoneId: selectedStone.id,
                    quantity,
                    requestText,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    alert("オーダー商品の購入にはログインが必要です。");
                    router.push("/login");
                    return;
                }

                alert(data.error || "カートへの追加に失敗しました");
                return;
            }

            const lock = data.lock;

            const customItem: CustomCartItem = {
                itemType: "custom",

                cartKey: `custom-${lock.id}`,

                name: type === "bracelet"
                    ? "オーダーブレスレット"
                    : type === "earring"
                        ? "オーダーイヤリング"
                        : "オーダーピアス",

                price: Number(lock.unit_price),
                image: lock.image_url,

                customType: lock.product_type,

                patternId: lock.pattern_id,
                patternNumber: lock.pattern_number,

                stoneId: lock.stone_id,
                stoneName: lock.stone_name,

                basePrice: Number(lock.base_price),
                stonePrice: Number(lock.stone_price),

                quantity: lock.quantity,

                requestText: lock.request_text ?? "",

                priceLockedAt: lock.created_at,
                priceExpiresAt: lock.expires_at,
                lockId: Number(lock.id),
            };

            addToCart(customItem);

            router.push("/cart");
        } catch (error) {
            console.error(error);
            alert("カートへの追加に失敗しました");
        }
    }

    return (
        <>
            {/* Pattern */}
            <section className="mt-14">
                <h2 className="text-2xl">1. デザインを選ぶ</h2>

                <div className="mt-6 grid grid-cols-2 gap-5 md:grid-cols-4">
                    {patterns.map((pattern) => (
                        <button
                            key={pattern.id}
                            type="button"
                            disabled={!pattern.is_active}
                            onClick={() => setSelectedPattern(pattern)}
                            className={`border bg-black p-3 text-left transition ${selectedPattern?.id === pattern.id
                                ? "border-[#E7D9BE]"
                                : "border-[#E7D9BE]/20"
                                } ${!pattern.is_active
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:border-[#E7D9BE]/70"
                                }`}
                        >
                            <div className="relative aspect-square overflow-hidden">
                                <Image
                                    src={pattern.image_url}
                                    alt={`Pattern ${pattern.pattern_number}`}
                                    fill
                                    sizes="250px"
                                    className="object-cover"
                                />
                            </div>

                            <p className="mt-4">
                                Pattern {pattern.pattern_number}
                            </p>

                            <p className="mt-2 text-sm text-[#E7D9BE]/70">
                                ¥{Number(pattern.base_price).toLocaleString()}（税込）
                            </p>

                            {!pattern.is_active && (
                                <p className="mt-2 text-sm text-red-300">
                                    現在受付停止
                                </p>
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* Stone */}
            <section className="mt-16">
                <h2 className="text-2xl">2. 天然石を選ぶ</h2>

                <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
                    {sortedStones.map((stone) => {
                        const stonePrice = getStonePrice(stone);

                        return (
                            <button
                                key={stone.id}
                                type="button"
                                onClick={() => setSelectedStone(stone)}
                                className={`border bg-black p-3 text-left transition ${selectedStone?.id === stone.id
                                    ? "border-[#E7D9BE]"
                                    : "border-[#E7D9BE]/20"
                                    }`}
                            >
                                <div className="relative aspect-square overflow-hidden">
                                    <Image
                                        src={stone.image_url}
                                        alt={stone.name}
                                        fill
                                        sizes="250px"
                                        className="object-cover"
                                    />
                                </div>

                                <p className="mt-4">{stone.name}</p>

                                <p className="mt-2 text-sm text-[#E7D9BE]/70">
                                    +¥{Number(stonePrice).toLocaleString()}
                                </p>

                                {stone.is_popular && (
                                    <p className="mt-2 text-xs tracking-widest">
                                        POPULAR
                                    </p>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-6 flex justify-end">
                    <select
                        value={stoneSort}
                        onChange={(e) =>
                            setStoneSort(
                                e.target.value as "popular" | "price-asc" | "price-desc"
                            )
                        }
                        className="bg-white px-4 py-2 text-sm text-black"
                    >
                        <option value="popular">人気順</option>
                        <option value="price-asc">価格が安い順</option>
                        <option value="price-desc">価格が高い順</option>
                    </select>
                </div>
                {popularStones.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setShowAllStones((prev) => !prev)}
                        className="mt-6 border border-[#E7D9BE]/40 px-5 py-3 text-sm transition hover:bg-[#E7D9BE] hover:text-black"
                    >
                        {showAllStones ? "人気の石だけ見る" : "すべての石を見る"}
                    </button>
                )}
            </section>

            {/* Quantity */}
            <section className="mt-16">
                <h2 className="text-2xl">3. 数量</h2>

                <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-6 bg-white px-5 py-3 text-black"
                >
                    {[1, 2, 3, 4, 5].map((number) => (
                        <option key={number} value={number}>
                            {number}個
                        </option>
                    ))}
                </select>
            </section>

            {/* Request */}
            <section className="mt-16">
                <h2 className="text-2xl">4. ご希望・ご要望</h2>

                <p className="mt-2 text-sm text-[#E7D9BE]/60">
                    任意
                </p>

                <textarea
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    rows={5}
                    placeholder="デザインについてご希望があればご記入ください"
                    className="mt-6 w-full max-w-2xl bg-white p-4 text-black"
                />
            </section>

            {/* Price */}
            <section className="mt-16 border-t border-[#E7D9BE]/20 pt-8">
                {selectedPattern && selectedStone ? (
                    <>
                        <p>
                            Pattern {selectedPattern.pattern_number}：¥
                            {Number(selectedPattern.base_price).toLocaleString()}
                        </p>

                        <p className="mt-2">
                            {selectedStone.name}：+¥
                            {Number(getStonePrice(selectedStone)).toLocaleString()}
                        </p>

                        <p className="mt-2">
                            数量：{quantity}個
                        </p>

                        <p className="mt-6 text-2xl">
                            合計 ¥{totalPrice.toLocaleString()}（税込）
                        </p>
                    </>
                ) : (
                    <p className="text-[#E7D9BE]/60">
                        デザインと天然石を選択してください。
                    </p>
                )}
            </section>

            {/* Final confirmation */}
            {selectedPattern && selectedStone && (
                <section className="mt-10">
                    {!showConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowConfirm(true)}
                            className="w-full max-w-2xl bg-[#E7D9BE] px-6 py-4 text-black transition hover:opacity-80"
                        >
                            最終確認へ
                        </button>
                    ) : (
                        <div className="max-w-2xl border border-[#E7D9BE]/30 bg-black p-6">
                            <p className="text-sm tracking-[0.2em] text-[#E7D9BE]/60">
                                ORDER CONFIRMATION
                            </p>

                            <h2 className="mt-3 text-2xl">
                                オーダー内容の最終確認
                            </h2>

                            <div className="mt-8 space-y-3 text-sm">
                                <p>
                                    商品：
                                    {type === "bracelet"
                                        ? "ブレスレット"
                                        : type === "earring"
                                            ? "イヤリング"
                                            : "ピアス"}
                                </p>

                                <p>
                                    Pattern：{selectedPattern.pattern_number}
                                </p>

                                <p>
                                    天然石：{selectedStone.name}
                                </p>

                                <p>
                                    数量：{quantity}個
                                </p>

                                <p>
                                    ご要望：
                                    {requestText.trim()
                                        ? requestText
                                        : "なし"}
                                </p>
                            </div>

                            <div className="mt-8 border-t border-[#E7D9BE]/20 pt-6">
                                <p>
                                    1個 ¥{unitPrice.toLocaleString()}（税込）
                                </p>

                                <p className="mt-3 text-2xl">
                                    合計 ¥{totalPrice.toLocaleString()}（税込）
                                </p>
                            </div>

                            <div className="mt-8 space-y-2 text-sm text-[#E7D9BE]/70">
                                <p>・支払い後のキャンセルはできません。</p>
                                <p>・支払い後の石の変更はできません。</p>
                                <p>・天然石には色・模様・形に個体差があります。</p>
                                <p>・カートに入れた価格は7日間有効です。</p>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(false)}
                                    className="border border-[#E7D9BE]/40 px-6 py-4"
                                >
                                    戻って変更する
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    className="bg-[#E7D9BE] px-6 py-4 text-black"
                                >
                                    この内容でカートに追加
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </>
    );
}