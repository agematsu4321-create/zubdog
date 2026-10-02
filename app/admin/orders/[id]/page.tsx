import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

export default async function AdminOrderDetailPage({ params }: Props) {
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userEmail = user?.email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!user || !adminEmail || userEmail !== adminEmail) {
        redirect("/");
    }

    const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

    if (orderError || !order) {
        notFound();
    }

    const { data: items, error: itemsError } = await supabaseAdmin
        .from("orders_item")
        .select("*")
        .eq("order_id", id);

    if (itemsError) {
        console.error("ORDER ITEMS LOAD ERROR:", itemsError);
    }

    return (
        <main className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <Link
                    href="/admin/orders"
                    className="text-sm underline"
                >
                    ← 注文管理に戻る
                </Link>
            </div>

            <h1 className="mb-8 text-2xl font-bold">
                注文 #{order.id}
            </h1>

            <div className="space-y-8">
                <section className="border p-5">
                    <h2 className="mb-4 text-lg font-bold">
                        注文情報
                    </h2>

                    <p>
                        注文日時:{" "}
                        {new Date(order.created_at).toLocaleString("ja-JP")}
                    </p>

                    <p>
                        メール: {order.customer_email}
                    </p>

                    <p>
                        支払い状況: {order.status}
                    </p>

                    <p>
                        発送状況:{" "}
                        {order.fulfillment_status === "shipped"
                            ? "発送済み"
                            : "未発送"}
                    </p>

                    <p>
                        合計: ¥{Number(order.amount_total).toLocaleString()}
                    </p>
                </section>

                <section className="border p-5">
                    <h2 className="mb-4 text-lg font-bold">
                        配送先
                    </h2>

                    <p>
                        氏名: {order.shipping_name ?? "未登録"}
                    </p>

                    <p>
                        電話番号: {order.shipping_phone ?? "未登録"}
                    </p>

                    <p>
                        郵便番号: {order.shipping_postal_code ?? "未登録"}
                    </p>

                    <p>
                        都道府県: {order.shipping_prefecture ?? "未登録"}
                    </p>

                    <p>
                        市区町村: {order.shipping_city ?? "未登録"}
                    </p>
                </section>

                <section className="border p-5">
                    <h2 className="mb-4 text-lg font-bold">
                        購入商品
                    </h2>

                    {(items ?? []).map((item) => (
                        <div
                            key={item.id}
                            className="flex justify-between border-t py-3"
                        >
                            <span>{item.product_name}</span>

                            <span>
                                ¥{Number(item.price).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </section>
            </div>
        </main>
    );
}