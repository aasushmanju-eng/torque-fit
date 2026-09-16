import { LegalPage, LegalSection } from "@/components/LegalPage";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="September 16, 2026"
      icon={<ShieldCheck className="size-6" aria-hidden="true" />}
    >
      <LegalSection heading="1. Information We Collect">
        <p>
          Torque Fit collects the information you provide directly, including
          your profile details (name, age, height, weight, fitness goals),
          workout logs, food and calorie entries, chat messages with friends,
          and challenge submissions. We also collect limited technical data such
          as your Internet Identity principal and usage metadata needed to
          operate the service.
        </p>
        <p>
          Your personal data is stored on the Internet Computer blockchain
          within your own canister. We do not sell your personal information to
          third parties.
        </p>
      </LegalSection>

      <LegalSection heading="2. How We Use Your Data">
        <p>
          We use your data to personalize your diet and training plans, track
          your progress, power the AI diet coach and gym mentor, enable
          friend-to-friend messaging and challenges, and improve the product. AI
          coaching responses are generated from your profile and goals to give
          you tailored guidance.
        </p>
      </LegalSection>

      <LegalSection heading="3. Data Storage and Security">
        <p>
          Your data is stored in a decentralized canister on the Internet
          Computer. We apply industry-standard safeguards to protect your
          information, but no method of transmission or storage is completely
          secure. You are responsible for keeping your Internet Identity
          credentials safe.
        </p>
      </LegalSection>

      <LegalSection heading="4. Your Rights">
        <p>
          You may access, correct, or delete your personal data at any time
          through your Profile and account settings. You may also request
          deletion of your account and associated data by contacting support.
          You can withdraw consent for optional data processing at any time.
        </p>
      </LegalSection>

      <LegalSection heading="5. Contact">
        <p>
          If you have questions about this Privacy Policy or your data, please
          contact us through the support channels available in the app.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
