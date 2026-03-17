import { notFound } from "next/navigation";
import { db } from "@/lib/db/db";
import { organization, service, staff, staffService } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import BookingClient from "./booking-client";

type Props = {
  params: {
    slug: string;
  };
};

async function getBookingContext(slug: string) {
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1);

  if (!org) {
    return null;
  }

  const services = await db
    .select({
      id: service.id,
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      currency: service.currency,
      isActive: service.isActive,
    })
    .from(service)
    .where(and(eq(service.organizationId, org.id), eq(service.isActive, true)));

  if (services.length === 0) {
    return { org, services: [], staffForService: [], hasBookings: false };
  }

  const serviceIds = services.map((s) => s.id);

  const staffForService = await db
    .select({
      staffId: staff.id,
      staffSlug: staff.slug,
      serviceId: staffService.serviceId,
    })
    .from(staffService)
    .innerJoin(staff, eq(staffService.staffId, staff.id))
    .where(and(eq(staff.organizationId, org.id)));

  const hasBookings = await db.query.booking.findFirst({
    where: (b, { eq }) => eq(b.organizationId, org.id),
  });

  return {
    org,
    services,
    staffForService: staffForService.filter((row) => serviceIds.includes(row.serviceId)),
    hasBookings: Boolean(hasBookings),
  };
}

export default async function Page({ params }: Props) {
  const ctx = await getBookingContext(params.slug);

  if (!ctx) {
    notFound();
  }

  return (
    <BookingClient
      organization={ctx.org}
      services={ctx.services}
      staffForService={ctx.staffForService}
    />
  );
}

