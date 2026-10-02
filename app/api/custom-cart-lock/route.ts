import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const allowedTypes = [
    "bracelet",
    "earring",
    "piercing",
] as const;

type CustomType = (typeof allowedTypes)[number];

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "ログインが必要です" },
                { status: 401 }
            );
        }

        const body = await request.json();

        const {
            productType,
            patternId,
            stoneId,
            quantity,
            requestText,
        } = body;

        if (
            !allowedTypes.includes(productType as CustomType)
        ) {
            return NextResponse.json(
                { error: "商品タイプが正しくありません" },
                { status: 400 }
            );
        }

        if (
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 5
        ) {
            return NextResponse.json(
                { error: "数量は1〜5個までです" },
                { status: 400 }
            );
        }

        const { data: pattern, error: patternError } =
            await supabaseAdmin
                .from("order_patterns")
                .select(
                    "id, product_type, pattern_number, image_url, base_price, is_active"
                )
                .eq("id", patternId)
                .eq("product_type", productType)
                .single();

        if (
            patternError ||
            !pattern ||
            !pattern.is_active
        ) {
            return NextResponse.json(
                { error: "このPatternは現在注文できません" },
                { status: 400 }
            );
        }

        const { data: stone, error: stoneError } =
            await supabaseAdmin
                .from("stones")
                .select(
                    "id, name, bracelet_price, earring_price, piercing_price, is_active"
                )
                .eq("id", stoneId)
                .single();

        if (
            stoneError ||
            !stone ||
            !stone.is_active
        ) {
            return NextResponse.json(
                { error: "この天然石は現在選択できません" },
                { status: 400 }
            );
        }

        let stonePrice = 0;

        if (productType === "bracelet") {
            stonePrice = Number(stone.bracelet_price);
        } else if (productType === "earring") {
            stonePrice = Number(stone.earring_price);
        } else {
            stonePrice = Number(stone.piercing_price);
        }

        const basePrice = Number(pattern.base_price);
        const unitPrice = basePrice + stonePrice;

        const expiresAt = new Date();

        expiresAt.setDate(
            expiresAt.getDate() + 7
        );

        const { data: lock, error: lockError } =
            await supabaseAdmin
                .from("custom_cart_locks")
                .insert({
                    user_id: user.id,

                    product_type: productType,

                    pattern_id: pattern.id,
                    pattern_number: pattern.pattern_number,

                    stone_id: stone.id,
                    stone_name: stone.name,

                    image_url: pattern.image_url,

                    quantity,

                    request_text:
                        typeof requestText === "string"
                            ? requestText.trim()
                            : "",

                    base_price: basePrice,
                    stone_price: stonePrice,
                    unit_price: unitPrice,

                    expires_at: expiresAt.toISOString(),
                })
                .select(
                    `
          id,
          product_type,
          pattern_id,
          pattern_number,
          stone_id,
          stone_name,
          image_url,
          quantity,
          request_text,
          base_price,
          stone_price,
          unit_price,
          created_at,
          expires_at
        `
                )
                .single();

        if (lockError || !lock) {
            console.error(
                "CUSTOM CART LOCK ERROR:",
                lockError
            );

            return NextResponse.json(
                { error: "価格の保存に失敗しました" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            lock,
        });
    } catch (error) {
        console.error(
            "CUSTOM CART LOCK API ERROR:",
            error
        );

        return NextResponse.json(
            { error: "オーダーの保存に失敗しました" },
            { status: 500 }
        );
    }
}