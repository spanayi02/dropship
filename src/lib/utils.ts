import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  cents: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateMarkup(
  costPrice: number,
  markupType: "MULTIPLIER" | "FIXED" | "MANUAL",
  markupValue: number,
  floor?: number | null,
  ceiling?: number | null
): number {
  let price: number;

  if (markupType === "MULTIPLIER") {
    price = Math.round(costPrice * markupValue);
  } else if (markupType === "FIXED") {
    price = costPrice + Math.round(markupValue * 100);
  } else {
    return costPrice;
  }

  if (floor && price < floor) price = floor;
  if (ceiling && price > ceiling) price = ceiling;

  return price;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
