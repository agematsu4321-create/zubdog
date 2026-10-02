"use client";

import Link from "next/link";
import { useCart } from "@/context/cartContext";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
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
    setMenuOpen(false);
  }

  return (
    <header className="relative z-50 bg-white">
      <div className="mx-auto grid h-16 w-full max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center border-b border-stone-200 px-4 md:px-6">

        {/* LEFT : LOGO */}
        <Link
          href="/"
          className="justify-self-start text-2xl font-normal tracking-wide md:text-4xl"
        >
          ZUBDOG
        </Link>

        {/* CENTER : NAVIGATION */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
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

        {/* RIGHT */}
        <div className="hidden items-center justify-self-end gap-7 md:flex">
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
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-xs text-white">
                {cartItems.length}
              </span>
            )}
          </Link>

          {/* ACCOUNT / ORDER HISTORY */}
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

        {/* MOBILE BUTTON */}
        <button
          className="justify-self-end text-2xl md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="absolute left-0 top-16 w-full border-b border-stone-200 bg-white px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-5 text-sm">

            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
            >
              トップページ
            </Link>

            <Link
              href="/#products"
              onClick={() => setMenuOpen(false)}
            >
              商品一覧
            </Link>

            <Link
              href="/about"
              onClick={() => setMenuOpen(false)}
            >
              ショップについて
            </Link>

            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
            >
              カート ({cartItems.length})
            </Link>

            {loggedIn && (
              <Link
                href="/account/orders"
                onClick={() => setMenuOpen(false)}
              >
                注文履歴
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
              >
                管理画面
              </Link>
            )}

            {loggedIn ? (
              <button
                onClick={handleLogout}
                className="text-left"
              >
                ログアウト
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}