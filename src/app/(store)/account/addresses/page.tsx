import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AddressesClient } from "./addresses-client";

export const dynamic = 'force-dynamic';

export default async function AddressesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const addresses = await db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return <AddressesClient initialAddresses={addresses} />;
}
