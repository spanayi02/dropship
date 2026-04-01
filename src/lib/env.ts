import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("DropShip"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

function validateEnv() {
  const serverResult = serverEnvSchema.safeParse(process.env);
  if (!serverResult.success) {
    console.error(
      "❌ Invalid server environment variables:",
      serverResult.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  const clientResult = clientEnvSchema.safeParse(process.env);
  if (!clientResult.success) {
    console.error(
      "❌ Invalid client environment variables:",
      clientResult.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  return { ...serverResult.data, ...clientResult.data };
}

export const env = validateEnv();
