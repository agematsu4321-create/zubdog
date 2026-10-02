import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/sendEmail";

type Props = {
    params: Promise<{
        id: string;
    }>;
};

const statusLabels: Record<string, string> = {
    paid: "支払い完了",
    production: "制作中",
    waiting_confirmation: "確認待ち",
    revision: "修正対応中",
    confirmed: "確認済み",
    shipped: "発送済み",
};

export default async function AdminCustomOrderDetailPage({
    params,
}: Props) {
    const { id } = await params;

    const customOrderId = Number(id);

    if (!Number.isInteger(customOrderId)) {
        notFound();
    }

    /*
      =====================================
      管理者確認
      =====================================
    */

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
      =====================================
      制作開始
      =====================================
    */

    async function startProduction() {
        "use server";

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const userEmail = user?.email
            ?.trim()
            .toLowerCase();

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

        const { error } = await supabaseAdmin
            .from("custom_orders")
            .update({
                status: "production",
            })
            .eq("id", customOrderId)
            .eq("status", "paid");

        if (error) {
            console.error(
                "START PRODUCTION ERROR:",
                error
            );

            return;
        }

        revalidatePath(
            `/admin/custom-orders/${customOrderId}`
        );

        revalidatePath(
            "/admin/custom-orders"
        );
    }

    /*
      =====================================
      完成写真アップロード
      =====================================
    */

    async function uploadCompletionPhoto(
        formData: FormData
    ) {
        "use server";

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const userEmail = user?.email
            ?.trim()
            .toLowerCase();

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
          production / revision の時だけ
          写真変更可能
        */

        const {
            data: currentOrder,
            error: currentOrderError,
        } = await supabaseAdmin
            .from("custom_orders")
            .select("id, status, order_id")
            .eq("id", customOrderId)
            .single();

        if (
            currentOrderError ||
            !currentOrder ||
            ![
                "production",
                "revision",
            ].includes(currentOrder.status)
        ) {
            console.error(
                "PHOTO STATUS ERROR:",
                currentOrderError
            );

            return;
        }

        const itemId = Number(
            formData.get(
                "custom_order_item_id"
            )
        );

        const itemNumber = Number(
            formData.get("item_number")
        );

        const imageFile =
            formData.get("image");

        if (
            !(imageFile instanceof File) ||
            imageFile.size === 0
        ) {
            console.error(
                "画像が選択されていません"
            );

            return;
        }

        if (
            !imageFile.type.startsWith(
                "image/"
            )
        ) {
            console.error(
                "画像ファイルではありません"
            );

            return;
        }

        if (
            imageFile.size >
            5 * 1024 * 1024
        ) {
            console.error(
                "画像は5MB以下にしてください"
            );

            return;
        }

        /*
          この商品が本当に
          今のオーダーの商品か確認
        */

        const {
            data: targetItem,
            error: targetItemError,
        } = await supabaseAdmin
            .from("custom_order_items")
            .select(
                "id, custom_order_id, quantity, confirmation_status"
            )
            .eq("id", itemId)
            .eq(
                "custom_order_id",
                customOrderId
            )
            .single();

        if (
            targetItemError ||
            !targetItem
        ) {
            console.error(
                "TARGET ITEM ERROR:",
                targetItemError
            );

            return;
        }

        if (
            !Number.isInteger(
                itemNumber
            ) ||
            itemNumber < 1 ||
            itemNumber >
            Number(
                targetItem.quantity
            )
        ) {
            console.error(
                "item_numberが不正です"
            );

            return;
        }

        const extension =
            imageFile.name
                .split(".")
                .pop() || "jpg";

        const imagePath =
            `orders/${customOrderId}/${itemId}-${itemNumber}-${Date.now()}.${extension}`;

        /*
          Storageへアップロード
        */

        const {
            error: uploadError,
        } =
            await supabaseAdmin.storage
                .from(
                    "custom-order-photos"
                )
                .upload(
                    imagePath,
                    imageFile,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType:
                            imageFile.type,
                    }
                );

        if (uploadError) {
            console.error(
                "PHOTO UPLOAD ERROR:",
                uploadError
            );

            return;
        }

        /*
          今までの写真は削除せず
          is_current = false にする
    
          → 履歴として残る
        */

        const {
            error: oldPhotoError,
        } = await supabaseAdmin
            .from(
                "custom_order_photos"
            )
            .update({
                is_current: false,
            })
            .eq(
                "custom_order_item_id",
                itemId
            )
            .eq(
                "item_number",
                itemNumber
            );

        if (oldPhotoError) {
            console.error(
                "OLD PHOTO UPDATE ERROR:",
                oldPhotoError
            );

            return;
        }

        /*
          新しい写真を保存
        */

        const {
            error: photoError,
        } = await supabaseAdmin
            .from(
                "custom_order_photos"
            )
            .insert({
                custom_order_item_id:
                    itemId,

                image_url:
                    imagePath,

                item_number:
                    itemNumber,

                is_current: true,
            });

        if (photoError) {
            console.error(
                "PHOTO SAVE ERROR:",
                photoError
            );

            return;
        }

        revalidatePath(
            `/admin/custom-orders/${customOrderId}`
        );
    }

    /*
      =====================================
      お客様確認へ送る
      初回・再送の両方
      =====================================
    */

    async function sendForConfirmation() {
        "use server";

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const userEmail = user?.email
            ?.trim()
            .toLowerCase();

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
          現在のcustom_order
        */

        const {
            data: currentCustomOrder,
            error: currentOrderError,
        } = await supabaseAdmin
            .from("custom_orders")
            .select("id, status, order_id")
            .eq(
                "id",
                customOrderId
            )
            .single();

        if (
            currentOrderError ||
            !currentCustomOrder ||
            ![
                "production",
                "revision",
            ].includes(
                currentCustomOrder.status
            )
        ) {
            console.error(
                "SEND CONFIRM STATUS ERROR:",
                currentOrderError
            );

            return;
        }


        /*
          オーダー商品取得
        */

        const {
            data: orderItems,
            error: itemsError,
        } = await supabaseAdmin
            .from(
                "custom_order_items"
            )
            .select(
                "id, quantity, confirmation_status"
            )
            .eq(
                "custom_order_id",
                customOrderId
            );

        if (
            itemsError ||
            !orderItems ||
            orderItems.length === 0
        ) {
            console.error(
                "CONFIRM ITEMS ERROR:",
                itemsError
            );

            return;
        }

        const itemIds =
            orderItems.map(
                (item) => item.id
            );

        /*
          現在の完成写真
        */

        const {
            data: photos,
            error: photosError,
        } = await supabaseAdmin
            .from(
                "custom_order_photos"
            )
            .select(
                "id, created_at, custom_order_item_id, item_number"
            )
            .in(
                "custom_order_item_id",
                itemIds
            )
            .eq(
                "is_current",
                true
            );

        if (photosError) {
            console.error(
                "CONFIRM PHOTOS ERROR:",
                photosError
            );

            return;
        }

        /*
          必要枚数の写真が全部あるか
        */

        const allPhotosReady =
            orderItems.every(
                (item) => {
                    const numbers =
                        new Set(
                            (photos ?? [])
                                .filter(
                                    (photo) =>
                                        photo.custom_order_item_id ===
                                        item.id
                                )
                                .map(
                                    (photo) =>
                                        Number(
                                            photo.item_number
                                        )
                                )
                        );

                    return Array.from(
                        {
                            length:
                                Number(
                                    item.quantity
                                ),
                        },
                        (_, index) =>
                            index + 1
                    ).every(
                        (number) =>
                            numbers.has(number)
                    );
                }
            );

        if (!allPhotosReady) {
            console.error(
                "完成写真が足りません"
            );

            return;
        }

        /*
          修正対応中の場合
          修正版写真がアップされたか確認
        */

        if (
            currentCustomOrder.status ===
            "revision"
        ) {
            const {
                data: pendingRevisions,
                error: revisionError,
            } = await supabaseAdmin
                .from(
                    "custom_order_revision_requests"
                )
                .select(
                    "id, created_at, custom_order_item_id"
                )
                .in(
                    "custom_order_item_id",
                    itemIds
                )
                .eq(
                    "status",
                    "pending"
                );

            if (revisionError) {
                console.error(
                    "REVISION CHECK ERROR:",
                    revisionError
                );

                return;
            }

            if (
                !pendingRevisions ||
                pendingRevisions.length ===
                0
            ) {
                console.error(
                    "未処理の修正依頼がありません"
                );

                return;
            }

            const revisedPhotosReady =
                pendingRevisions.every(
                    (revision) => {
                        const latestPhoto =
                            (photos ?? [])
                                .filter(
                                    (photo) =>
                                        photo.custom_order_item_id ===
                                        revision.custom_order_item_id
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(
                                            b.created_at
                                        ).getTime() -
                                        new Date(
                                            a.created_at
                                        ).getTime()
                                )[0];

                        if (!latestPhoto) {
                            return false;
                        }

                        return (
                            new Date(
                                latestPhoto.created_at
                            ).getTime() >
                            new Date(
                                revision.created_at
                            ).getTime()
                        );
                    }
                );

            if (!revisedPhotosReady) {
                console.error(
                    "修正版の完成写真を登録してください"
                );

                return;
            }
        }

        const now =
            new Date().toISOString();

        /*
          初回送信
        */

        if (
            currentCustomOrder.status ===
            "production"
        ) {
            const {
                error:
                itemUpdateError,
            } = await supabaseAdmin
                .from(
                    "custom_order_items"
                )
                .update({
                    confirmation_status:
                        "waiting_confirmation",
                })
                .in(
                    "id",
                    itemIds
                );

            if (itemUpdateError) {
                console.error(
                    "INITIAL ITEM UPDATE ERROR:",
                    itemUpdateError
                );

                return;
            }
        }

        /*
          修正後の再送
        */

        if (
            currentCustomOrder.status ===
            "revision"
        ) {
            const revisionItemIds =
                orderItems
                    .filter(
                        (item) =>
                            item.confirmation_status ===
                            "revision"
                    )
                    .map(
                        (item) => item.id
                    );

            if (
                revisionItemIds.length >
                0
            ) {
                const {
                    error:
                    itemUpdateError,
                } = await supabaseAdmin
                    .from(
                        "custom_order_items"
                    )
                    .update({
                        confirmation_status:
                            "waiting_confirmation",
                    })
                    .in(
                        "id",
                        revisionItemIds
                    );

                if (
                    itemUpdateError
                ) {
                    console.error(
                        "REVISION ITEM UPDATE ERROR:",
                        itemUpdateError
                    );

                    return;
                }
            }

            /*
              修正依頼を処理済みにする
            */

            const {
                error:
                revisionResolveError,
            } = await supabaseAdmin
                .from(
                    "custom_order_revision_requests"
                )
                .update({
                    status:
                        "resolved",

                    resolved_at:
                        now,
                })
                .in(
                    "custom_order_item_id",
                    itemIds
                )
                .eq(
                    "status",
                    "pending"
                );

            if (
                revisionResolveError
            ) {
                console.error(
                    "REVISION RESOLVE ERROR:",
                    revisionResolveError
                );

                return;
            }
        }

        /*
          custom_orderを確認待ちへ
        */

        const {
            error: orderUpdateError,
        } = await supabaseAdmin
            .from("custom_orders")
            .update({
                status:
                    "waiting_confirmation",

                confirmation_sent_at:
                    now,
            })
            .eq(
                "id",
                customOrderId
            );

        if (orderUpdateError) {
            console.error(
                "ORDER CONFIRMATION UPDATE ERROR:",
                orderUpdateError
            );

            return;
        }

        revalidatePath(
            `/admin/custom-orders/${customOrderId}`
        );

        revalidatePath(
            "/admin/custom-orders"
        );

        revalidatePath(
            "/account/orders"
        );
        /*
  お客様へ確認メール
*/

        try {
            const { data: parentOrder, error: parentOrderError } =
                await supabaseAdmin
                    .from("orders")
                    .select("customer_email")
                    .eq("id", currentCustomOrder.order_id)
                    .single();

            if (parentOrderError) {
                console.error(
                    "CUSTOMER EMAIL LOAD ERROR:",
                    parentOrderError
                );
            } else if (parentOrder?.customer_email) {
                const isRevision =
                    currentCustomOrder.status === "revision";

                await sendEmail({
                    to: parentOrder.customer_email,

                    subject: isRevision
                        ? "【ZUBDOG】修正版が完成しました"
                        : "【ZUBDOG】オーダー商品の完成確認をお願いします",

                    html: `
                <h2>ZUBDOG</h2>

                <p>
                    ${isRevision
                            ? "修正版の商品が完成しました。"
                            : "ご注文いただいたオーダー商品が完成しました。"
                        }
                </p>

                <p>
                    ZUBDOGの注文履歴ページから完成写真をご確認ください。
                </p>

                <p>
                    内容に問題がなければ承認を、
                    修正をご希望の場合は修正依頼をお願いいたします。
                </p>

                <p>
                    オーダー番号：${customOrderId}
                </p>
            `,
                });

                console.log(
                    "CONFIRMATION EMAIL SENT:",
                    parentOrder.customer_email
                );
            }
        } catch (emailError) {
            console.error(
                "CONFIRMATION EMAIL ERROR:",
                emailError
            );
        }
    }
    /*
  =====================================
  発送済みにする
  =====================================
*/


    async function markAsShipped(
        formData: FormData
    ) {
        "use server";

        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const userEmail = user?.email
            ?.trim()
            .toLowerCase();

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

        const trackingNumber = String(
            formData.get("tracking_number") ?? ""
        ).trim();

        if (!trackingNumber) {
            console.error("追跡番号がありません");
            return;
        }

        const { error } = await supabaseAdmin
            .from("custom_orders")
            .update({
                status: "shipped",
                shipped_at: new Date().toISOString(),
                tracking_number: trackingNumber,
            })
            .eq("id", customOrderId)
            .eq("status", "confirmed");

        if (error) {
            console.error(
                "CUSTOM ORDER SHIP ERROR:",
                error
            );

            return;
        }
        /*
          発送完了メール
        */

        try {
            const { data: customOrderData, error: customOrderError } =
                await supabaseAdmin
                    .from("custom_orders")
                    .select("order_id")
                    .eq("id", customOrderId)
                    .single();

            if (customOrderError) {
                console.error(
                    "SHIPPING ORDER LOAD ERROR:",
                    customOrderError
                );
            } else {
                const { data: parentOrder, error: parentOrderError } =
                    await supabaseAdmin
                        .from("orders")
                        .select("customer_email")
                        .eq("id", customOrderData.order_id)
                        .single();

                if (parentOrderError) {
                    console.error(
                        "SHIPPING CUSTOMER EMAIL ERROR:",
                        parentOrderError
                    );
                } else if (parentOrder?.customer_email) {
                    await sendEmail({
                        to: parentOrder.customer_email,
                        subject: "【ZUBDOG】商品を発送しました",
                        html: `
                    <h2>ZUBDOG</h2>

                    <p>
                        ご注文いただいた商品を発送しました。
                    </p>

                    <p>
                        追跡番号：<strong>${trackingNumber}</strong>
                    </p>

                    <p>
                        詳しい発送状況は、配送会社の追跡サービスからご確認ください。
                    </p>

                    <p>
                        この度はZUBDOGをご利用いただきありがとうございます。
                    </p>
                `,
                    });

                    console.log(
                        "SHIPPING EMAIL SENT:",
                        parentOrder.customer_email
                    );
                }
            }
        } catch (emailError) {
            console.error(
                "SHIPPING EMAIL ERROR:",
                emailError
            );
        }
        revalidatePath(
            `/admin/custom-orders/${customOrderId}`
        );

        revalidatePath(
            "/admin/custom-orders"
        );

        revalidatePath(
            "/account/orders"
        );
    }

    /*
      =====================================
      custom_orders
      =====================================
    */

    const {
        data: customOrder,
        error: customOrderError,
    } = await supabaseAdmin
        .from("custom_orders")
        .select("*")
        .eq(
            "id",
            customOrderId
        )
        .single();

    if (
        customOrderError ||
        !customOrder
    ) {
        notFound();
    }

    /*
      =====================================
      通常注文
      =====================================
    */

    const {
        data: order,
        error: orderError,
    } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq(
            "id",
            customOrder.order_id
        )
        .single();

    /*
      =====================================
      オーダー商品
      =====================================
    */

    const {
        data: items,
        error: itemsError,
    } = await supabaseAdmin
        .from(
            "custom_order_items"
        )
        .select("*")
        .eq(
            "custom_order_id",
            customOrder.id
        )
        .order(
            "id",
            {
                ascending: true,
            }
        );

    if (
        orderError ||
        itemsError
    ) {
        console.error(
            "CUSTOM ORDER DETAIL ERROR:",
            {
                orderError,
                itemsError,
            }
        );

        return (
            <main className="p-8">
                オーダー情報を読み込めませんでした。
            </main>
        );
    }

    const itemIds =
        (items ?? []).map(
            (item) => item.id
        );

    /*
      =====================================
      完成写真
      =====================================
    */

    let completionPhotos: {
        id: number;
        created_at: string;
        custom_order_item_id: number;
        image_url: string;
        item_number: number;
        is_current: boolean;
        signed_url: string | null;
    }[] = [];

    if (itemIds.length > 0) {
        const {
            data: photoRows,
            error: photosError,
        } = await supabaseAdmin
            .from(
                "custom_order_photos"
            )
            .select("*")
            .in(
                "custom_order_item_id",
                itemIds
            )
            .eq(
                "is_current",
                true
            )
            .order(
                "item_number",
                {
                    ascending: true,
                }
            );

        if (photosError) {
            console.error(
                "COMPLETION PHOTOS LOAD ERROR:",
                photosError
            );
        }

        completionPhotos =
            await Promise.all(
                (photoRows ?? []).map(
                    async (photo) => {
                        const {
                            data: signedData,
                            error:
                            signedUrlError,
                        } =
                            await supabaseAdmin.storage
                                .from(
                                    "custom-order-photos"
                                )
                                .createSignedUrl(
                                    photo.image_url,
                                    60 * 60
                                );

                        if (
                            signedUrlError
                        ) {
                            console.error(
                                "SIGNED URL ERROR:",
                                signedUrlError
                            );
                        }

                        return {
                            ...photo,

                            signed_url:
                                signedData
                                    ?.signedUrl ??
                                null,
                        };
                    }
                )
            );
    }

    /*
      =====================================
      修正依頼
      =====================================
    */

    let revisionRequests: {
        id: number;
        created_at: string;
        custom_order_item_id: number;
        request_text: string;
        status: string;
        resolved_at:
        | string
        | null;
    }[] = [];

    if (itemIds.length > 0) {
        const {
            data:
            revisionRows,
            error:
            revisionLoadError,
        } = await supabaseAdmin
            .from(
                "custom_order_revision_requests"
            )
            .select(
                "id, created_at, custom_order_item_id, request_text, status, resolved_at"
            )
            .in(
                "custom_order_item_id",
                itemIds
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

        if (
            revisionLoadError
        ) {
            console.error(
                "REVISION LOAD ERROR:",
                revisionLoadError
            );
        }

        revisionRequests =
            revisionRows ?? [];
    }

    /*
      =====================================
      写真が全部揃ったか
      =====================================
    */

    const allPhotosReady =
        (items ?? []).length >
        0 &&
        (items ?? []).every(
            (item) => {
                const numbers =
                    new Set(
                        completionPhotos
                            .filter(
                                (photo) =>
                                    photo.custom_order_item_id ===
                                    item.id
                            )
                            .map(
                                (photo) =>
                                    Number(
                                        photo.item_number
                                    )
                            )
                    );

                return Array.from(
                    {
                        length:
                            Number(
                                item.quantity
                            ),
                    },
                    (_, index) =>
                        index + 1
                ).every(
                    (number) =>
                        numbers.has(number)
                );
            }
        );

    /*
      =====================================
      修正版写真があるか
      =====================================
    */

    const pendingRevisions =
        revisionRequests.filter(
            (revision) =>
                revision.status ===
                "pending"
        );

    const revisionPhotosReady =
        pendingRevisions.length >
        0 &&
        pendingRevisions.every(
            (revision) => {
                const latestPhoto =
                    completionPhotos
                        .filter(
                            (photo) =>
                                photo.custom_order_item_id ===
                                revision.custom_order_item_id
                        )
                        .sort(
                            (a, b) =>
                                new Date(
                                    b.created_at
                                ).getTime() -
                                new Date(
                                    a.created_at
                                ).getTime()
                        )[0];

                if (!latestPhoto) {
                    return false;
                }

                return (
                    new Date(
                        latestPhoto.created_at
                    ).getTime() >
                    new Date(
                        revision.created_at
                    ).getTime()
                );
            }
        );

    /*
      =====================================
      画面
      =====================================
    */

    return (
        <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
            <Link
                href="/admin/custom-orders"
                className="text-sm underline"
            >
                ← オーダー管理に戻る
            </Link>

            {/* HEADER */}

            <div className="mt-6 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row">
                <div>
                    <h1 className="text-2xl font-bold">
                        オーダー #
                        {customOrder.id}
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        通常注文 #
                        {
                            customOrder.order_id
                        }
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                        {order?.created_at
                            ? new Date(
                                order.created_at
                            ).toLocaleString(
                                "ja-JP"
                            )
                            : ""}
                    </p>
                </div>

                <div className="sm:text-right">
                    <p className="font-semibold">
                        {statusLabels[
                            customOrder.status
                        ] ??
                            customOrder.status}
                    </p>

                    <p className="mt-2 text-xl">
                        ¥
                        {Number(
                            order?.amount_total ??
                            0
                        ).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* 購入者 */}

            <section className="mt-8">
                <h2 className="text-lg font-bold">
                    購入者
                </h2>

                <div className="mt-4 space-y-1">
                    <p>
                        メール：
                        {order?.customer_email ??
                            "未登録"}
                    </p>

                    <p>
                        お名前：
                        {order?.shipping_name ??
                            "未登録"}
                    </p>
                </div>
            </section>

            {/* オーダー内容 */}

            <section className="mt-10">
                <h2 className="text-lg font-bold">
                    オーダー内容
                </h2>

                <div className="mt-4 space-y-5">
                    {(items ?? []).map(
                        (item) => {
                            const itemPhotos =
                                completionPhotos.filter(
                                    (photo) =>
                                        photo.custom_order_item_id ===
                                        item.id
                                );

                            const itemRevisions =
                                revisionRequests.filter(
                                    (revision) =>
                                        revision.custom_order_item_id ===
                                        item.id
                                );

                            const pendingItemRevisions =
                                itemRevisions.filter(
                                    (revision) =>
                                        revision.status ===
                                        "pending"
                                );

                            return (
                                <div
                                    key={item.id}
                                    className="border p-5"
                                >
                                    <p className="font-bold">
                                        {item.product_type ===
                                            "bracelet"
                                            ? "ブレスレット"
                                            : item.product_type ===
                                                "earring"
                                                ? "イヤリング"
                                                : "ピアス"}
                                    </p>

                                    <div className="mt-4 space-y-2 text-sm">
                                        <p>
                                            Pattern：
                                            {
                                                item.pattern_number
                                            }
                                        </p>

                                        <p>
                                            天然石：
                                            {
                                                item.stone_name
                                            }
                                        </p>

                                        <p>
                                            数量：
                                            {
                                                item.quantity
                                            }
                                            個
                                        </p>

                                        <p>
                                            基本料金：¥
                                            {Number(
                                                item.base_price
                                            ).toLocaleString()}
                                        </p>

                                        <p>
                                            石料金：+¥
                                            {Number(
                                                item.stone_price
                                            ).toLocaleString()}
                                        </p>

                                        <p>
                                            1個：¥
                                            {Number(
                                                item.unit_price
                                            ).toLocaleString()}
                                        </p>

                                        <p>
                                            ご要望：
                                            {item.request_text ||
                                                "なし"}
                                        </p>
                                    </div>

                                    {/* 修正依頼 */}

                                    {pendingItemRevisions.length >
                                        0 && (
                                            <div className="mt-6 border border-orange-300 bg-orange-50 p-4">
                                                <p className="font-semibold text-orange-900">
                                                    お客様からの修正依頼
                                                </p>

                                                {pendingItemRevisions.map(
                                                    (
                                                        revision
                                                    ) => (
                                                        <div
                                                            key={
                                                                revision.id
                                                            }
                                                            className="mt-3"
                                                        >
                                                            <p className="whitespace-pre-line text-sm text-orange-900">
                                                                {
                                                                    revision.request_text
                                                                }
                                                            </p>

                                                            <p className="mt-2 text-xs text-orange-700">
                                                                {new Date(
                                                                    revision.created_at
                                                                ).toLocaleString(
                                                                    "ja-JP"
                                                                )}
                                                            </p>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}

                                    {/* 完成写真 */}

                                    {itemPhotos.length >
                                        0 && (
                                            <div className="mt-6 border-t pt-5">
                                                <p className="mb-3 text-sm font-medium">
                                                    現在の完成写真
                                                </p>

                                                <div className="flex flex-wrap gap-4">
                                                    {itemPhotos.map(
                                                        (photo) => (
                                                            <div
                                                                key={
                                                                    photo.id
                                                                }
                                                                className="w-40"
                                                            >
                                                                {photo.signed_url && (
                                                                    <img
                                                                        src={
                                                                            photo.signed_url
                                                                        }
                                                                        alt={`${photo.item_number}個目の完成写真`}
                                                                        className="aspect-square w-full object-cover"
                                                                    />
                                                                )}

                                                                <p className="mt-2 text-sm">
                                                                    {
                                                                        photo.item_number
                                                                    }
                                                                    個目
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                    {/* 写真登録 */}

                                    {[
                                        "production",
                                        "revision",
                                    ].includes(
                                        customOrder.status
                                    ) && (
                                            <form
                                                action={
                                                    uploadCompletionPhoto
                                                }
                                                className="mt-6 border-t pt-5"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="custom_order_item_id"
                                                    value={
                                                        item.id
                                                    }
                                                />

                                                <label className="block text-sm font-medium">
                                                    {customOrder.status ===
                                                        "revision"
                                                        ? "修正版の完成写真"
                                                        : "完成写真"}
                                                </label>

                                                {customOrder.status ===
                                                    "revision" && (
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            新しい写真を登録すると、現在の写真は履歴として残ります。
                                                        </p>
                                                    )}

                                                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                                    <select
                                                        name="item_number"
                                                        className="border px-3 py-2"
                                                    >
                                                        {Array.from(
                                                            {
                                                                length:
                                                                    Number(
                                                                        item.quantity
                                                                    ),
                                                            },
                                                            (
                                                                _,
                                                                index
                                                            ) =>
                                                                index +
                                                                1
                                                        ).map(
                                                            (
                                                                number
                                                            ) => (
                                                                <option
                                                                    key={
                                                                        number
                                                                    }
                                                                    value={
                                                                        number
                                                                    }
                                                                >
                                                                    {
                                                                        number
                                                                    }
                                                                    個目
                                                                </option>
                                                            )
                                                        )}
                                                    </select>

                                                    <input
                                                        type="file"
                                                        name="image"
                                                        accept="image/*"
                                                        required
                                                        className="border p-2"
                                                    />

                                                    <button
                                                        type="submit"
                                                        className="bg-black px-4 py-2 text-white"
                                                    >
                                                        {customOrder.status ===
                                                            "revision"
                                                            ? "修正版写真を登録"
                                                            : "写真を登録"}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                </div>
                            );
                        }
                    )}
                </div>
            </section>

            {/* 制作管理 */}

            <section className="mt-10 border-t pt-8">
                <h2 className="text-lg font-bold">
                    制作管理
                </h2>

                <p className="mt-4">
                    現在：{" "}
                    <strong>
                        {statusLabels[
                            customOrder.status
                        ] ??
                            customOrder.status}
                    </strong>
                </p>

                {/* 支払い完了 */}

                {customOrder.status ===
                    "paid" && (
                        <form
                            action={
                                startProduction
                            }
                            className="mt-5"
                        >
                            <button
                                type="submit"
                                className="bg-black px-5 py-3 text-white"
                            >
                                制作を開始する
                            </button>
                        </form>
                    )}

                {/* 制作中 */}

                {customOrder.status ===
                    "production" && (
                        <div className="mt-5">
                            {allPhotosReady ? (
                                <>
                                    <p className="text-sm text-green-700">
                                        必要な完成写真がすべて登録されています。
                                    </p>

                                    <form
                                        action={
                                            sendForConfirmation
                                        }
                                        className="mt-4"
                                    >
                                        <button
                                            type="submit"
                                            className="bg-black px-5 py-3 text-white"
                                        >
                                            お客様確認へ送る
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    完成写真を必要枚数アップロードしてください。
                                </p>
                            )}
                        </div>
                    )}

                {/* 修正対応中 */}

                {customOrder.status ===
                    "revision" && (
                        <div className="mt-5">
                            {revisionPhotosReady ? (
                                <>
                                    <p className="text-sm text-green-700">
                                        修正版の完成写真が登録されています。
                                    </p>

                                    <form
                                        action={
                                            sendForConfirmation
                                        }
                                        className="mt-4"
                                    >
                                        <button
                                            type="submit"
                                            className="bg-black px-5 py-3 text-white"
                                        >
                                            再度お客様確認へ送る
                                        </button>
                                    </form>
                                </>
                            ) : (
                                <p className="text-sm text-orange-700">
                                    修正依頼を確認し、修正版の完成写真を登録してください。
                                </p>
                            )}
                        </div>
                    )}

                {/* 確認待ち */}

                {customOrder.status ===
                    "waiting_confirmation" && (
                        <div className="mt-5">
                            <p className="font-medium">
                                お客様の確認待ちです。
                            </p>

                            {customOrder.confirmation_sent_at && (
                                <p className="mt-2 text-sm text-gray-500">
                                    送信日時：{" "}
                                    {new Date(
                                        customOrder.confirmation_sent_at
                                    ).toLocaleString(
                                        "ja-JP"
                                    )}
                                </p>
                            )}
                        </div>
                    )}

                {/* 確認済み */}

                {/* 確認済み */}

                {customOrder.status === "confirmed" && (
                    <div className="mt-5">
                        <p className="text-sm font-medium text-green-700">
                            ✓ お客様による確認が完了しています。
                        </p>

                        <form
                            action={markAsShipped}
                            className="mt-5 max-w-md"
                        >
                            <label className="block text-sm font-medium">
                                追跡番号
                            </label>

                            <input
                                type="text"
                                name="tracking_number"
                                required
                                placeholder="例：123456789012"
                                className="mt-2 w-full border px-3 py-2"
                            />

                            <button
                                type="submit"
                                className="mt-4 bg-black px-5 py-3 text-white"
                            >
                                発送済みにする
                            </button>
                        </form>
                    </div>
                )}

                {/* 発送済み */}

                {customOrder.status === "shipped" && (
                    <div className="mt-5">
                        <p className="font-medium text-green-700">
                            ✓ 発送済みです。
                        </p>
                        {customOrder.tracking_number && (
                            <p className="mt-2 text-sm">
                                追跡番号：{customOrder.tracking_number}
                            </p>
                        )}
                        {customOrder.shipped_at && (
                            <p className="mt-2 text-sm text-gray-500">
                                発送日時：{" "}
                                {new Date(
                                    customOrder.shipped_at
                                ).toLocaleString("ja-JP")}
                            </p>
                        )}
                    </div>
                )}
            </section>
        </main>
    );
}