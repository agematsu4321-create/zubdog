"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (isSubmitting) return;

        if (password !== confirmPassword) {
            setMessage("パスワードが一致していません");
            return;
        }

        setIsSubmitting(true);
        setMessage("");

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) {
                const errorMessage = error.message.toLowerCase();

                if (errorMessage.includes("auth session missing")) {
                    setMessage(
                        "再設定リンクが無効または期限切れです。もう一度再設定メールを送信してください"
                    );
                } else if (
                    errorMessage.includes("password") &&
                    errorMessage.includes("characters")
                ) {
                    setMessage("パスワードが短すぎます");
                } else {
                    setMessage(
                        "パスワードの変更に失敗しました。もう一度お試しください"
                    );
                }

                return;
            }

            setMessage("パスワードを変更しました");

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm">
                <h1 className="mb-8 text-center text-2xl font-semibold">
                    新しいパスワードを設定
                </h1>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-1 block text-sm">
                            新しいパスワード
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
                        {isSubmitting
                            ? "変更中..."
                            : "パスワードを変更"}
                    </button>

                    {message ? (
                        <p
                            className={`text-sm ${message.includes("変更しました")
                                ? "text-green-600"
                                : "text-red-600"
                                }`}
                        >
                            {message}
                        </p>
                    ) : null}
                </form>
            </div>
        </main>
    );
}
