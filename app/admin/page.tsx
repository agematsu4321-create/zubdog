import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const userEmail = user?.email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!user || !adminEmail || userEmail !== adminEmail) {
        redirect("/");
    }

    return (
        <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <h1 className="mb-8 text-2xl font-bold">
                ZUBDOG 管理画面
            </h1>

            <div className="grid gap-4 sm:grid-cols-2">
                <Link
                    href="/admin/products"
                    className="border p-6 hover:bg-gray-50"
                >
                    <h2 className="mb-2 text-xl font-bold">
                        商品管理
                    </h2>

                    <p className="text-gray-600">
                        商品の追加・編集・非表示
                    </p>
                </Link>

                <Link
                    href="/admin/orders"
                    className="border p-6 hover:bg-gray-50"
                >
                    <h2 className="mb-2 text-xl font-bold">
                        注文管理
                    </h2>

                    <p className="text-gray-600">
                        注文確認・発送状況の管理
                    </p>
                </Link>
                <Link
                    href="/admin/custom-orders"
                    className="border p-6 hover:bg-gray-50"
                >
                    <h2 className="mb-2 text-xl font-bold">
                        オーダー管理
                    </h2>

                    <p className="text-gray-600">
                        オーダーメイド商品の制作・確認・発送管理
                    </p>
                </Link>
            </div>
        </main>
    );
}
