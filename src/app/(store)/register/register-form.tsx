"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useI18n } from "@/lib/i18n/client";
import { AuthField, authFieldClass } from "@/components/store/auth-shell";
import { registerUser } from "./actions";

export function RegisterForm() {
  const router = useRouter();
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  // "By creating an account you agree to our {terms} and {privacy}." — split the
  // template so each placeholder becomes a real link without dangerous HTML.
  const legalTemplate = t("auth.legalPrompt");
  const [beforeTerms = "", afterTerms = ""] = legalTemplate.split("{terms}");
  const [between = "", after = ""] = afterTerms.split("{privacy}");
  const legalParts = { before: beforeTerms, between, after };

  async function onSubmit(data: RegisterInput) {
    const result = await registerUser(data);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    // Sign the new account straight in, so nobody has to type the password twice.
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.success(t("auth.accountCreatedSignIn"));
      router.push("/login");
      return;
    }

    toast.success(t("auth.accountCreated"));
    router.push("/account");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <AuthField id="name" label={t("auth.name")} error={errors.name?.message}>
        <input
          id="name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          disabled={isSubmitting}
          className={authFieldClass}
          {...register("name")}
        />
      </AuthField>

      <AuthField id="email" label={t("auth.email")} error={errors.email?.message}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          disabled={isSubmitting}
          className={authFieldClass}
          {...register("email")}
        />
      </AuthField>

      <AuthField id="password" label={t("auth.password")} error={errors.password?.message}>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={t("auth.passwordHint")}
          aria-invalid={!!errors.password}
          disabled={isSubmitting}
          className={authFieldClass}
          {...register("password")}
        />
      </AuthField>

      <AuthField
        id="confirmPassword"
        label={t("auth.confirmPassword")}
        error={errors.confirmPassword?.message}
      >
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.confirmPassword}
          disabled={isSubmitting}
          className={authFieldClass}
          {...register("confirmPassword")}
        />
      </AuthField>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSubmitting ? t("auth.creating") : t("auth.submitRegister")}
      </button>

      <p className="text-xs leading-relaxed text-muted-foreground">
        {legalParts.before}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          {t("auth.termsLink")}
        </Link>
        {legalParts.between}
        <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
          {t("auth.privacyLink")}
        </Link>
        {legalParts.after}
      </p>
    </form>
  );
}
