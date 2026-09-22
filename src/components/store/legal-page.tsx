import type { ReactNode } from "react";
import { getT } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n";
import { getLegalPage, LEGAL_LAST_UPDATED, type LegalSlug } from "@/lib/legal/content";

/**
 * Renders an information or legal page. [[PLACEHOLDER]] markers in the source
 * text become visible chips, so a detail the owner has not filled in yet is
 * obvious on the page instead of reading as though it were real.
 */
function withPlaceholders(text: string): ReactNode[] {
  return text.split(/(\[\[[A-Z0-9_]+\]\])/g).map((part, i) => {
    const m = part.match(/^\[\[([A-Z0-9_]+)\]\]$/);
    if (!m) return part;
    return (
      <mark
        key={i}
        title="Fill this in before taking real orders"
        className="rounded bg-warning-soft px-1.5 py-0.5 font-mono text-[0.85em] font-medium text-warning"
      >
        {m[1].toLowerCase().replace(/_/g, " ")}
      </mark>
    );
  });
}

export async function LegalPageView({ slug }: { slug: LegalSlug }) {
  const { t, locale } = await getT();
  const page = getLegalPage(slug, locale);
  const updated = new Date(LEGAL_LAST_UPDATED).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container-store max-w-3xl py-12 sm:py-16">
      <header className="mb-10 border-b border-hairline pb-8">
        <h1 className="text-3xl sm:text-4xl">{page.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{page.intro}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          {t("legal.lastUpdated", { date: updated })}
        </p>
      </header>

      <div className="space-y-10">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 text-xl">{section.heading}</h2>
            <div className="space-y-3">
              {section.body.map((paragraph, i) => (
                <p key={i} className="max-w-[68ch] leading-relaxed text-muted-foreground">
                  {withPlaceholders(paragraph)}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-12 border-t border-hairline pt-6 text-sm text-muted-foreground">
        {t("legal.questions")}
      </p>
    </div>
  );
}
