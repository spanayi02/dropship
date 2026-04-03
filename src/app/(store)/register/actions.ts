"use server";

import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { sendWelcomeEmail } from "@/lib/email/send";
import { rateLimit } from "@/lib/rate-limit";

export async function registerUser(
  data: RegisterInput
): Promise<{ error: string } | null> {
  // Rate limit: 5 registrations per IP per 15 minutes
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "unknown";
  const { allowed } = rateLimit(`register:${ip}`, 5);
  if (!allowed) {
    return { error: "Too many attempts. Please try again in 15 minutes." };
  }

  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.user.create({
    data: { name, email, hashedPassword, role: "CUSTOMER" },
  });

  void sendWelcomeEmail({ to: email, name: name ?? email });

  return null;
}
