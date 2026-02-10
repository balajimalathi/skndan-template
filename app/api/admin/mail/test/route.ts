import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sendMail } from "@/lib/mail/send";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }
  let body: { to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const to = typeof body.to === "string" && body.to.includes("@") ? body.to : undefined;
  if (!to) {
    return NextResponse.json({ error: "Valid 'to' email required" }, { status: 400 });
  }
  const result = await sendMail({
    to,
    subject: "Test email from admin",
    html: "<p>This is a test email. Mail is configured correctly.</p>",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ success: true });
}
