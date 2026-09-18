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
  CRON_SECRET: z.string().optional(),
  PRICE_UPDATE_API_KEY: z.string().optional(),
  // Suppliers — see README "Supplier configuration"
  CJ_API_KEY: z.string().optional(),
  CJ_OPEN_ID: z.string().optional(),
  CJ_WEBHOOK_SECRET: z.string().optional(),
  CJ_FROM_COUNTRY: z.string().length(2).optional(),
  CJ_QUOTE_COUNTRY: z.string().length(2).optional(),
  CJ_LOGISTIC_NAME: z.string().optional(),
  CJ_AUTO_PAY: z.enum(["true", "false"]).optional(),
  CJ_SANDBOX: z.enum(["true", "false"]).optional(),
  CJ_IOSS_TYPE: z.enum(["1", "2", "3"]).optional(),
  CJ_IOSS_NUMBER: z.string().optional(),
  FX_USD_EUR: z.coerce.number().positive().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("WishlistAZ"),
  NEXT_PUBLIC_CURRENCY: z.string().length(3).default("EUR"),
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
