import type { Metadata } from "next";
import { LegalPageView } from "@/components/store/legal-page";
import { getLegalPage } from "@/lib/legal/content";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const page = getLegalPage("faq", await getLocale());
  return { title: page.title, description: page.intro };
}

export default function Page() {
  return <LegalPageView slug="faq" />;
}
