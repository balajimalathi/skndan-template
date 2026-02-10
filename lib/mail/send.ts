import { env } from "@/env";

const RESEND_API = "https://api.resend.com/emails";

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendMail({
  to,
  subject,
  html,
  from,
}: SendMailOptions): Promise<{ ok: true; id?: string } | { ok: false; error: string }> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }
  const fromAddress = from ?? env.MAIL_FROM ?? "onboarding@resend.dev";
  const res = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      html,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, error: data.message ?? `HTTP ${res.status}` };
  }
  return { ok: true, id: data.id };
}
