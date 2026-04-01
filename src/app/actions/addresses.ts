"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const addressSchema = z.object({
  label: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  phone: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

export async function createAddress(
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = addressSchema.safeParse({
    label: formData.get("label") || undefined,
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    postalCode: formData.get("postalCode"),
    phone: formData.get("phone") || undefined,
    isDefault: formData.get("isDefault") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address" };
  }

  const { isDefault, ...addressData } = parsed.data;

  // If setting as default, unset all others first
  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  await db.address.create({
    data: {
      ...addressData,
      isDefault: isDefault ?? false,
      userId: session.user.id,
    },
  });

  revalidatePath("/account/addresses");
  return { success: "Address added successfully" };
}

export async function updateAddress(
  id: string,
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // Verify ownership
  const existing = await db.address.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== session.user.id) {
    return { error: "Address not found" };
  }

  const parsed = addressSchema.safeParse({
    label: formData.get("label") || undefined,
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    street: formData.get("street"),
    city: formData.get("city"),
    state: formData.get("state"),
    country: formData.get("country"),
    postalCode: formData.get("postalCode"),
    phone: formData.get("phone") || undefined,
    isDefault: formData.get("isDefault") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid address" };
  }

  const { isDefault, ...addressData } = parsed.data;

  if (isDefault) {
    await db.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  await db.address.update({
    where: { id },
    data: { ...addressData, isDefault: isDefault ?? false },
  });

  revalidatePath("/account/addresses");
  return { success: "Address updated successfully" };
}

export async function deleteAddress(
  id: string
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const existing = await db.address.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== session.user.id) {
    return { error: "Address not found" };
  }

  await db.address.delete({ where: { id } });

  revalidatePath("/account/addresses");
  return { success: "Address deleted" };
}
