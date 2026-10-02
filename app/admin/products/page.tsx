import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function AdminProductsPage() {
    const supabase = await createClient();
    async function toggleProductActive(formData: FormData) {
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

        const productId = Number(formData.get("product_id"));
        const nextActive = formData.get("next_active") === "true";

        const { error } = await supabaseAdmin
            .from("products")
            .update({
                is_active: nextActive,
            })
            .eq("id", productId);

        if (error) {
            console.error("PRODUCT ACTIVE UPDATE ERROR:", error);
            return;
        }

        revalidatePath("/admin/products");
        revalidatePath("/");
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    if (user.email !== process.env.ADMIN_EMAIL) {
        redirect("/");
    }

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return (
            <main className="p-8">
                商品を読み込めません
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
            <h1 className="mb-8 text-2xl font-bold">
                商品管理
            </h1>
            <Link
                href='/admin/products/new'
                className="mb-6 inline-block bg-black px-4 py-2 text-white"
            >
                新しい商品を追加
            </Link>
            <div className="space-y-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="flex items-center justify-between border p-4"
                    >
                        <div>
                            <p className="font-semibold">
                                {product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                                ¥{Number(product.price).toLocaleString()}
                            </p>
                        </div>

                        <div className="lex items-center gap-4">
                            {product.sold_out ? (
                                <span className="text-red-500">
                                    SOLD OUT
                                </span>
                            ) : (
                                <span className="text-green-600">
                                    販売中
                                </span>
                            )}
                            <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="border px-3 py-1"
                            >
                                編集
                            </Link>
                            <form action={toggleProductActive}>
                                <input
                                    type="hidden"
                                    name="product_id"
                                    value={product.id}
                                />

                                <input
                                    type="hidden"
                                    name="next_active"
                                    value={product.is_active ? "false" : "true"}
                                />

                                <button
                                    type="submit"
                                    className="border px-3 py-1"
                                >
                                    {product.is_active ? "非表示" : "再表示"}
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );


}
