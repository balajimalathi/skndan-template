import { notFound } from "next/navigation";
import { db } from "@/lib/db/db";
import { booking, organization, service, staff } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { format } from "date-fns";

type Props = {
  params: {
    reference: string;
  };
};

async function getBookingDetails(reference: string) {
  const rows = await db
    .select({
      booking,
      organization,
      service,
      staff,
    })
    .from(booking)
    .innerJoin(organization, eq(booking.organizationId, organization.id))
    .innerJoin(service, eq(booking.serviceId, service.id))
    .innerJoin(staff, and(eq(booking.staffId, staff.id), eq(staff.organizationId, organization.id)))
    .where(eq(booking.reference, reference))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];

  return {
    booking: row.booking,
    organization: row.organization,
    service: row.service,
    staff: row.staff,
  };
}

function buildGoogleCalendarUrl(opts: {
  title: string;
  description: string;
  start: Date;
  end: Date;
}) {
  const startUtc = opts.start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const endUtc = opts.end.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    details: opts.description,
    dates: `${startUtc}/${endUtc}`,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default async function BookingConfirmationPage({ params }: Props) {
  const details = await getBookingDetails(params.reference);

  if (!details) {
    notFound();
  }

  const { booking: b, organization: org, service: svc, staff: st } = details;

  const startLabel = format(b.startTime, "EEE, MMM d yyyy, HH:mm");
  const endLabel = format(b.endTime, "HH:mm");

  const title = `${svc.name} with ${st.name}`;
  const description = `Booking at ${org.name}. Reference: ${b.reference}.`;
  const googleCalendarUrl = buildGoogleCalendarUrl({
    title,
    description,
    start: b.startTime,
    end: b.endTime,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Booking {b.reference}</h1>
        <p className="text-sm text-muted-foreground">{org.name}</p>
      </div>

      <div className="space-y-2 rounded-md border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">Status</span>
          <span className="uppercase">{b.status}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Service</span>
          <span>{svc.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Staff</span>
          <span>{st.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">When</span>
          <span>
            {startLabel} – {endLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Customer</span>
          <span>
            {b.customerName} ({b.customerEmail})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium">Payment</span>
          <span>
            {b.paymentStatus}
            {b.amountPaid ? ` • ${b.amountPaid} ${org.currency}` : ""}
          </span>
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-4 text-sm">
        <h2 className="text-sm font-medium">Next steps</h2>
        <p className="text-muted-foreground">
          Add this booking to your calendar and save this page to manage your appointment later.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border bg-secondary px-3 py-1 text-xs font-medium"
          >
            Add to Google Calendar
          </a>
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center rounded-md border border-dashed px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            Manage booking (coming soon)
          </button>
        </div>
      </div>
    </div>
  );
}

