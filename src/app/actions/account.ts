"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

// ─── Update Name ─────────────────────────────────────────────────────────────

const updateNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export async function updateName(
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = updateNameSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid name" };

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  revalidatePath("/account");
  revalidatePath("/account/settings");
  return { success: "Name updated successfully" };
}

// ─── Update Email ─────────────────────────────────────────────────────────────

const updateEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function updateEmail(
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid email" };

  const existing = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing && existing.id !== session.user.id) {
    return { error: "This email is already in use" };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { email: parsed.data.email },
  });

  revalidatePath("/account/settings");
  return { success: "Email updated successfully" };
}

// ─── Change Password ──────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export async function changePassword(
  formData: FormData
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmNewPassword: formData.get("confirmNewPassword"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    return { error: "No password set. Use Google sign-in." };
  }

  const passwordMatch = await bcrypt.compare(
    parsed.data.currentPassword,
    user.hashedPassword
  );
  if (!passwordMatch) return { error: "Current password is incorrect" };

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

  await db.user.update({
    where: { id: session.user.id },
    data: { hashedPassword },
  });

  return { success: "Password changed successfully" };
}

// ─── Delete Account (stub) ────────────────────────────────────────────────────

export async function deleteAccount(): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  // In a real implementation: cancel subscriptions, anonymise data, schedule deletion
  return { error: "Account deletion is not yet available. Please contact support." };
}

// ─── Remove Wishlist Item ─────────────────────────────────────────────────────

export async function removeFromWishlist(
  productId: string
): Promise<{ success?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  await db.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  });

  revalidatePath("/account/wishlist");
  return { success: "Removed from wishlist" };
}
