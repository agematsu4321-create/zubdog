import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/sendEmail";

export async function GET() {
    try {
        const result = await sendEmail({
            to: "自分が受信できるメールアドレス",
            subject: "ZUBDOG テストメール",
            html: `
        <h2>ZUBDOG</h2>
        <p>メール送信テスト成功です。</p>
      `,
        });

        return NextResponse.json({
            success: true,
            result,
        });
    } catch (error) {
        console.error("TEST EMAIL ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                error: "メール送信に失敗しました",
            },
            { status: 500 }
        );
    }
}
