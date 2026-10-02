"use client";

import {
    createContext,
    useState,
    type ReactNode,
    useContext,
    useCallback,
    useEffect,
} from "react";

export type RegularCartItem = {
    itemType?: "regular";
    lockId: string;
    name: string;
    price: number;
    slug: string;
    image: string;
};

export type CustomCartItem = {
    itemType: "custom";

    lockId: number;

    // カート内でオーダー商品を区別するためのID
    cartKey: string;

    name: string;
    price: number;
    image: string;

    customType: "bracelet" | "earring" | "piercing";

    patternId: number;
    patternNumber: number;

    stoneId: number;
    stoneName: string;

    basePrice: number;
    stonePrice: number;

    quantity: number;

    requestText: string;

    priceLockedAt: string;
    priceExpiresAt: string;
};

export type CartItem = RegularCartItem | CustomCartItem;

type CartContextType = {
    cartItems: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (index: number) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(
    undefined
);

export function CartProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        const savedCart = localStorage.getItem("zubdog-cart");

        if (savedCart) {
            setCart(JSON.parse(savedCart));
        }

        setHasLoaded(true);
    }, []);

    useEffect(() => {
        if (hasLoaded) {
            localStorage.setItem(
                "zubdog-cart",
                JSON.stringify(cart)
            );
        }
    }, [cart, hasLoaded]);

    const clearCart = useCallback(() => {
        setCart([]);
        localStorage.removeItem("zubdog-cart");
    }, []);

    function addToCart(item: CartItem) {
        setCart((currentCart) => {
            /*
              通常商品
              → slugが同じなら追加しない
            */
            if (item.itemType !== "custom") {
                const alreadyExists = currentCart.some(
                    (cartItem) =>
                        cartItem.itemType !== "custom" &&
                        cartItem.slug === item.slug
                );

                if (alreadyExists) {
                    return currentCart;
                }
            }

            /*
              オーダー商品
              → cartKeyがそれぞれ違うので
                別仕様として追加できる
            */
            return [...currentCart, item];
        });
    }

    function removeFromCart(index: number) {
        setCart((currentCart) =>
            currentCart.filter((_, i) => i !== index)
        );
    }

    return (
        <CartContext.Provider
            value={{
                cartItems: cart,
                addToCart,
                removeFromCart,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used within a CartProvider"
        );
    }

    return context;
}