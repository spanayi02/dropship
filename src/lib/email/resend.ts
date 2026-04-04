import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");
export const FROM_EMAIL = process.env.FROM_EMAIL || "orders@wishlistaz.com";
export const STORE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "WishlistAZ";
