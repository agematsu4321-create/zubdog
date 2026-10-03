import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Stripe signatureがありません" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature error:", error);

    return NextResponse.json(
      { error: "Webhookの確認に失敗しました" },
      { status: 400 }
    );
  }

  /*
    =====================================
    決済成功
    =====================================
  */
  if (event.type === "checkout.session.completed") {
    const session =
      event.data.object as Stripe.Checkout.Session;

    console.log("WEBHOOK METADATA:", session.metadata);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const shipping =
      session.collected_information?.shipping_details;

    const address = shipping?.address;

    /*
      1. orders
    */
    const { data: order, error: orderError } =
      await supabaseAdmin
        .from("orders")
        .upsert(
          {
            stripe_session_id: session.id,
            user_id:
              session.metadata?.user_id || null,

            customer_email:
              session.customer_details?.email ?? null,

            amount_total:
              session.amount_total ?? 0,

            currency:
              session.currency ?? "jpy",

            status:
              session.payment_status,

            shipping_name:
              shipping?.name ?? null,

            shipping_phone:
              session.customer_details?.phone ?? null,

            shipping_postal_code:
              address?.postal_code ?? null,

            shipping_prefecture:
              address?.state ?? null,

            shipping_city:
              address?.city ?? null,

            shipping_line1:
              address?.line1 ?? null,

            shipping_line2:
              address?.line2 ?? null,

            shipping_country:
              address?.country ?? null,
          },
          {
            onConflict: "stripe_session_id",
          }
        )
        .select("id")
        .single();

    if (orderError || !order) {
      console.error("ORDER SAVE ERROR:", orderError);

      return NextResponse.json(
        { error: "注文の保存に失敗しました" },
        { status: 500 }
      );
    }

    /*
      =====================================
      2. 通常商品
      =====================================
    */

    const productIds =
      session.metadata?.product_ids
        ?.split(",")
        .filter(Boolean) ?? [];

    if (productIds.length > 0) {
      /*
        Webhook再送による二重登録防止
      */
      const {
        data: existingItems,
        error: existingItemsError,
      } = await supabaseAdmin
        .from("orders_item")
        .select("id")
        .eq("order_id", order.id);

      if (existingItemsError) {
        console.error(
          "ORDER ITEM CHECK ERROR:",
          existingItemsError
        );

        return NextResponse.json(
          { error: "注文商品の確認に失敗しました" },
          { status: 500 }
        );
      }

      if (!existingItems || existingItems.length === 0) {
        const {
          data: purchasedProducts,
          error: productsError,
        } = await supabaseAdmin
          .from("products")
          .select("id, name, price")
          .in("id", productIds);

        if (productsError || !purchasedProducts) {
          console.error(
            "PRODUCT FETCH ERROR:",
            productsError
          );

          return NextResponse.json(
            { error: "購入商品の取得に失敗しました" },
            { status: 500 }
          );
        }

        const orderItems = purchasedProducts.map(
          (product) => ({
            order_id: order.id,
            product_id: product.id,
            product_name: product.name,
            price: Number(product.price),
          })
        );

        const { error: itemError } =
          await supabaseAdmin
            .from("orders_item")
            .upsert(orderItems, {
              onConflict: "order_id,product_id",
              ignoreDuplicates: true,
            });

        if (itemError) {
          console.error(
            "ORDER ITEM SAVE ERROR:",
            itemError
          );

          return NextResponse.json(
            { error: "注文商品の保存に失敗しました" },
            { status: 500 }
          );
        }
      }

      /*
        購入された通常商品をSOLD OUT
      */
      const { error: soldOutError } =
        await supabaseAdmin
          .from("products")
          .update({
            sold_out: true,
            reserved_by: null,
            reserved_until: null,
          })
          .in("id", productIds);

      if (soldOutError) {
        console.error(
          "SOLD OUT UPDATE ERROR:",
          soldOutError
        );

        return NextResponse.json(
          { error: "商品の更新に失敗しました" },
          { status: 500 }
        );
      }
    }

    /*
      =====================================
      3. オーダー商品
      =====================================
    */

    const customLockIds =
      session.metadata?.custom_lock_ids
        ?.split(",")
        .filter(Boolean)
        .map(Number) ?? [];

    console.log(
      "WEBHOOK CUSTOM LOCK IDS:",
      customLockIds
    );

    if (customLockIds.length > 0) {
      const {
        data: customLocks,
        error: customLocksError,
      } = await supabaseAdmin
        .from("custom_cart_locks")
        .select("*")
        .in("id", customLockIds);

      if (
        customLocksError ||
        !customLocks ||
        customLocks.length !== customLockIds.length
      ) {
        console.error(
          "CUSTOM LOCK FETCH ERROR:",
          customLocksError
        );

        return NextResponse.json(
          {
            error:
              "オーダー商品の取得に失敗しました",
          },
          { status: 500 }
        );
      }

      /*
        custom_orders 二重作成防止
      */
      const { error: customOrderUpsertError } =
        await supabaseAdmin
          .from("custom_orders")
          .upsert(
            {
              order_id: order.id,
              status: "paid",
            },
            {
              onConflict: "order_id",
              ignoreDuplicates: true,
            }
          );

      if (customOrderUpsertError) {
        console.error(
          "CUSTOM ORDER UPSERT ERROR:",
          customOrderUpsertError
        );

        return NextResponse.json(
          {
            error: "オーダー注文の保存に失敗しました",
          },
          { status: 500 }
        );
      }

      const {
        data: customOrder,
        error: customOrderFetchError,
      } = await supabaseAdmin
        .from("custom_orders")
        .select("id")
        .eq("order_id", order.id)
        .single();

      if (customOrderFetchError || !customOrder) {
        console.error(
          "CUSTOM ORDER FETCH ERROR:",
          customOrderFetchError
        );

        return NextResponse.json(
          {
            error: "オーダー注文の取得に失敗しました",
          },
          { status: 500 }
        );
      }

      const customOrderId = customOrder.id;

      /*
        custom_order_items 二重登録防止
      */
      const {
        data: existingCustomItems,
        error: customItemCheckError,
      } = await supabaseAdmin
        .from("custom_order_items")
        .select("id")
        .eq(
          "custom_order_id",
          customOrderId
        );

      if (customItemCheckError) {
        console.error(
          "CUSTOM ITEM CHECK ERROR:",
          customItemCheckError
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
        !existingCustomItems ||
        existingCustomItems.length === 0
      ) {
        const customItems = customLocks.map(
          (lock) => ({
            custom_order_id:
              customOrderId,
            custom_cart_lock_id: lock.id,

            product_type:
              lock.product_type,

            pattern_id:
              lock.pattern_id,

            pattern_number:
              lock.pattern_number,

            stone_id:
              lock.stone_id,

            stone_name:
              lock.stone_name,

            quantity:
              lock.quantity,

            request_text:
              lock.request_text || null,

            base_price:
              Number(lock.base_price),

            stone_price:
              Number(lock.stone_price),

            unit_price:
              Number(lock.unit_price),

            confirmation_status:
              "pending",
          })
        );

        const { error: customItemError } =
          await supabaseAdmin
            .from("custom_order_items")
            .upsert(customItems, {
              onConflict: "custom_cart_lock_id",
              ignoreDuplicates: true,
            });

        if (customItemError) {
          console.error(
            "CUSTOM ITEM SAVE ERROR:",
            customItemError
          );

          return NextResponse.json(
            {
              error:
                "オーダー商品の保存に失敗しました",
            },
            { status: 500 }
          );
        }
      }

      /*
        価格ロックを使用済みにする
      */
      const { error: usedError } =
        await supabaseAdmin
          .from("custom_cart_locks")
          .update({
            used_at: new Date().toISOString(),
          })
          .in("id", customLockIds);

      if (usedError) {
        console.error(
          "CUSTOM LOCK USED ERROR:",
          usedError
        );
      }
    }
  }

  /*
    =====================================
    Checkout 30分期限切れ
    =====================================
  */
  if (event.type === "checkout.session.expired") {
    const session =
      event.data.object as Stripe.Checkout.Session;

    const productIds =
      session.metadata?.product_ids
        ?.split(",")
        .filter(Boolean) ?? [];

    const reservationId =
      session.metadata?.reservation_id;

    if (
      productIds.length > 0 &&
      reservationId
    ) {
      const { error } =
        await supabaseAdmin
          .from("products")
          .update({
            sold_out: false,
            reserved_by: null,
            reserved_until: null,
          })
          .in("id", productIds)
          .eq(
            "reserved_by",
            reservationId
          );

      if (error) {
        console.error(
          "RESERVATION RELEASE ERROR:",
          error
        );

        return NextResponse.json(
          { error: "予約解除に失敗しました" },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({
    received: true,
  });
}