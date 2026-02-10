import { db } from "@/lib/db/db";
import { emailTrigger } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendMail } from "./send";

export type TriggerContext = {
  user?: { id?: string; name?: string; email?: string };
  subscription?: { id?: string; productId?: string; status?: string };
  [key: string]: unknown;
};

function renderTemplate(template: string, context: TriggerContext): string {
  let out = template;
  for (const [key, value] of Object.entries(context)) {
    if (value === null || value === undefined) continue;
    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue === null || subValue === undefined) continue;
        const placeholder = `{{${key}.${subKey}}}`;
        out = out.split(placeholder).join(String(subValue));
      }
    }
    const placeholder = `{{${key}}}`;
    out = out.split(placeholder).join(String(value));
  }
  return out;
}

export async function runTriggers(
  triggerEvent: string,
  context: TriggerContext & { to: string }
): Promise<{ sent: number; errors: string[] }> {
  const triggers = await db
    .select()
    .from(emailTrigger)
    .where(eq(emailTrigger.triggerEvent, triggerEvent));

  const enabled = triggers.filter((t) => t.enabled);
  const errors: string[] = [];
  let sent = 0;

  for (const t of enabled) {
    const subject = renderTemplate(t.subject, context);
    const bodyHtml = renderTemplate(t.bodyHtml, context);
    const result = await sendMail({
      to: context.to,
      subject,
      html: bodyHtml,
    });
    if (result.ok) {
      sent++;
    } else {
      errors.push(result.error);
    }
  }

  return { sent, errors };
}
