"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { updateUserProfileForCurrentUser } from "@/lib/server/user-profile";

const ProfileSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
});

export type ProfileSettingsValues = z.infer<typeof ProfileSettingsSchema>;

export async function updateProfileSettings(
  values: ProfileSettingsValues,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return { success: false, error: "Not authenticated" };
  }

  let parsed: ProfileSettingsValues;
  try {
    parsed = ProfileSettingsSchema.parse(values);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message ?? "Invalid data",
      };
    }
    return { success: false, error: "Invalid data" };
  }

  try {
    await updateUserProfileForCurrentUser(session.user as any, parsed);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return { success: false, error: "Forbidden" };
    }
    console.error(error);
    return { success: false, error: "Failed to update profile" };
  }
}

