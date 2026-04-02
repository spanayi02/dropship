"use server";

import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function subscribeNewsletter(
  email: string
): Promise<{ success?: string; error?: string }> {
  try {
    const parsed = emailSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid email address" };
    }

    const validEmail = parsed.data.email;

    // Placeholder for Mailchimp / Resend audience integration
    console.log(`[newsletter] New subscriber: ${validEmail}`);

    return { success: "You're subscribed!" };
  } catch (error) {
    console.error("[subscribeNewsletter]", error);
    return { error: "Something went wrong. Please try again." };
  }
}
