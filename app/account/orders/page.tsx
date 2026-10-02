import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Noto_Serif_JP } from "next/font/google";

const notoSerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const customStatusLabels: Record<string, string> = {
  paid: "支払い完了",
  production: "制作中",
  waiting_confirmation: "完成品の確認待ち",
  revision: "修正対応中",
  confirmed: "確認済み",
  shipped: "発送済み",
};

export default async function OrdersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  /*
    =====================================
    完成品を承認
    =====================================
  */

  async function approveCustomItem(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const itemId = Number(
      formData.get("custom_order_item_id")
    );

    if (!Number.isInteger(itemId)) {
      return;
    }

    /*
      item取得
    */
    const {
      data: item,
      error: itemError,
    } = await supabaseAdmin
      .from("custom_order_items")
      .select(
        "id, custom_order_id, confirmation_status"
      )
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      console.error(
        "APPROVE ITEM ERROR:",
        itemError
      );

      return;
    }

    /*
      custom_order取得
    */
    const {
      data: customOrder,
      error: customOrderError,
    } = await supabaseAdmin
      .from("custom_orders")
      .select("id, order_id, status")
      .eq(
        "id",
        item.custom_order_id
      )
      .single();

    if (
      customOrderError ||
      !customOrder
    ) {
      console.error(
        "APPROVE CUSTOM ORDER ERROR:",
        customOrderError
      );

      return;
    }

    /*
      本人の注文か確認
    */
    const {
      data: parentOrder,
      error: parentOrderError,
    } = await supabaseAdmin
      .from("orders")
      .select("id, user_id")
      .eq(
        "id",
        customOrder.order_id
      )
      .single();

    if (
      parentOrderError ||
      !parentOrder ||
      parentOrder.user_id !== user.id
    ) {
      console.error(
        "APPROVE OWNERSHIP ERROR"
      );

      return;
    }

    /*
      確認待ち以外は承認不可
    */
    if (
      item.confirmation_status !==
      "waiting_confirmation"
    ) {
      return;
    }

    /*
      この商品を承認済みにする
    */
    const { error: updateError } =
      await supabaseAdmin
        .from("custom_order_items")
        .update({
          confirmation_status:
            "confirmed",
        })
        .eq("id", itemId);

    if (updateError) {
      console.error(
        "APPROVE UPDATE ERROR:",
        updateError
      );

      return;
    }

    /*
      同じオーダーの商品を確認
    */
    const {
      data: allItems,
      error: allItemsError,
    } = await supabaseAdmin
      .from("custom_order_items")
      .select(
        "id, confirmation_status"
      )
      .eq(
        "custom_order_id",
        customOrder.id
      );

    if (
      allItemsError ||
      !allItems
    ) {
      console.error(
        "APPROVE ALL ITEMS ERROR:",
        allItemsError
      );

      return;
    }

    const allConfirmed =
      allItems.length > 0 &&
      allItems.every(
        (orderItem) =>
          orderItem.confirmation_status ===
          "confirmed"
      );

    /*
      全商品承認済みなら
      注文全体もconfirmed
    */
    if (allConfirmed) {
      const { error } =
        await supabaseAdmin
          .from("custom_orders")
          .update({
            status: "confirmed",
            confirmed_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            customOrder.id
          );

      if (error) {
        console.error(
          "CUSTOM ORDER CONFIRM ERROR:",
          error
        );
      }
    }

    revalidatePath(
      "/account/orders"
    );
  }

  /*
    =====================================
    修正を依頼
    =====================================
  */

  async function requestRevision(
    formData: FormData
  ) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const itemId = Number(
      formData.get("custom_order_item_id")
    );

    const requestText = String(
      formData.get("request_text") ?? ""
    ).trim();

    if (
      !Number.isInteger(itemId) ||
      !requestText
    ) {
      return;
    }

    /*
      item取得
    */
    const {
      data: item,
      error: itemError,
    } = await supabaseAdmin
      .from("custom_order_items")
      .select(
        "id, custom_order_id, confirmation_status"
      )
      .eq("id", itemId)
      .single();

    if (itemError || !item) {
      console.error(
        "REVISION ITEM ERROR:",
        itemError
      );

      return;
    }

    /*
      custom_order取得
    */
    const {
      data: customOrder,
      error: customOrderError,
    } = await supabaseAdmin
      .from("custom_orders")
      .select("id, order_id")
      .eq(
        "id",
        item.custom_order_id
      )
      .single();

    if (
      customOrderError ||
      !customOrder
    ) {
      console.error(
        "REVISION ORDER ERROR:",
        customOrderError
      );

      return;
    }

    /*
      本人確認
    */
    const {
      data: parentOrder,
      error: parentOrderError,
    } = await supabaseAdmin
      .from("orders")
      .select("id, user_id")
      .eq(
        "id",
        customOrder.order_id
      )
      .single();

    if (
      parentOrderError ||
      !parentOrder ||
      parentOrder.user_id !== user.id
    ) {
      console.error(
        "REVISION OWNERSHIP ERROR"
      );

      return;
    }

    if (
      item.confirmation_status !==
      "waiting_confirmation"
    ) {
      return;
    }

    /*
      修正依頼を保存
    */
    const {
      error: revisionError,
    } = await supabaseAdmin
      .from(
        "custom_order_revision_requests"
      )
      .insert({
        custom_order_item_id:
          item.id,

        request_text:
          requestText,

        status: "pending",
      });

    if (revisionError) {
      console.error(
        "REVISION REQUEST ERROR:",
        revisionError
      );

      return;
    }

    /*
      商品を修正状態へ
    */
    const { error: itemUpdateError } =
      await supabaseAdmin
        .from("custom_order_items")
        .update({
          confirmation_status:
            "revision",
        })
        .eq("id", item.id);

    if (itemUpdateError) {
      console.error(
        "REVISION ITEM UPDATE ERROR:",
        itemUpdateError
      );

      return;
    }

    /*
      注文全体も修正対応中
    */
    const { error: orderUpdateError } =
      await supabaseAdmin
        .from("custom_orders")
        .update({
          status: "revision",
        })
        .eq(
          "id",
          customOrder.id
        );

    if (orderUpdateError) {
      console.error(
        "REVISION ORDER UPDATE ERROR:",
        orderUpdateError
      );
    }

    revalidatePath(
      "/account/orders"
    );
  }

  /*
    =====================================
    通常注文を取得
    =====================================
  */

  const {
    data: ordersData,
    error: ordersError,
  } = await supabase
    .from("orders")
    .select(
      "id, created_at, amount_total, currency, status"
    )
    .eq(
      "user_id",
      user.id
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (ordersError) {
    console.error(
      "ORDERS ERROR:",
      ordersError
    );

    return (
      <main className="p-8">
        注文履歴を読み込めませんでした。
      </main>
    );
  }

  const orders =
    ordersData ?? [];

  /*
    =====================================
    通常商品
    =====================================
  */

  let regularItems: {
    id: number;
    order_id: number;
    product_name: string;
    price: number;
  }[] = [];

  if (orders.length > 0) {
    const orderIds =
      orders.map(
        (order) =>
          order.id
      );

    const {
      data: orderItems,
      error: itemsError,
    } = await supabase
      .from("orders_item")
      .select(
        "id, order_id, product_name, price"
      )
      .in(
        "order_id",
        orderIds
      );

    if (itemsError) {
      console.error(
        "ITEMS ERROR:",
        itemsError
      );

      return (
        <main className="p-8">
          注文商品を読み込めませんでした。
        </main>
      );
    }

    regularItems =
      orderItems ?? [];
  }

  /*
    =====================================
    オーダー商品
    =====================================
  */

  let customOrders: any[] = [];
  let customItems: any[] = [];
  let customPhotos: any[] = [];

  if (orders.length > 0) {
    const orderIds =
      orders.map(
        (order) =>
          order.id
      );

    /*
      custom_orders
    */
    const {
      data: customOrdersData,
      error:
      customOrdersError,
    } = await supabaseAdmin
      .from("custom_orders")
      .select("*")
      .in(
        "order_id",
        orderIds
      );

    if (customOrdersError) {
      console.error(
        "CUSTOM ORDERS ERROR:",
        customOrdersError
      );
    }

    customOrders =
      customOrdersData ?? [];

    /*
      custom_order_items
    */
    const customOrderIds =
      customOrders.map(
        (customOrder) =>
          customOrder.id
      );

    if (
      customOrderIds.length >
      0
    ) {
      const {
        data: customItemsData,
        error:
        customItemsError,
      } = await supabaseAdmin
        .from(
          "custom_order_items"
        )
        .select("*")
        .in(
          "custom_order_id",
          customOrderIds
        )
        .order(
          "id",
          {
            ascending: true,
          }
        );

      if (customItemsError) {
        console.error(
          "CUSTOM ITEMS ERROR:",
          customItemsError
        );
      }

      customItems =
        customItemsData ?? [];
    }

    /*
      完成写真
    */
    const customItemIds =
      customItems.map(
        (item) =>
          item.id
      );

    if (
      customItemIds.length >
      0
    ) {
      const {
        data: photoRows,
        error: photoError,
      } = await supabaseAdmin
        .from(
          "custom_order_photos"
        )
        .select("*")
        .in(
          "custom_order_item_id",
          customItemIds
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

      if (photoError) {
        console.error(
          "CUSTOM PHOTO ERROR:",
          photoError
        );
      }

      customPhotos =
        await Promise.all(
          (photoRows ?? []).map(
            async (photo) => {
              const {
                data:
                signedData,
              } =
                await supabaseAdmin
                  .storage
                  .from(
                    "custom-order-photos"
                  )
                  .createSignedUrl(
                    photo.image_url,
                    60 * 60
                  );

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
  }

  /*
    =====================================
    注文ごとにまとめる
    =====================================
  */

  const ordersWithItems =
    orders.map(
      (order) => {
        const customOrder =
          customOrders.find(
            (custom) =>
              custom.order_id ===
              order.id
          );

        const orderCustomItems =
          customOrder
            ? customItems.filter(
              (item) =>
                item.custom_order_id ===
                customOrder.id
            )
            : [];

        return {
          ...order,

          orders_item:
            regularItems.filter(
              (item) =>
                item.order_id ===
                order.id
            ),

          custom_order:
            customOrder
              ? {
                ...customOrder,

                items:
                  orderCustomItems.map(
                    (
                      item
                    ) => ({
                      ...item,

                      photos:
                        customPhotos.filter(
                          (
                            photo
                          ) =>
                            photo.custom_order_item_id ===
                            item.id
                        ),
                    })
                  ),
              }
              : null,
        };
      }
    );

  /*
    =====================================
    画面
    =====================================
  */

  return (
    <main className="wood-bg min-h-screen px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <h1
          className={`${notoSerif.className} mb-10 text-3xl font-medium text-[#E7D9BE]`}
        >
          注文履歴
        </h1>

        {!ordersWithItems.length ? (
          <div className="bg-[#F5F1E8] p-8 text-center text-zinc-700">
            まだ注文はありません
          </div>
        ) : (
          <div className="space-y-6">
            {ordersWithItems.map(
              (order) => (
                <article
                  key={
                    order.id
                  }
                  className="bg-[#F5F1E8] p-6 shadow-md"
                >
                  {/* ORDER HEADER */}
                  <div className="flex flex-col gap-4 border-b border-zinc-300 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2
                        className={`${notoSerif.className} text-lg font-semibold text-zinc-900`}
                      >
                        注文 #
                        {
                          order.id
                        }
                      </h2>

                      <p className="mt-1 text-sm text-zinc-500">
                        {new Date(
                          order.created_at
                        ).toLocaleString(
                          "ja-JP"
                        )}
                      </p>
                    </div>

                    <div>
                      {order.status ===
                        "paid" ? (
                        <span className="inline-block bg-[#1F3A2E] px-3 py-1 text-xs text-[#E7D9BE]">
                          支払い済み
                        </span>
                      ) : (
                        <span className="inline-block bg-zinc-300 px-3 py-1 text-xs text-zinc-700">
                          {
                            order.status
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 通常商品 */}
                  {order
                    .orders_item
                    .length >
                    0 && (
                      <div className="py-4">
                        {order.orders_item.map(
                          (
                            item
                          ) => (
                            <div
                              key={
                                item.id
                              }
                              className="flex items-center justify-between border-b border-zinc-200 py-3 last:border-b-0"
                            >
                              <span className="text-sm text-zinc-800">
                                {
                                  item.product_name
                                }
                              </span>

                              <span className="text-sm text-zinc-600">
                                ¥
                                {Number(
                                  item.price ??
                                  0
                                ).toLocaleString()}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* オーダー商品 */}
                  {order.custom_order && (
                    <div className="mt-5 border-t border-zinc-300 pt-5">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`${notoSerif.className} font-semibold text-zinc-900`}
                        >
                          オーダーメイド
                        </h3>

                        <span className="text-sm text-zinc-600">
                          {customStatusLabels[
                            order
                              .custom_order
                              .status
                          ] ??
                            order
                              .custom_order
                              .status}
                        </span>
                      </div>
                      {order.custom_order.status === "shipped" &&
                        order.custom_order.tracking_number && (
                          <div className="mt-4 bg-[#F5F1E8] border border-zinc-300 p-4">
                            <p className="text-sm font-medium text-zinc-900">
                              発送情報
                            </p>

                            <p className="mt-2 text-sm text-zinc-700">
                              追跡番号：
                              <span className="font-medium">
                                {order.custom_order.tracking_number}
                              </span>
                            </p>

                            {order.custom_order.shipped_at && (
                              <p className="mt-1 text-xs text-zinc-500">
                                発送日時：
                                {new Date(
                                  order.custom_order.shipped_at
                                ).toLocaleString("ja-JP")}
                              </p>
                            )}
                          </div>
                        )}

                      <div className="mt-4 space-y-6">
                        {order.custom_order.items.map(
                          (
                            item: any
                          ) => (
                            <div
                              key={
                                item.id
                              }
                              className="border border-zinc-300 bg-white p-5"
                            >
                              <p className="font-medium text-zinc-900">
                                {item.product_type ===
                                  "bracelet"
                                  ? "ブレスレット"
                                  : item.product_type ===
                                    "earring"
                                    ? "イヤリング"
                                    : "ピアス"}
                              </p>

                              <div className="mt-3 space-y-1 text-sm text-zinc-700">
                                <p>
                                  Pattern{" "}
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
                                  ご要望：
                                  {item.request_text ||
                                    "なし"}
                                </p>
                              </div>

                              {/* 完成写真 */}
                              {item.photos
                                .length >
                                0 && (
                                  <div className="mt-5 border-t border-zinc-200 pt-5">
                                    <p className="mb-3 text-sm font-medium text-zinc-900">
                                      完成写真
                                    </p>

                                    <div className="flex flex-wrap gap-4">
                                      {item.photos.map(
                                        (
                                          photo: any
                                        ) => (
                                          <div
                                            key={
                                              photo.id
                                            }
                                            className="w-36"
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

                                            <p className="mt-2 text-xs text-zinc-500">
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

                              {/* 確認操作 */}
                              {item.confirmation_status ===
                                "waiting_confirmation" && (
                                  <div className="mt-6 border-t border-zinc-200 pt-5">
                                    <p className="mb-4 text-sm text-zinc-700">
                                      完成品をご確認ください。
                                    </p>

                                    <form
                                      action={
                                        approveCustomItem
                                      }
                                    >
                                      <input
                                        type="hidden"
                                        name="custom_order_item_id"
                                        value={
                                          item.id
                                        }
                                      />

                                      <button
                                        type="submit"
                                        className="w-full bg-[#1F3A2E] px-5 py-3 text-[#E7D9BE]"
                                      >
                                        この内容で承認する
                                      </button>
                                    </form>

                                    <form
                                      action={
                                        requestRevision
                                      }
                                      className="mt-5"
                                    >
                                      <input
                                        type="hidden"
                                        name="custom_order_item_id"
                                        value={
                                          item.id
                                        }
                                      />

                                      <label className="text-sm font-medium text-zinc-800">
                                        修正を依頼する
                                      </label>

                                      <textarea
                                        name="request_text"
                                        required
                                        maxLength={
                                          500
                                        }
                                        placeholder="修正してほしい内容をご記入ください"
                                        className="mt-2 min-h-28 w-full border border-zinc-300 p-3 text-sm"
                                      />

                                      <button
                                        type="submit"
                                        className="mt-3 border border-zinc-900 px-5 py-3 text-sm text-zinc-900"
                                      >
                                        修正依頼を送る
                                      </button>
                                    </form>

                                    <p className="mt-4 text-xs leading-5 text-zinc-500">
                                      完成写真送付後3日以内にご返信がない場合、発送手続きへ進む場合があります。
                                    </p>
                                  </div>
                                )}

                              {/* 承認済み */}
                              {item.confirmation_status ===
                                "confirmed" && (
                                  <p className="mt-5 border-t border-zinc-200 pt-4 text-sm font-medium text-green-700">
                                    ✓
                                    完成品を承認済みです
                                  </p>
                                )}

                              {/* 修正依頼済み */}
                              {item.confirmation_status ===
                                "revision" && (
                                  <p className="mt-5 border-t border-zinc-200 pt-4 text-sm font-medium text-amber-700">
                                    修正依頼を受け付けました。ショップからの更新をお待ちください。
                                  </p>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* TOTAL */}
                  <div className="mt-5 flex items-center justify-between border-t border-zinc-300 pt-5">
                    <span className="font-medium text-zinc-700">
                      合計
                    </span>

                    <span className="text-xl font-semibold text-zinc-900">
                      ¥
                      {Number(
                        order.amount_total ??
                        0
                      ).toLocaleString()}
                    </span>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}