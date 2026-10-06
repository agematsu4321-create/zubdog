import AddToCartButton from "@/components/AddToCartButton";
import BuyNowButton from "@/components/BuyNowButton";
import ProductGallery from "@/components/productGallery";

import Link from "next/link";

import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

type ProductPageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function ProductPage({
    params,
}: ProductPageProps) {
    /*
      =========================
      SLUG
      =========================
    */

    const { slug } = await params;

    /*
      =========================
      SUPABASE
      =========================
    */

    const supabase = await createClient();

    /*
      =========================
      PRODUCT
      =========================
    */

    const {
        data: product,
        error,
    } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (error || !product) {
        notFound();
    }

    /*
      =========================
      PRODUCT IMAGES
      =========================
    */

    const {
        data: productImages,
    } = await supabase
        .from("product_images")
        .select("id, image_url")
        .eq("product_id", product.id)
        .order("sort_order", {
            ascending: true,
        });

    /*
      =========================
      GALLERY
      =========================
    */

    const galleryImages = [
        {
            id: product.id,
            image_url:
                product.image_url,
        },

        ...(productImages ?? []).filter(
            (image) =>
                image.image_url !==
                product.image_url
        ),
    ];

    /*
      =========================
      PAGE
      =========================
    */

    return (
        <main
            className={`
        ${notoSerif.className}
        wood-bg
        min-h-screen
        text-[#E7D9BE]
      `}
        >
            <div className="mx-auto w-full max-w-[1200px] px-6 py-12">

                {/* =========================
            BACK
        ========================= */}

                <Link
                    href={
                        product.category
                            ? `/category/${product.category}`
                            : "/#products"
                    }
                    className="mb-10 inline-block text-sm text-[#E7D9BE] transition-opacity hover:opacity-50"
                >
                    ← 商品一覧に戻る
                </Link>

                {/* =========================
            PRODUCT
        ========================= */}

                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-start">

                    {/* =========================
              LEFT
          ========================= */}

                    <div className="relative flex justify-center">

                        <ProductGallery
                            productName={
                                product.name
                            }
                            images={
                                galleryImages
                            }
                        />

                        {/* SOLD OUT OVERLAY */}

                        {product.sold_out && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <span className="text-lg font-medium tracking-widest text-white">
                                    SOLD OUT
                                </span>
                            </div>
                        )}

                    </div>

                    {/* =========================
              RIGHT
          ========================= */}

                    <div className="px-2 md:px-6">

                        {/* =========================
                NAME
            ========================= */}

                        <h1 className="text-3xl font-medium text-[#E7D9BE] md:text-4xl">
                            {product.name}
                        </h1>

                        {/* =========================
                PRICE
            ========================= */}

                        <p className="mt-8 text-2xl text-[#E7D9BE]">
                            ¥
                            {Number(
                                product.price
                            ).toLocaleString()}
                        </p>

                        {/* =========================
                BUTTONS
            ========================= */}

                        <div className="mt-12 space-y-5">

                            {product.sold_out ? (
                                /*
                                  =========================
                                  SOLD OUT
                                  =========================
                                */

                                <button
                                    type="button"
                                    disabled
                                    className="
                    w-full
                    border
                    border-black
                    bg-gray-200
                    px-4
                    py-4
                    text-gray-500
                  "
                                >
                                    SOLD OUT
                                </button>
                            ) : (
                                /*
                                  =========================
                                  AVAILABLE
                                  =========================
                                */

                                <>
                                    {/* CART */}

                                    <AddToCartButton
                                        product={{
                                            name:
                                                product.name,

                                            price:
                                                product.price,

                                            slug:
                                                product.slug,

                                            image:
                                                product.image_url,

                                            lockId:
                                                product.lock_id,
                                        }}
                                    />

                                    {/* BUY NOW */}

                                    <BuyNowButton
                                        slug={
                                            product.slug
                                        }
                                    />
                                </>
                            )}

                        </div>

                        {/* =========================
                DESCRIPTION
            ========================= */}

                        <div className="mt-14 bg-white px-6 py-6 shadow-sm">

                            {/* THEME */}

                            <div>
                                <h2 className="font-medium text-black">
                                    テーマ
                                </h2>

                                <p className="mt-4 leading-7 text-zinc-700">
                                    {product.overview ||
                                        "未登録"}
                                </p>
                            </div>

                            {/* NOTE */}

                            <div className="mt-10">
                                <h2 className="font-medium text-black">
                                    備考
                                </h2>

                                <p className="mt-4 whitespace-pre-line leading-7 text-zinc-700">
                                    {product.description ||
                                        "未登録"}
                                </p>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        </main>
    );
}