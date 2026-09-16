import { LegalPage, LegalSection } from "@/components/LegalPage";
import { CreditCard } from "lucide-react";

export default function PricingPage() {
  return (
    <LegalPage
      title="Pricing & Billing"
      updated="September 16, 2026"
      icon={<CreditCard className="size-6" aria-hidden="true" />}
    >
      <LegalSection heading="Plans">
        <p>
          Torque Fit offers a free tier and optional premium plans that unlock
          advanced features such as unlimited AI coaching, detailed analytics,
          and priority support. Current plan pricing is displayed in the app
          before you subscribe.
        </p>
      </LegalSection>

      <LegalSection heading="Billing Terms">
        <p>
          Premium subscriptions are billed in advance on a recurring basis
          (monthly or annually, depending on the plan you select). You will be
          charged at the start of each billing period until you cancel. Prices
          are shown in your local currency where supported.
        </p>
      </LegalSection>

      <LegalSection heading="Cancellation and Refunds">
        <p>
          You may cancel your subscription at any time from your account
          settings. Cancellation takes effect at the end of the current billing
          period, and you will retain access until then. Refunds are issued at
          our discretion in accordance with applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="Payment Security">
        <p>
          Payments are processed by our payment providers using industry-
          standard encryption. We do not store your full payment card details on
          our servers.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
