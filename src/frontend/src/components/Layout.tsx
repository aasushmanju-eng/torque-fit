import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { greeting } from "@/lib/api";
import { LEGAL_LINKS, NAV_ITEMS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Dumbbell, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" data-ocid="brand_link">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Dumbbell className="size-5" aria-hidden="true" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        <span className="text-gradient-neon">Torque Fit</span>
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const active =
          item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            data-ocid={`nav_${item.path.replace("/", "") || "dashboard"}`}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function UserFooter() {
  const { clear } = useInternetIdentity();
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-3 pt-4">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-medium">Athlete</span>
        <span className="truncate text-xs text-muted-foreground">
          Level 1 · Getting started
        </span>
      </div>
      <Button
        data-ocid="logout_button"
        variant="ghost"
        size="icon"
        aria-label="Sign out"
        onClick={() => clear()}
      >
        <LogOut className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

export function Layout() {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col gap-6 border-r border-border bg-sidebar px-4 py-6">
          <Brand />
          <NavList />
          <div className="mt-auto">
            <UserFooter />
          </div>
        </aside>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-sidebar px-4">
          <Brand />
          <Button
            data-ocid="mobile_menu_button"
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
        </header>
      )}

      {/* Mobile drawer */}
      {isMobile && mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 cursor-default bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {isMobile && mobileOpen && (
        <aside
          data-ocid="mobile_nav"
          className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col gap-6 border-r border-border bg-sidebar px-4 py-6 shadow-elevated"
        >
          <div className="flex items-center justify-between">
            <Brand />
            <Button
              data-ocid="mobile_menu_close"
              variant="ghost"
              size="icon"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <NavList onNavigate={() => setMobileOpen(false)} />
          <div className="mt-auto">
            <UserFooter />
          </div>
        </aside>
      )}

      {/* Main content */}
      <div
        className={cn(
          "flex min-h-screen w-full flex-col",
          isMobile ? "pt-16" : "pl-64",
        )}
      >
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/90 px-6 shadow-subtle backdrop-blur">
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold">
              {greeting()}
            </span>
            <span className="text-xs text-muted-foreground">
              Let&apos;s hit your goals today
            </span>
          </div>
          <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
            Torque Fit
          </span>
        </header>

        <main className="flex-1 px-6 py-6 sm:px-8 sm:py-8">
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
                  data-ocid={`footer_${item.path.replace("/", "")}`}
                  className="focus-ring text-xs text-muted-foreground transition-fast hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()}. Built with love using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  window.location.hostname,
                )}`}
                className="text-primary hover:underline"
              >
                caffeine.ai
              </a>
              .
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
