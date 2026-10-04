"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/cartContext";

export default function CartPage() {
  const { cartItems, removeFromCart } = useCart();

  const [agreeCancel, setAgreeCancel] = useState(false);
  const [agreeStone, setAgreeStone] = useState(false);
  const [agreeConfirmation, setAgreeConfirmation] =
    useState(false);

  const [isCheckingOut, setIsCheckingOut] =
    useState(false);

  const hasCustomItems = cartItems.some(
    (item) => item.itemType === "custom"
  );

  const hasExpiredCustomItem = cartItems.some(
    (item) => {
      if (item.itemType !== "custom") {
        return false;
      }

      return (
        new Date(item.priceExpiresAt).getTime() <=
        Date.now()
      );
    }
  );

  const total = cartItems.reduce((sum, item) => {
    if (item.itemType === "custom") {
      return sum + item.price * item.quantity;
    }

    return sum + item.price;
  }, 0);

  const canCheckout =
    cartItems.length > 0 &&
    !hasExpiredCustomItem &&
    !isCheckingOut &&
    (!hasCustomItems ||
      (agreeCancel &&
        agreeStone &&
        agreeConfirmation));

  async function handleCheckout() {
    if (hasExpiredCustomItem) {
      alert(
        "価格の有効期限が切れたオーダー商品があります。削除して、もう一度オーダーしてください。"
      );
      return;
    }

    if (
      hasCustomItems &&
      (!agreeCancel ||
        !agreeStone ||
        !agreeConfirmation)
    ) {
      alert(
        "オーダー商品の注意事項に同意してください。"
      );
      return;
    }

    try {
      setIsCheckingOut(true);

      const regularSlugs = cartItems
        .filter(
          (item) =>
            item.itemType !== "custom"
        )
        .map((item) => item.slug);

      const customLockIds = cartItems
        .filter(
          (item) =>
            item.itemType === "custom"
        )
        .map((item) => item.lockId);

      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            slugs: regularSlugs,
            customLockIds,
          }),
        }
      );

      const data = await response.json();

      /*
        未ログインの場合
        → ログイン画面へ
      */
      if (response.status === 401) {
        window.location.href =
          "/login?next=/cart";
        return;
      }

      if (!response.ok) {
        alert(
          data.error ||
          "決済を開始できませんでした"
        );
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);

      alert(
        "決済を開始できませんでした"
      );
    } finally {
      setIsCheckingOut(false);
    }
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="mb-8 text-2xl font-semibold">
        カート
      </h1>

      {cartItems.length === 0 ? (
        <p>
          カートに商品がありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
          <section className="md:col-span-2">
            {cartItems.map(
              (item, index) => {
                const isCustom =
                  item.itemType ===
                  "custom";

                const isExpired =
                  isCustom &&
                  new Date(
                    item.priceExpiresAt
                  ).getTime() <=
                  Date.now();

                const itemTotal =
                  isCustom
                    ? item.price *
                    item.quantity
                    : item.price;

                const itemKey =
                  isCustom
                    ? item.cartKey
                    : `${item.slug}-${index}`;

                return (
                  <div
                    key={itemKey}
                    className="flex gap-4 border-b py-5"
                  >
                    <div className="relative h-32 w-32 shrink-0 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h2 className="font-medium">
                        {item.name}
                      </h2>

                      {isCustom ? (
                        <>
                          <p className="mt-2 text-sm">
                            Pattern{" "}
                            {
                              item.patternNumber
                            }
                          </p>

                          <p className="mt-1 text-sm">
                            天然石：
                            {
                              item.stoneName
                            }
                          </p>

                          <p className="mt-1 text-sm">
                            数量：
                            {
                              item.quantity
                            }
                            個
                          </p>

                          <p className="mt-1 text-sm">
                            ご要望：
                            {item.requestText.trim()
                              ? item.requestText
                              : "なし"}
                          </p>

                          <p className="mt-3 text-sm">
                            1個 ¥
                            {item.price.toLocaleString()}
                          </p>

                          <p className="mt-1 font-medium">
                            小計 ¥
                            {itemTotal.toLocaleString()}
                          </p>

                          {isExpired ? (
                            <div className="mt-4">
                              <p className="font-medium text-red-600">
                                価格の有効期限が切れました
                              </p>

                              <p className="mt-1 text-sm text-red-600">
                                この商品を削除して、オーダーを最初から作り直してください。
                              </p>
                            </div>
                          ) : (
                            <p className="mt-3 text-xs text-gray-500">
                              カート追加時の価格は7日間有効です。
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-2">
                          ¥
                          {item.price.toLocaleString()}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(
                            index
                          )
                        }
                        className="mt-4 text-sm underline"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </section>

          <aside className="h-fit border p-6">
            <h2 className="text-lg font-semibold">
              注文内容
            </h2>

            <div className="mt-6 flex justify-between">
              <span>
                商品合計
              </span>

              <span>
                ¥
                {total.toLocaleString()}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span>送料</span>
              <span>無料</span>
            </div>

            <div className="mt-5 flex justify-between border-t pt-5 text-lg font-semibold">
              <span>合計</span>

              <span>
                ¥
                {total.toLocaleString()}
                （税込）
              </span>
            </div>

            {hasCustomItems && (
              <div className="mt-8 border-t pt-6">
                <p className="font-medium">
                  オーダー商品の注意事項
                </p>

                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      agreeCancel
                    }
                    onChange={(e) =>
                      setAgreeCancel(
                        e.target
                          .checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    支払い後のキャンセルはできないことに同意します。
                  </span>
                </label>

                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      agreeStone
                    }
                    onChange={(e) =>
                      setAgreeStone(
                        e.target
                          .checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    支払い後の天然石の変更はできないことに同意します。
                  </span>
                </label>

                <label className="mt-4 flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      agreeConfirmation
                    }
                    onChange={(e) =>
                      setAgreeConfirmation(
                        e.target
                          .checked
                      )
                    }
                    className="mt-1"
                  />

                  <span>
                    完成写真の送付後3日以内に返信がない場合、発送されることに同意します。
                  </span>
                </label>
              </div>
            )}

            {hasExpiredCustomItem && (
              <p className="mt-6 text-sm text-red-600">
                期限切れのオーダー商品があるため購入できません。
              </p>
            )}

            <p className="mt-6 text-xs text-gray-500">
              ※ 購入にはログインが必要です。
            </p>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={!canCheckout}
              className="mt-3 w-full bg-black p-3 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isCheckingOut
                ? "処理中..."
                : "購入手続きへ"}
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}