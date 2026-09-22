"use client";

import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useI18n } from "@/lib/i18n/client";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";
import { AuthField, AuthShell, authFieldClass } from "@/components/store/auth-shell";

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const [googleLoading, setGoogleLoading] = useState(false);
  const { t, intl } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(t("auth.signInFailed"));
      return;
    }

    toast.success(t("auth.welcomeBack"));
    router.push(callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      toast.error(t("auth.googleFailed"));
      setGoogleLoading(false);
    }
  }

  const busy = isSubmitting || googleLoading;

  return (
    <AuthShell
      title={t("auth.signInTitle")}
      subtitle={t("auth.signInText")}
      footerPrompt={t("auth.noAccount")}
      footerLinkLabel={t("auth.submitRegister")}
      footerHref="/register"
      reasons={{
        shipping: t("home.proofShipping", {
          amount: formatPrice(FREE_SHIPPING_THRESHOLD, undefined, intl),
        }),
        secure: t("footer.securePayment"),
        returns: t("footer.returnsDays"),
      }}
    >
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-background text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
        {t("auth.continueWithGoogle")}
      </button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-hairline" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs text-muted-foreground">
            {t("auth.orEmail")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <AuthField id="email" label={t("auth.email")} error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            disabled={busy}
            className={authFieldClass}
            {...register("email")}
          />
        </AuthField>

        <AuthField id="password" label={t("auth.password")} error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            disabled={busy}
            className={authFieldClass}
            {...register("password")}
          />
        </AuthField>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:translate-y-px disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? t("auth.signingIn") : t("auth.submitSignIn")}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container-store py-16">
          <div className="mx-auto h-96 max-w-md animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
