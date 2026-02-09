import { createAuthClient } from "better-auth/react";
import { env } from "@/env";

// type for auth client if incase not properly configured.
type BAClient = ReturnType<typeof createAuthClient>;
export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_URL,
  fetchOptions: {
    credentials: "include",
  },
});

const { useSession, signOut } = authClient;
