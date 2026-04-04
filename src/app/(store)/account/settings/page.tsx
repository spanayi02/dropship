import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "./settings-client";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?callbackUrl=/account/settings");

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, hashedPassword: true },
  });

  return (
    <SettingsClient
      initialName={user?.name ?? ""}
      initialEmail={user?.email ?? ""}
      hasPassword={!!user?.hashedPassword}
    />
  );
}
