import { Button } from "@/components/ui/button";
import { getConsentChoice, setConsentChoice } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * First-visit cookie and data consent notice. Appears once until the user
 * accepts or declines, then their choice is persisted locally.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsentChoice() === null) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const decide = (choice: "accepted" | "declined") => {
    setConsentChoice(choice);
    setVisible(false);
  };

  return (
    <aside
      data-ocid="cookie_consent"
      className="animate-slide-up fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-xl border border-border bg-popover p-5 shadow-elevated"
      aria-label="Cookie and data consent"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Cookie className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-display text-sm font-semibold">
            We value your privacy
          </h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            We use essential cookies and local storage to keep you signed in and
            remember your preferences. We never sell your data. Read our{" "}
            <Link
              to="/cookies"
              data-ocid="cookie_consent_link"
              className="text-primary hover:underline"
            >
              Cookies &amp; Consent
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              data-ocid="cookie_privacy_link"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button
          data-ocid="cookie_decline_button"
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => decide("declined")}
        >
          Decline
        </Button>
        <Button
          data-ocid="cookie_accept_button"
          type="button"
          size="sm"
          onClick={() => decide("accepted")}
        >
          Accept
        </Button>
      </div>
    </aside>
  );
}
