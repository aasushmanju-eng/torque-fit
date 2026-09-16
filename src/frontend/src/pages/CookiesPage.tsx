import { LegalPage, LegalSection } from "@/components/LegalPage";
import { Cookie } from "lucide-react";

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies & Data Consent"
      updated="September 16, 2026"
      icon={<Cookie className="size-6" aria-hidden="true" />}
    >
      <LegalSection heading="What Are Cookies?">
        <p>
          Cookies are small data files stored on your device that help
          applications remember your preferences and improve your experience.
          Torque Fit uses a minimal set of cookies and local storage to keep you
          signed in and remember your consent choices.
        </p>
      </LegalSection>

      <LegalSection heading="How We Use Cookies">
        <p>
          We use essential cookies and local storage to maintain your session
          and store your preferences, such as your cookie consent choice. We do
          not use third-party advertising cookies, and we do not sell your data
          to advertisers.
        </p>
      </LegalSection>

      <LegalSection heading="Your Consent Choices">
        <p>
          On your first visit, you will see a consent notice asking whether you
          accept the use of cookies and data processing described in our Privacy
          Policy. You may accept or decline. Declining may limit some
          non-essential features, but core functionality will continue to work.
        </p>
      </LegalSection>

      <LegalSection heading="Managing Your Preferences">
        <p>
          You can change your consent choice at any time by clearing your
          browser&apos;s local storage for this site or by contacting support.
          Your choice is stored locally on your device and applies to this
          browser only.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
