import { ProfileSection } from "@/components/dashboard/profile-section";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { getEffectiveUserTimezone } from "@/lib/server/user-profile";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const timezone = await getEffectiveUserTimezone(session.user.id);

  return (
    <div className="px-4">
      <ProfileSection session={session} initialTimezone={timezone} />
    </div>
  );
}
