import { LEGAL_LINKS } from "@/lib/types";
import { Link, Outlet } from "@tanstack/react-router";
import { Dumbbell } from "lucide-react";

/**
 * Standalone shell for the legal content pages that is reachable before
 * sign-in. Mirrors the app's visual language (near-black background, neon
 * accents, card-based content) without the authenticated sidebar, so legal
 * links on the sign-in screen actually navigate to their pages.
 */
export function LegalLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/90 px-6 shadow-subtle backdrop-blur">
        <Link
          to="/"
          data-ocid="legal_brand_link"
          className="flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Dumbbell className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-gradient-neon">Torque Fit</span>
          </span>
        </Link>
        <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
          Legal
        </span>
      </header>

      <main className="flex-1 px-6 py-8 sm:px-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/40 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <nav
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            aria-label="Legal links"
          >
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-ocid={`legal_footer_${item.path.replace("/", "")}`}
                className="focus-ring text-xs text-muted-foreground transition-fast hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Torque Fit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
