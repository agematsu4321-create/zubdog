type SendEmailParams = {
    to: string;
    subject: string;
    html: string;
};

export async function sendEmail({
    to,
    subject,
    html,
}: SendEmailParams) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
        throw new Error(
            "RESEND_API_KEY または EMAIL_FROM が設定されていません"
        );
    }

    const response = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",

            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },

            body: JSON.stringify({
                from,
                to: [to],
                subject,
                html,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        console.error("RESEND ERROR:", data);

        throw new Error(
            "メール送信に失敗しました"
        );
    }

    return data;
}