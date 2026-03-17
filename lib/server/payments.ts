import { db } from "@/lib/db/db";
import { booking, organization } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type PaymentProvider = "RAZORPAY" | "DODOPAYMENTS" | "FREE";

export type CreateCheckoutInput = {
  bookingId: string;
};

export type CreateCheckoutResult =
  | {
      provider: "RAZORPAY";
      bookingId: string;
      amount: string;
      currency: string;
      payload: {
        orderId: string;
        amount: number;
        currency: string;
        receipt: string;
        publicKey: string;
        redirectUrl: string;
      };
    }
  | {
      provider: "DODOPAYMENTS";
      bookingId: string;
      amount: string;
      currency: string;
      payload: {
        checkoutId: string;
        status: "pending";
        redirectUrl: string;
      };
    }
  | {
      provider: "FREE";
      bookingId: string;
      amount: string;
      currency: string;
      payload: null;
    };

export async function getBookingWithOrganization(bookingId: string) {
  const [row] = await db
    .select()
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!row) {
    return null;
  }

  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, row.organizationId))
    .limit(1);

  if (!org) {
    return null;
  }

  return { booking: row, organization: org };
}

async function createRazorpayCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const ctx = await getBookingWithOrganization(input.bookingId);

  if (!ctx) {
    throw new Error("Booking or organization not found");
  }

  const { booking: bookingRow, organization: org } = ctx;

  if (org.paymentGateway !== "RAZORPAY") {
    throw new Error("Organization is not configured to use Razorpay");
  }

  if (!org.razorpayKeyId || !org.razorpayKeySecret) {
    throw new Error("Razorpay credentials not configured for organization");
  }

  const amountNumber = Number(bookingRow.amountPaid ?? bookingRow.amountPaid ?? 0);
  const amount = amountNumber.toFixed(2);

  const orderId = `order_mock_${bookingRow.id}`;

  return {
    provider: "RAZORPAY",
    bookingId: bookingRow.id,
    amount,
    currency: bookingRow.currency,
    payload: {
      orderId,
      amount: amountNumber,
      currency: bookingRow.currency,
      receipt: bookingRow.reference,
      publicKey: org.razorpayKeyId,
      redirectUrl: `https://example.com/mock-razorpay/${orderId}`,
    },
  };
}

async function createDodoPayCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
  const ctx = await getBookingWithOrganization(input.bookingId);

  if (!ctx) {
    throw new Error("Booking or organization not found");
  }

  const { booking: bookingRow, organization: org } = ctx;

  if (org.paymentGateway !== "DODOPAYMENTS") {
    throw new Error("Organization is not configured to use DodoPay");
  }

  if (!org.dodopayClientId || !org.dodopayClientSecret) {
    throw new Error("DodoPay credentials not configured for organization");
  }

  const amountNumber = Number(bookingRow.amountPaid ?? bookingRow.amountPaid ?? 0);
  const amount = amountNumber.toFixed(2);

  const checkoutId = `checkout_mock_${bookingRow.id}`;

  return {
    provider: "DODOPAYMENTS",
    bookingId: bookingRow.id,
    amount,
    currency: bookingRow.currency,
    payload: {
      checkoutId,
      status: "pending",
      redirectUrl: `https://example.com/mock-dodopay/checkout/${checkoutId}`,
    },
  };
}

export async function createCheckoutForBooking(
  input: CreateCheckoutInput,
): Promise<CreateCheckoutResult> {
  const ctx = await getBookingWithOrganization(input.bookingId);

  if (!ctx) {
    throw new Error("Booking not found");
  }

  const { booking: bookingRow, organization: org } = ctx;

  if (bookingRow.paymentGateway === "FREE") {
    const amountNumber = Number(bookingRow.amountPaid ?? bookingRow.amountPaid ?? 0);
    const amount = amountNumber.toFixed(2);

    return {
      provider: "FREE",
      bookingId: bookingRow.id,
      amount,
      currency: bookingRow.currency,
      payload: null,
    };
  }

  if (org.paymentGateway === "RAZORPAY") {
    return createRazorpayCheckout(input);
  }

  if (org.paymentGateway === "DODOPAYMENTS") {
    return createDodoPayCheckout(input);
  }

  throw new Error("Unsupported payment gateway for organization");
}

