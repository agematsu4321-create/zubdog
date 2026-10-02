"use client";

import { useCart } from "@/context/cartContext";
import { CartItem } from "@/context/cartContext";
import { useState } from "react";

type AddToCartButtonProps = {
    product: CartItem;
};

export default function AddToCartButton({ product }: AddToCartButtonProps) {
    const { addToCart } = useCart();
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={() => addToCart(product)}
            className="add-cart-button w-full border border-black px-4 py-4"
        >
            カートに追加
        </button>
    );
}

