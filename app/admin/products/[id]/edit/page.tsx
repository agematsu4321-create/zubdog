import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";

type Props = {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        error?: string;
    }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
    const { id } = await params;
    const { error: pageError } = await searchParams;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userEmail = user?.email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!user || !adminEmail || userEmail !== adminEmail) {
        redirect("/");
    }

    const { data: product, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !product) {
        notFound();
    }
    async function updateProduct(formData: FormData) {
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

        const name = String(formData.get("name"));
        const price = Number(formData.get("price"));
        const slug = String(formData.get("slug"));
        const category = String(formData.get("category"));
        const { data: existingProduct } = await supabaseAdmin
            .from("products")
            .select("id")
            .eq("slug", slug)
            .neq("id", id)
            .maybeSingle();

        if (existingProduct) {
            redirect(`/admin/products/${id}/edit?error=slug-exists`);
        }
        const overview = String(formData.get("overview"));
        const description = String(formData.get("description"));

        const soldOut = formData.get("sold_out") === "on";

        const { error } = await supabaseAdmin
            .from("products")
            .update({
                name,
                price,
                slug,
                category,
                overview,
                description,
                sold_out: soldOut,
            })
            .eq("id", id);

        if (error) {
            console.error("PRODUCT UPDATE ERROR:", error);
            return;
        }

        redirect("/admin/products");
    }

    return (
        <main className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
            <h1 className="mb-8 text-2xl font-bold">
                商品を編集
            </h1>

            {pageError === "slug-exists" && (
                <p className="mb-4 text-red-500">
                    このSlugはすでに使用されています。
                </p>
            )}

            <form action={updateProduct} className="space-y-5">
                <div>
                    <label className="mb-1 block">商品名</label>
                    <input
                        name="name"
                        defaultValue={product.name}
                        className="w-full border p-3"
                    />
                </div>

                <div>
                    <label className="mb-1 block">価格</label>
                    <input
                        name="price"
                        type="number"
                        defaultValue={product.price}
                        className="w-full border p-3"
                    />
                </div>

                <div>
                    <label className="mb-1 block">Slug</label>
                    <input
                        name="slug"
                        defaultValue={product.slug}
                        className="w-full border p-3"
                    />
                </div>
                <div>
                    <label className="mb-2 block font-medium">
                        カテゴリー
                    </label>

                    <select
                        name="category"
                        defaultValue={product.category ?? ""}
                        required
                        className="w-full border p-3"
                    >
                        <option value="">選択してください</option>
                        <option value="bracelet">ブレスレット</option>
                        <option value="earring">イヤリング</option>
                        <option value="piercing">ピアス</option>
                    </select>
                </div>

                <div>
                    <label className="mb-1 block">概要</label>
                    <input
                        name="overview"
                        defaultValue={product.overview ?? ""}
                        className="w-full border p-3"
                    />
                </div>

                <div>
                    <label className="mb-1 block">説明</label>
                    <textarea
                        name="description"
                        defaultValue={product.description ?? ""}
                        rows={5}
                        className="w-full border p-3"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        name="sold_out"
                        type="checkbox"
                        defaultChecked={product.sold_out}
                    />

                    <label>売り切れ</label>
                </div>

                <button
                    type="submit"
                    className="w-full bg-black p-3 text-white"
                >
                    変更を保存
                </button>
            </form>
        </main>
    );
}