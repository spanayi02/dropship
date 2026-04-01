"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MarkupType, StoreSettings } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function getStoreSettings(): Promise<StoreSettings> {
  let settings = await db.storeSettings.findFirst();

  if (!settings) {
    settings = await db.storeSettings.create({
      data: {
        storeName: "DropShip",
        contactEmail: "support@dropship.com",
        currency: "USD",
        globalMarkupType: "MULTIPLIER",
        globalMarkupValue: 2.5,
        freeShippingThreshold: 5000,
        flatShippingRate: 499,
      },
    });
  }

  return settings;
}

export interface UpdateStoreSettingsData {
  storeName: string;
  logoUrl?: string;
  contactEmail: string;
  currency: string;
  globalMarkupType: MarkupType;
  globalMarkupValue: number;
  freeShippingThreshold: number;
  flatShippingRate: number;
}

export async function updateStoreSettings(
  data: UpdateStoreSettingsData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const existing = await db.storeSettings.findFirst();

    if (existing) {
      await db.storeSettings.update({
        where: { id: existing.id },
        data: {
          storeName: data.storeName,
          logoUrl: data.logoUrl ?? null,
          contactEmail: data.contactEmail,
          currency: data.currency,
          globalMarkupType: data.globalMarkupType,
          globalMarkupValue: data.globalMarkupValue,
          freeShippingThreshold: data.freeShippingThreshold,
          flatShippingRate: data.flatShippingRate,
        },
      });
    } else {
      await db.storeSettings.create({
        data: {
          storeName: data.storeName,
          logoUrl: data.logoUrl ?? null,
          contactEmail: data.contactEmail,
          currency: data.currency,
          globalMarkupType: data.globalMarkupType,
          globalMarkupValue: data.globalMarkupValue,
          freeShippingThreshold: data.freeShippingThreshold,
          flatShippingRate: data.flatShippingRate,
        },
      });
    }

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("[updateStoreSettings]", error);
    return { success: false, error: "Failed to update settings" };
  }
}
