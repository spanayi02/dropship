"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface ReviewData {
  rating: number;
  title?: string;
  comment?: string;
}

export async function submitReview(
  productId: string,
  data: ReviewData
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be logged in to submit a review" };
    }

    const userId = session.user.id;

    if (data.rating < 1 || data.rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    // Get product slug for revalidation
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { slug: true },
    });

    if (!product) {
      return { error: "Product not found" };
    }

    // Check if user already reviewed this product
    const existingReview = await db.review.findFirst({
      where: { productId, userId },
    });

    if (existingReview) {
      return { error: "You have already reviewed this product" };
    }

    // Check if user has purchased this product
    const hasPurchased = await db.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: { not: "CANCELLED" },
        },
      },
    });

    await db.review.create({
      data: {
        userId,
        productId,
        rating: data.rating,
        title: data.title?.trim() || null,
        comment: data.comment?.trim() || null,
        isVerified: hasPurchased !== null,
      },
    });

    revalidatePath(`/products/${product.slug}`);

    return { success: true };
  } catch (error) {
    console.error("[submitReview]", error);
    return { error: "Failed to submit review" };
  }
}

export async function deleteReview(
  reviewId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const userId = session.user.id;
    const userRole = (session.user as { role?: string }).role;

    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: { product: { select: { slug: true } } },
    });

    if (!review) {
      return { error: "Review not found" };
    }

    if (review.userId !== userId && userRole !== "ADMIN") {
      return { error: "Not authorized to delete this review" };
    }

    await db.review.delete({ where: { id: reviewId } });

    revalidatePath(`/products/${review.product.slug}`);

    return { success: true };
  } catch (error) {
    console.error("[deleteReview]", error);
    return { error: "Failed to delete review" };
  }
}
