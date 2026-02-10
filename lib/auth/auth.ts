import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, createAuthMiddleware, organization } from "better-auth/plugins";
import { db } from "../db/db";
import { env } from "@/env";

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
    before: createAuthMiddleware(async (ctx) => {}),
  },
  account: {},
  plugins: [admin(), nextCookies(), organization({})],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          console.log("session create", session);
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          const { runTriggers } = await import("@/lib/mail/run-triggers");
          await runTriggers("user.signed_up", {
            to: user.email,
            user: { id: user.id, name: user.name, email: user.email },
          });
        },
      },
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
