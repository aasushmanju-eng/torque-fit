import { LegalPage, LegalSection } from "@/components/LegalPage";
import { ScrollText } from "lucide-react";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="September 16, 2026"
      icon={<ScrollText className="size-6" aria-hidden="true" />}
    >
      <LegalSection heading="1. Acceptance of Terms">
        <p>
          By creating an account or using Torque Fit, you agree to these Terms
          of Service. If you do not agree, please do not use the service. These
          terms form a binding agreement between you and Torque Fit.
        </p>
      </LegalSection>

      <LegalSection heading="2. Acceptable Use">
        <p>
          You agree to use Torque Fit only for lawful purposes and in a way that
          does not infringe the rights of others. You may not use the service to
          harass, threaten, or impersonate others, to post inappropriate or
          misleading content, or to attempt to disrupt or compromise the
          security of the platform.
        </p>
      </LegalSection>

      <LegalSection heading="3. Account Rules">
        <p>
          You are responsible for maintaining the confidentiality of your
          account credentials and for all activity that occurs under your
          account. You must provide accurate information and keep your profile
          up to date. We may suspend or terminate accounts that violate these
          terms.
        </p>
      </LegalSection>

      <LegalSection heading="4. Intellectual Property">
        <p>
          The Torque Fit name, logo, and all software, design, and content are
          owned by Torque Fit or its licensors. You may not copy, modify,
          distribute, or create derivative works from the service without
          permission, except as permitted by applicable open-source licenses.
        </p>
      </LegalSection>

      <LegalSection heading="5. Termination">
        <p>
          You may stop using the service at any time. We may suspend or
          terminate your access if you breach these terms. Upon termination,
          your right to use the service ends, and we may delete your data in
          accordance with our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection heading="6. Changes to These Terms">
        <p>
          We may update these terms from time to time. We will notify you of
          material changes. Continued use of the service after changes take
          effect constitutes acceptance of the revised terms.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
