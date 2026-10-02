import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";

const statusLabels: Record<string, string> = {
    paid: "支払い完了",
    production: "制作中",
    waiting_confirmation: "確認待ち",
    revision: "修正対応中",
    confirmed: "確認済み",
    shipped: "発送済み",
};

export default async function AdminCustomOrdersPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userEmail = user?.email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

    if (
        !user ||
        !adminEmail ||
        userEmail !== adminEmail
    ) {
        redirect("/");
    }

    /*
      1. custom_orders を取得
    */
    const {
        data: customOrdersData,
        error: customOrdersError,
    } = await supabaseAdmin
        .from("custom_orders")
        .select("*")
        .order("created_at", {
            ascending: false,
        });

    if (customOrdersError) {
        console.error(
            "CUSTOM ORDERS LOAD ERROR:",
            customOrdersError
        );

        return (
            <main className="p-8">
                オーダー注文を読み込めませんでした。
            </main>
        );
    }

    const customOrders = customOrdersData ?? [];

    /*
      まだオーダーがない場合
    */
    if (customOrders.length === 0) {
        return (
            <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
                <Link
                    href="/admin"
                    className="text-sm underline"
                >
                    ← 管理画面に戻る
                </Link>

                <h1 className="mt-6 text-2xl font-bold">
                    オーダー管理
                </h1>

                <p className="mt-8 text-gray-500">
                    オーダー注文はまだありません。
                </p>
            </main>
        );
    }

    /*
      2. 通常 orders の情報を取得
    */
    const orderIds = customOrders.map(
        (customOrder) => customOrder.order_id
    );

    const {
        data: ordersData,
        error: ordersError,
    } = await supabaseAdmin
        .from("orders")
        .select(
            "id, created_at, customer_email, amount_total"
        )
        .in("id", orderIds);

    /*
      3. custom_order_items を取得
    */
    const customOrderIds = customOrders.map(
        (customOrder) => customOrder.id
    );

    const {
        data: itemsData,
        error: itemsError,
    } = await supabaseAdmin
        .from("custom_order_items")
        .select("*")
        .in(
            "custom_order_id",
            customOrderIds
        );

    if (ordersError || itemsError) {
        console.error(
            "CUSTOM ORDER DATA ERROR:",
            {
                ordersError,
                itemsError,
            }
        );

        return (
            <main className="p-8">
                オーダー情報を読み込めませんでした。
            </main>
        );
    }

    /*
      4. データをまとめる
    */
    const orders = customOrders.map(
        (customOrder) => {
            const order = (ordersData ?? []).find(
                (order) =>
                    order.id === customOrder.order_id
            );

            const items = (itemsData ?? []).filter(
                (item) =>
                    item.custom_order_id ===
                    customOrder.id
            );

            return {
                ...customOrder,
                order,
                items,
            };
        }
    );

    return (
        <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
            <Link
                href="/admin"
                className="text-sm underline"
            >
                ← 管理画面に戻る
            </Link>

            <h1 className="mt-6 mb-8 text-2xl font-bold">
                オーダー管理
            </h1>

            <div className="space-y-5">
                {orders.map((customOrder) => (
                    <div
                        key={customOrder.id}
                        className="border p-5"
                    >
                        <div className="flex flex-col justify-between gap-4 sm:flex-row">
                            <div>
                                <p className="font-bold">
                                    オーダー #
                                    {customOrder.id}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    通常注文 #
                                    {customOrder.order_id}
                                </p>

                                <p className="mt-1 text-sm text-gray-500">
                                    {customOrder.order
                                        ?.created_at
                                        ? new Date(
                                            customOrder.order.created_at
                                        ).toLocaleString(
                                            "ja-JP"
                                        )
                                        : "日時不明"}
                                </p>
                            </div>

                            <div className="sm:text-right">
                                <p className="font-medium">
                                    {statusLabels[
                                        customOrder.status
                                    ] ??
                                        customOrder.status}
                                </p>

                                <p className="mt-1">
                                    ¥
                                    {Number(
                                        customOrder.order
                                            ?.amount_total ?? 0
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 border-t pt-4">
                            <p>
                                購入者：
                                {customOrder.order
                                    ?.customer_email ??
                                    "不明"}
                            </p>
                        </div>

                        <div className="mt-5">
                            <p className="mb-3 font-semibold">
                                オーダー内容
                            </p>

                            {customOrder.items.map(
                                (item: { id: Key | null | undefined; product_type: string; pattern_number: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; stone_name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; quantity: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; unit_price: any; request_text: any; }) => (
                                    <div
                                        key={item.id}
                                        className="border-t py-3"
                                    >
                                        <p className="font-medium">
                                            {item.product_type ===
                                                "bracelet"
                                                ? "ブレスレット"
                                                : item.product_type ===
                                                    "earring"
                                                    ? "イヤリング"
                                                    : "ピアス"}
                                        </p>

                                        <p className="mt-1 text-sm">
                                            Pattern{" "}
                                            {item.pattern_number}
                                        </p>

                                        <p className="mt-1 text-sm">
                                            天然石：
                                            {item.stone_name}
                                        </p>

                                        <p className="mt-1 text-sm">
                                            数量：
                                            {item.quantity}個
                                        </p>

                                        <p className="mt-1 text-sm">
                                            1個 ¥
                                            {Number(
                                                item.unit_price
                                            ).toLocaleString()}
                                        </p>

                                        <p className="mt-1 text-sm">
                                            ご要望：
                                            {item.request_text ||
                                                "なし"}
                                        </p>
                                    </div>
                                )
                            )}
                        </div>

                        <div className="mt-5">
                            <Link
                                href={`/admin/custom-orders/${customOrder.id}`}
                                className="inline-block border px-4 py-2"
                            >
                                詳細・制作管理
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}