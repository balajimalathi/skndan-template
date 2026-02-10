import { createAuthClient } from "better-auth/react";
import { env } from "@/env";
import { dodopaymentsClient } from "@dodopayments/better-auth";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_URL,
  plugins: [dodopaymentsClient()],
  fetchOptions: {
    credentials: "include",
  },
});

const { useSession, signOut } = authClient;
