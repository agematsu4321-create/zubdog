"use client";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    async function handleLogin(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setMessage(error.message);
            return;
        }

        setMessage("ログインしました");
        router.push("/");
    }

    async function handleGoogleLogin() {
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    }

    return (
        <main className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm">
                <h1 className="mb-8 text-center text-2xl font-semibold">
                    ログイン
                </h1>
                <form
                    className="flex flex-col gap-4"
                    onSubmit={(event) => {
                        handleLogin(event);
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
                    <div className="text-right">
                        <Link
                            href="/forgot-password"
                            className="text-sm text-blue-500"
                        >
                            パスワードをお忘れですか？
                        </Link>
                    </div>
                    <button type="submit" className="mt-2 bg-black p-3 text-white">
                        ログイン
                    </button>
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="mt-2 border p-3"
                    >
                        googleでログイン
                    </button>
                    {message ? <p className="text-sm text-red-500">{message}</p> : null}
                    <p className="mt-4 text-center text-sm">
                        アカウントをお持ちでないですか？{" "}
                        <Link href="/register" className="text-blue-500">
                            新規登録
                        </Link>
                    </p>
                </form>
            </div>
        </main>
    );
}

