"use client";

import Link from "next/link";
import { useCart } from "@/context/cartContext";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const { cartItems } = useCart();

  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        setLoggedIn(false);
        setIsAdmin(false);
        return;
      }

      const user = data.user;

      setLoggedIn(!!user);

      const userEmail = user?.email?.trim().toLowerCase();

      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL
        ?.trim()
        .toLowerCase();

      setIsAdmin(userEmail === adminEmail);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    setLoggedIn(false);
    setIsAdmin(false);
  }

  return (
    <header className="relative z-[9999] h-16 w-full border-b border-[#1F3A2E]/10 bg-white text-[#1F3A2E]">
      <div className="relative mx-auto flex h-full w-full max-w-[1400px] items-center px-6">

        {/* =========================
            LOGO
        ========================= */}
        <Link
          href="/"
          className="text-[27px] font-normal tracking-[0.03em] text-[#1F3A2E] md:text-4xl"
        >
          ZUBDOG
        </Link>

        {/* =========================
            PC NAVIGATION
        ========================= */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm md:flex">
          <Link
            href="/"
            className="transition-opacity hover:opacity-50"
          >
            トップページ
          </Link>

          <Link
            href="/#products"
            className="transition-opacity hover:opacity-50"
          >
            商品一覧
          </Link>

          <Link
            href="/about"
            className="transition-opacity hover:opacity-50"
          >
            ショップについて
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className="transition-opacity hover:opacity-50"
            >
              管理画面
            </Link>
          )}
        </nav>

        {/* =========================
            PC RIGHT
        ========================= */}
        <div className="ml-auto hidden items-center gap-7 md:flex">

          {/* CART */}
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-50"
            aria-label="カート"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-7 w-7"
            >
              <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.6L21 7H6" />
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>

            {cartItems.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1F3A2E] px-1 text-xs text-white">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* ACCOUNT */}
          {loggedIn ? (
            <Link
              href="/account/orders"
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-50"
              aria-label="注文履歴"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-7 w-7"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-50"
              aria-label="ログイン"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-7 w-7"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
          )}

          {/* LOGOUT */}
          {loggedIn && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-50"
              aria-label="ログアウト"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-7 w-7"
              >
                <path d="M10 4H5v16h5" />
                <path d="M14 8l4 4-4 4" />
                <path d="M18 12H9" />
              </svg>
            </button>
          )}
        </div>

        {/* =========================
            MOBILE MENU
        ========================= */}
        <details className="group ml-auto md:hidden">

          {/* HAMBURGER */}
          <summary
            className="flex h-12 w-12 cursor-pointer list-none items-center justify-center [&::-webkit-details-marker]:hidden"
            aria-label="メニュー"
          >
            <div className="flex h-8 w-8 flex-col justify-center gap-[6px]">
              <span className="block h-[2px] w-8 bg-[#1F3A2E]" />
              <span className="block h-[2px] w-8 bg-[#1F3A2E]" />
              <span className="block h-[2px] w-8 bg-[#1F3A2E]" />
            </div>
          </summary>

          {/* MENU PANEL */}
          <div className="fixed left-0 right-0 top-16 z-[9998] border-t border-[#1F3A2E]/10 bg-white text-[#1F3A2E] shadow-lg">
            <nav className="flex flex-col px-7 py-6 text-[15px]">

              <Link
                href="/"
                className="border-b border-[#1F3A2E]/10 py-4"
              >
                トップページ
              </Link>

              <Link
                href="/#products"
                className="border-b border-[#1F3A2E]/10 py-4"
              >
                商品一覧
              </Link>

              <Link
                href="/about"
                className="border-b border-[#1F3A2E]/10 py-4"
              >
                ショップについて
              </Link>

              <Link
                href="/cart"
                className="border-b border-[#1F3A2E]/10 py-4"
              >
                カート ({cartItems.length})
              </Link>

              {loggedIn && (
                <Link
                  href="/account/orders"
                  className="border-b border-[#1F3A2E]/10 py-4"
                >
                  注文履歴
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  className="border-b border-[#1F3A2E]/10 py-4"
                >
                  管理画面
                </Link>
              )}

              {loggedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-4 text-left"
                >
                  ログアウト
                </button>
              ) : (
                <Link
                  href="/login"
                  className="py-4"
                >
                  ログイン
                </Link>
              )}

            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}