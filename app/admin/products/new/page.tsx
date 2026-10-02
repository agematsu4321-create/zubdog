import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function NewProductPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email?.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!user || !adminEmail || userEmail !== adminEmail) {
    redirect("/");
  }

  async function createProduct(formData: FormData) {
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
      .maybeSingle();

    if (existingProduct) {
      redirect("/admin/products/new?error=slug-exists");
    }
    const overview = String(formData.get("overview"));
    const description = String(formData.get("description"));
    const imageFile = formData.get("image") as File;

    if (!imageFile || imageFile.size === 0) {
      console.error("画像が選択されていません");
      return;
    }

    if (!imageFile.type.startsWith("image/")) {
      console.error("画像ファイルではありません");
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      console.error("画像は5MB以下にしてください");
      return;
    }

    const extension = imageFile.name.split(".").pop() || "jpg";
    const imagePath = `products/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(imagePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("IMAGE UPLOAD ERROR:", uploadError);
      return;
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("product-images").getPublicUrl(imagePath);

    const imageUrl = publicUrl;

    const { error } = await supabaseAdmin
      .from("products")
      .insert({
        name,
        price,
        slug,
        category,
        overview,
        description,
        image_url: imageUrl,
        sold_out: false,
      });

    if (error) {
      console.error("PRODUCT CREATE ERROR:", error);
      return;
    }

    redirect("/admin/products");
  }

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 text-2xl font-bold">
        新しい商品を追加
      </h1>
      {error === "slug-exists" && (
        <p className="mb-4 text-red-500">
          このSlugはすでに使用されています。
        </p>
      )}

      <form action={createProduct} className="space-y-5">
        <div>
          <label className="mb-1 block">商品名</label>
          <input
            name="name"
            required
            className="w-full border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block">価格</label>
          <input
            name="price"
            type="number"
            required
            className="w-full border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block">Slug</label>
          <input
            name="slug"
            required
            placeholder="dog-magnet"
            className="w-full border p-3"
          />
        </div>
        <div>
          <label className="mb-2 block font-medium">
            カテゴリー
          </label>

          <select
            name="category"
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
            className="w-full border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block">説明</label>
          <textarea
            name="description"
            rows={5}
            className="w-full border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block">商品画像</label>
          <input
            name="image"
            type="file"
            accept="image/*"
            required
            className="w-full border p-3"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black p-3 text-white"
        >
          商品を追加
        </button>
      </form>
    </main>
  );
}