import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function AdminOrdersPage() {
    const supabase = await createClient();
    async function updateFulfillmentStatus(formData: FormData) {
        "use server";

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const userEmail = user?.email?.trim().toLowerCase();
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

        if (!user || !adminEmail || userEmail !== adminEmail) {
            redirect("/");
        }

        const orderId = Number(formData.get("order_id"));
        const nextStatus = String(formData.get("next_status"));

        const { error } = await supabaseAdmin
            .from("orders")
            .update({
                fulfillment_status: nextStatus,
            })
            .eq("id", orderId);

        if (error) {
            console.error("FULFILLMENT UPDATE ERROR:", error);
            return;
        }

        revalidatePath("/admin/orders");
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userEmail = user?.email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!user || !adminEmail || userEmail !== adminEmail) {
        redirect("/");
    }

    const { data: ordersData, error: ordersError } = await supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    const { data: itemsData, error: itemsError } = await supabaseAdmin
        .from("orders_item")
        .select("*");

    if (ordersError || itemsError) {
        console.error("ORDER LOAD ERROR:", {
            ordersError,
            itemsError,
        });

        return (
            <main className="p-8">
                注文を読み込めませんでした。
            </main>
        );
    }

    const orders = (ordersData ?? []).map((order) => ({
        ...order,

        orders_item: (itemsData ?? []).filter(
            (item) => item.order_id === order.id
        ),
    }));

    return (
        <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
            <h1 className="mb-8 text-2xl font-bold">
                注文管理
            </h1>

            <div className="space-y-5">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="border p-5"
                    >
                        <div className="mb-4 flex justify-between">
                            <div>
                                <p className="font-bold">
                                    注文 #{order.id}
                                </p>

                                <p className="text-sm text-gray-500">
                                    {new Date(order.created_at).toLocaleString("ja-JP")}
                                </p>
                            </div>

                            <div className="text-right">
                                <p>
                                    ¥{Number(order.amount_total).toLocaleString()}
                                </p>

                                <p className="text-sm">
                                    {order.status}
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p>
                                購入者: {order.customer_email}
                            </p>

                            <p>
                                配送先: {order.shipping_name ?? "未登録"}
                            </p>
                        </div>

                        <div>
                            <p className="mb-2 font-semibold">
                                購入商品
                            </p>

                            {order.orders_item?.length ? (
                                order.orders_item.map(
                                    (item: {
                                        id: number;
                                        product_name: string;
                                        price: number;
                                    }) => (
                                        <div
                                            key={item.id}
                                            className="flex justify-between border-t py-2"
                                        >
                                            <span>{item.product_name}</span>

                                            <span>
                                                ¥{Number(item.price).toLocaleString()}
                                            </span>
                                        </div>
                                    )
                                )
                            ) : (
                                <p className="text-sm text-gray-500">
                                    商品なし
                                </p>
                            )}

                            <div className="mt-4">
                                <p className="text-sm">
                                    発送状況:{" "}
                                    {order.fulfillment_status === "shipped"
                                        ? "発送済み"
                                        : "未発送"}
                                </p>

                                <form action={updateFulfillmentStatus} className="mt-2">
                                    <input
                                        type="hidden"
                                        name="order_id"
                                        value={order.id}
                                    />

                                    <input
                                        type="hidden"
                                        name="next_status"
                                        value={
                                            order.fulfillment_status === "shipped"
                                                ? "unfulfilled"
                                                : "shipped"
                                        }
                                    />

                                    <button
                                        type="submit"
                                        className="border px-3 py-1"
                                    >
                                        {order.fulfillment_status === "shipped"
                                            ? "未発送に戻す"
                                            : "発送済みにする"}
                                    </button>
                                    <Link
                                        href={`/admin/orders/${order.id}`}
                                        className="border px-3 py-1"
                                    >
                                        詳細
                                    </Link>
                                </form>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}