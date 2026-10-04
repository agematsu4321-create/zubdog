import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;
    const next = searchParams.get("next") ?? "/";

    const safeNext =
        next.startsWith("/") && !next.startsWith("//")
            ? next
            : "/";

    if (tokenHash && type) {
        const supabase = await createClient();

        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
        });

        if (!error) {
            const redirectUrl = request.nextUrl.clone();

            redirectUrl.pathname = safeNext;
            redirectUrl.search = "";

            return NextResponse.redirect(redirectUrl);
        }

        console.error("VERIFY OTP ERROR:", error);
    }

    const errorUrl = request.nextUrl.clone();

    errorUrl.pathname = "/login";
    errorUrl.search = "";
    errorUrl.searchParams.set(
        "error",
        "invalid_recovery_link"
    );

    return NextResponse.redirect(errorUrl);
}