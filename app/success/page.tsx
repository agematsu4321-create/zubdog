"use client";

import Link from "next/link";
import { useEffect,} from "react";
import { useCart } from "@/context/cartContext";

export default function SuccessPage() {
    const { clearCart } = useCart();


    useEffect(() => {
        clearCart();
    }, [clearCart]);

    return (
        <main className="flex min-h-[70vh] item-center justify-center p-6">
            <div className="max-w-md text-center">
                <h1 className="mb-8 text-3xl font-bold">
                    ご購入ありがとうございます
                </h1>
                <p className="mb-8 text-gray-600">
                    お支払いが完了しました
                </p>
                <Link
                    href="/"
                    className="inline-block bg-black px-6 py-3 text-white"
                >
                    商品一覧に戻る
                </Link>
            </div>
        </main>
    );
}
