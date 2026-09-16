import { LegalPage, LegalSection } from "@/components/LegalPage";
import { Scale } from "lucide-react";

export default function IpPage() {
  return (
    <LegalPage
      title="IP, Trademark & Compliance"
      updated="September 16, 2026"
      icon={<Scale className="size-6" aria-hidden="true" />}
    >
      <LegalSection heading="Trademarks">
        <p>
          The Torque Fit name, logo, and related marks are trademarks of Torque
          Fit. You may not use these marks without our prior written permission,
          except to refer to the product in a nominative, non-confusing manner.
        </p>
      </LegalSection>

      <LegalSection heading="Copyright">
        <p>
          All software, design, text, graphics, and other content in Torque Fit
          are protected by copyright and owned by Torque Fit or its licensors.
          Unauthorized reproduction or distribution is prohibited.
        </p>
      </LegalSection>

      <LegalSection heading="Open-Source Compliance">
        <p>
          Torque Fit is built on the Internet Computer and incorporates
          open-source software. We comply with the licenses of all included
          open-source components, including attribution and license notices
          where required. Source code for applicable components is available
          under their respective licenses.
        </p>
      </LegalSection>

      <LegalSection heading="Reporting Infringement">
        <p>
          If you believe content in the app infringes your intellectual property
          rights, please contact us with details of the alleged infringement,
          and we will review it promptly.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
