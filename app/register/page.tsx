"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister() {
    if (isSubmitting) return;

    if (password !== confirmPassword) {
      setMessage("パスワードが一致していません");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "登録できました。確認メールを送信しました。メールをご確認ください。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-semibold">
          新規登録
        </h1>

        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleRegister();
          }}
        >
          <div>
            <label className="mb-1 block text-sm">
              メールアドレス
            </label>
            <input
              className="w-full border p-3"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">
              名前
            </label>
            <input
              className="w-full border p-3"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">
              パスワード
            </label>
            <input
              className="w-full border p-3"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">
              パスワード確認
            </label>
            <input
              className="w-full border p-3"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 bg-black p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "登録中..." : "新規登録"}
          </button>

          {message ? (
            <p
              className={`mt-4 text-center text-sm ${message.includes("登録できました")
                  ? "text-green-600"
                  : "text-red-600"
                }`}
            >
              {message}
            </p>
          ) : null}

          <p className="mt-4 text-center text-sm">
            すでにアカウントをお持ちですか？{" "}
            <Link href="/login" className="text-blue-500">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}