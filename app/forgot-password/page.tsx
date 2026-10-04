"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setMessage("");

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.resetPasswordForEmail(
                email.trim().toLowerCase(),
                {
                    redirectTo:
                        `${window.location.origin}/auth/callback?next=/reset-password`,
                }
            );

            if (error) {
                setMessage(error.message);
                return;
            }

            setMessage(
                "パスワード再設定用のメールを送信しました。メールをご確認ください。"
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm">
                <h1 className="mb-8 text-center text-2xl font-semibold">
                    パスワード再設定
                </h1>

                <p className="mb-6 text-sm text-zinc-600">
                    登録しているメールアドレスを入力してください。
                </p>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-2 bg-black p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isSubmitting ? "送信中..." : "再設定メールを送信"}
                    </button>

                    {message ? (
                        <p
                            className={`text-sm ${message.includes("送信しました")
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                        >
                            {message}
                        </p>
                    ) : null}

                    <p className="mt-4 text-center text-sm">
                        <Link href="/login" className="text-blue-500">
                            ログインに戻る
                        </Link>
                    </p>
                </form>
            </div>
        </main>
    );
}
