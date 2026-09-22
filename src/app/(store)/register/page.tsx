import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/store-config";
import { AuthShell } from "@/components/store/auth-shell";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  const { t, locale } = await getT();
  const intl = intlLocale(locale);

  return (
    <AuthShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerText")}
      footerPrompt={t("auth.haveAccount")}
      footerLinkLabel={t("auth.submitSignIn")}
      footerHref="/login"
      reasons={{
        shipping: t("home.proofShipping", {
          amount: formatPrice(FREE_SHIPPING_THRESHOLD, undefined, intl),
        }),
        secure: t("footer.securePayment"),
        returns: t("footer.returnsDays"),
      }}
    >
      <RegisterForm />
    </AuthShell>
  );
}
