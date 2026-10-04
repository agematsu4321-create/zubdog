import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const slugs = Array.isArray(body.slugs)
      ? body.slugs
      : [];

    const customLockIds = Array.isArray(body.customLockIds)
      ? body.customLockIds
      : [];

    if (
      slugs.length === 0 &&
      customLockIds.length === 0
    ) {
      return NextResponse.json(
        { error: "カートが空です" },
        { status: 400 }
      );
    }

    const uniqueSlugs = [...new Set(slugs)];

    const uniqueCustomLockIds = [
      ...new Set(
        customLockIds.map((id: unknown) =>
          Number(id)
        )
      ),
    ].filter((id) => Number.isInteger(id));

    /*
      =====================================
      ログイン確認
      =====================================
    */

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 通常商品・オーダー商品どちらもログイン必須
    if (!user) {
      return NextResponse.json(
        {
          error:
            "購入にはログインが必要です",
        },
        { status: 401 }
      );
    }

    /*
      =====================================
      通常商品
      =====================================
    */

    let products: any[] = [];

    if (uniqueSlugs.length > 0) {
      const { data, error } =
        await supabaseAdmin
          .from("products")
          .select("*")
          .in("slug", uniqueSlugs)
          .eq("sold_out", false)
          .eq("is_active", true);

      if (error || !data) {
        return NextResponse.json(
          {
            error:
              "商品を取得できませんでした",
          },
          { status: 500 }
        );
      }

      if (
        data.length !== uniqueSlugs.length
      ) {
        return NextResponse.json(
          {
            error:
              "カート内の商品が売り切れたか、現在購入できません。",
          },
          { status: 409 }
        );
      }

      products = data;
    }

    /*
      =====================================
      オーダー商品
      =====================================
    */

    let customLocks: any[] = [];

    if (uniqueCustomLockIds.length > 0) {
      console.log("CHECKOUT DEBUG:", {
        customLockIds,
        uniqueCustomLockIds,
        userId: user.id,
      });

      const { data, error } =
        await supabaseAdmin
          .from("custom_cart_locks")
          .select("*")
          .in(
            "id",
            uniqueCustomLockIds
          )
          .eq("user_id", user.id)
          .is("used_at", null);

      console.log(
        "CUSTOM LOCK RESULT:",
        {
          data,
          error,
          requestedIds:
            uniqueCustomLockIds,
        }
      );

      if (error || !data) {
        console.error(
          "CUSTOM LOCK FETCH ERROR:",
          error
        );

        return NextResponse.json(
          {
            error:
              "オーダー商品の確認に失敗しました",
          },
          { status: 500 }
        );
      }

      if (
        data.length !==
        uniqueCustomLockIds.length
      ) {
        return NextResponse.json(
          {
            error:
              "オーダー商品の情報が無効です。もう一度オーダーしてください。",
          },
          { status: 409 }
        );
      }

      const expired = data.some(
        (lock) =>
          new Date(
            lock.expires_at
          ).getTime() <= Date.now()
      );

      if (expired) {
        return NextResponse.json(
          {
            error:
              "価格の有効期限が切れたオーダー商品があります。もう一度オーダーしてください。",
          },
          { status: 409 }
        );
      }

      customLocks = data;
    }

    /*
      =====================================
      通常商品の30分予約
      =====================================
    */

    let reservationId = "";

    if (products.length > 0) {
      reservationId =
        crypto.randomUUID();

      const productIds =
        products.map((product) =>
          Number(product.id)
        );

      const { error: reservationError } =
        await supabaseAdmin.rpc(
          "reserve_products",
          {
            p_product_ids:
              productIds,
            p_reservation_id:
              reservationId,
            p_minutes: 30,
          }
        );

      if (reservationError) {
        console.error(
          "Reservation error:",
          reservationError
        );

        return NextResponse.json(
          {
            error:
              "この商品は現在ほかのお客様が購入手続き中です",
          },
          { status: 409 }
        );
      }
    }

    /*
      =====================================
      Stripe 通常商品
      =====================================
    */

    const regularLineItems =
      products.map((product) => ({
        price_data: {
          currency: "jpy",

          product_data: {
            name: product.name,
          },

          unit_amount:
            Math.round(
              Number(product.price)
            ),
        },

        quantity: 1,
      }));

    /*
      =====================================
      Stripe オーダー商品
      =====================================
    */

    const customLineItems =
      customLocks.map((lock) => {
        const typeName =
          lock.product_type ===
            "bracelet"
            ? "オーダーブレスレット"
            : lock.product_type ===
              "earring"
              ? "オーダーイヤリング"
              : "オーダーピアス";

        return {
          price_data: {
            currency: "jpy",

            product_data: {
              name:
                `${typeName} / Pattern ${lock.pattern_number} / ${lock.stone_name}`,
            },

            unit_amount:
              Math.round(
                Number(
                  lock.unit_price
                )
              ),
          },

          quantity: Number(
            lock.quantity
          ),
        };
      });

    /*
      =====================================
      Stripe Checkout Session
      =====================================
    */

    const origin =
      new URL(request.url).origin;

    const session =
      await stripe.checkout.sessions.create(
        {
          mode: "payment",

          shipping_address_collection: {
            allowed_countries: [
              "JP",
            ],
          },

          phone_number_collection: {
            enabled: true,
          },

          expires_at:
            Math.floor(
              Date.now() / 1000
            ) +
            30 * 60,

          metadata: {
            product_ids:
              products
                .map(
                  (product) =>
                    product.id
                )
                .join(","),

            custom_lock_ids:
              customLocks
                .map(
                  (lock) =>
                    lock.id
                )
                .join(","),

            reservation_id:
              reservationId,

            // ログイン済みユーザーIDを必ず保存
            user_id: user.id,
          },

          line_items: [
            ...regularLineItems,
            ...customLineItems,
          ],

          success_url:
            `${origin}/success`,

          cancel_url:
            `${origin}/cart`,
        }
      );

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error(
      "CHECKOUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Checkoutの作成に失敗しました",
      },
      { status: 500 }
    );
  }
}