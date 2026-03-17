import { renderAsync } from "react-email";
import { env } from "@/env";
import { sendMail } from "./send";
import { ConfirmationEmail } from "@/emails/booking/ConfirmationEmail";
import { ReminderEmail } from "@/emails/booking/ReminderEmail";
import { CancellationEmail } from "@/emails/booking/CancellationEmail";
import { RefundEmail } from "@/emails/booking/RefundEmail";
import type { booking, organization, service, staff } from "@/lib/db/schema";

type BookingRow = typeof booking.$inferSelect;
type OrganizationRow = typeof organization.$inferSelect;
type ServiceRow = typeof service.$inferSelect;
type StaffRow = typeof staff.$inferSelect;

function buildManageUrl(reference: string) {
  const baseUrl = env.NEXT_PUBLIC_URL;
  return `${baseUrl}/booking/${encodeURIComponent(reference)}`;
}

export async function sendBookingConfirmationEmail(opts: {
  booking: BookingRow;
  organization: OrganizationRow;
  service: ServiceRow;
  staff: StaffRow;
}) {
  const { booking: b, organization: org, service: svc, staff: st } = opts;
  const manageUrl = buildManageUrl(b.reference);

  const html = await renderAsync(
    <ConfirmationEmail
      organizationName={org.name}
      serviceName={svc.name}
      staffName={st.name}
      customerName={b.customerName}
      startTimeLabel={b.startTime.toISOString()}
      endTimeLabel={b.endTime.toISOString()}
      reference={b.reference}
      manageUrl={manageUrl}
    />
  );

  return sendMail({
    to: b.customerEmail,
    subject: `Booking confirmed · ${svc.name} at ${org.name}`,
    html,
  });
}

export async function sendBookingReminderEmail(opts: {
  booking: BookingRow;
  organization: OrganizationRow;
  service: ServiceRow;
  staff: StaffRow;
  reminderType: "24h" | "1h";
  startTimeLabel: string;
  endTimeLabel: string;
}) {
  const { booking: b, organization: org, service: svc, staff: st, reminderType, startTimeLabel, endTimeLabel } =
    opts;
  const manageUrl = buildManageUrl(b.reference);

  const html = await renderAsync(
    <ReminderEmail
      organizationName={org.name}
      serviceName={svc.name}
      staffName={st.name}
      customerName={b.customerName}
      startTimeLabel={startTimeLabel}
      endTimeLabel={endTimeLabel}
      reference={b.reference}
      manageUrl={manageUrl}
      reminderType={reminderType}
    />
  );

  return sendMail({
    to: b.customerEmail,
    subject: `Reminder · ${svc.name} at ${org.name}`,
    html,
  });
}

export async function sendBookingCancellationEmail(opts: {
  booking: BookingRow;
  organization: OrganizationRow;
  service: ServiceRow;
  staff: StaffRow;
  refundedAmountLabel?: string;
}) {
  const { booking: b, organization: org, service: svc, staff: st, refundedAmountLabel } = opts;
  const manageUrl = buildManageUrl(b.reference);

  const html = await renderAsync(
    <CancellationEmail
      organizationName={org.name}
      serviceName={svc.name}
      staffName={st.name}
      customerName={b.customerName}
      startTimeLabel={b.startTime.toISOString()}
      endTimeLabel={b.endTime.toISOString()}
      reference={b.reference}
      manageUrl={manageUrl}
      refundedAmountLabel={refundedAmountLabel}
    />
  );

  return sendMail({
    to: b.customerEmail,
    subject: `Booking cancelled · ${svc.name} at ${org.name}`,
    html,
  });
}

export async function sendBookingRefundEmail(opts: {
  booking: BookingRow;
  organization: OrganizationRow;
  service: ServiceRow;
  refundedAmountLabel: string;
  paymentGatewayLabel: string;
}) {
  const { booking: b, organization: org, service: svc, refundedAmountLabel, paymentGatewayLabel } = opts;

  const html = await renderAsync(
    <RefundEmail
      organizationName={org.name}
      serviceName={svc.name}
      customerName={b.customerName}
      reference={b.reference}
      refundedAmountLabel={refundedAmountLabel}
      paymentGatewayLabel={paymentGatewayLabel}
    />
  );

  return sendMail({
    to: b.customerEmail,
    subject: `Refund issued · ${svc.name} at ${org.name}`,
    html,
  });
}

