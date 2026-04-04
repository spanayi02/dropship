import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_set_in_env",
  {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
  }
);
