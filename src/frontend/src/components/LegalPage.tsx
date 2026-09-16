import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import type { ReactNode } from "react";

interface LegalPageProps {
  title: string;
  updated: string;
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * Shared shell for the legal content pages. Provides a consistent premium
 * layout, a back link, and a reading column so every legal page feels
 * finished and on-brand.
 */
export function LegalPage({ title, updated, icon, children }: LegalPageProps) {
  return (
    <div className="animate-rise mx-auto w-full max-w-3xl">
      <Link
        to="/"
        data-ocid="legal_back_link"
        className="focus-ring mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-fast hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>

      <div className="mb-8 flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon ?? <FileText className="size-6" aria-hidden="true" />}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated {updated}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}

interface LegalSectionProps {
  heading: string;
  children: ReactNode;
}

/** A titled section of legal copy rendered as a premium card. */
export function LegalSection({ heading, children }: LegalSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card md:p-6">
      <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
        {heading}
      </h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
