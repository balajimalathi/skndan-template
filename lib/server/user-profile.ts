import { db, type User } from "@/lib/db/db";
import {
  user as userTable,
  userProperty as userPropertyTable,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getUserOrganization } from "@/lib/server/organization";

export type ProfileSettingsInput = {
  name: string;
  email: string;
};

export async function updateUserProfileForCurrentUser(
  currentUser: User,
  data: ProfileSettingsInput,
) {
  const role = (currentUser as { role?: string | null }).role;
  if (role !== "admin") {
    throw new Error("Forbidden");
  }

  const now = new Date();

  await db
    .update(userTable)
    .set({
      name: data.name,
      email: data.email,
      updatedAt: now,
    })
    .where(eq(userTable.id, currentUser.id));

  return {
    ...currentUser,
    name: data.name,
    email: data.email,
  };
}

export async function getEffectiveUserTimezone(userId: string) {
  const organization = await getUserOrganization(userId);
  return organization?.timezone ?? "UTC";
}


