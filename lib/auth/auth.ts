import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, createAuthMiddleware, organization as organizationPlugin } from "better-auth/plugins";
import { db } from "../db/db";
import { env } from "@/env";
import DodoPayments from "dodopayments";
import {
  dodopayments,
  checkout,
  portal,
  webhooks,
  usage,
} from "@dodopayments/better-auth";
import { member, organization } from "@/lib/db/schema";

export const dodoPayments = new DodoPayments({
  bearerToken: env.DODO_PAYMENTS_API_KEY!,
  environment: env.DODO_PAYMENTS_ENVIRONMENT!,
});

function buildSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string }> =
    {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  return providers;
}

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: false,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => { }),
  },
  account: {},
  plugins: [
    admin(),
    nextCookies(),
    organizationPlugin(),
    dodopayments({
      client: dodoPayments,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "pdt_xxxxxxxxxxxxxxxxxxxxx",
              slug: "premium-plan",
            },
          ],
          successUrl: "/dashboard/success",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
          onPayload: async (payload) => {
            console.log("Received webhook:", payload.type);
          },
        }),
        usage(),
      ],
    }),
  ],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          console.log("session create", session);
        },
      },
    },
    user: {
      update: {
        before: async (session) => {
          console.log("session update before", session, session);
        },
        after: async (session) => {
          console.log("session update after", session);
        },
      },
    },
  },
  socialProviders: buildSocialProviders(),
});
