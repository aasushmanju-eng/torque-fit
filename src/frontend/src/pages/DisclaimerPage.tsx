import { LegalPage, LegalSection } from "@/components/LegalPage";
import { HeartPulse } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Health & Fitness Disclaimer"
      updated="September 16, 2026"
      icon={<HeartPulse className="size-6" aria-hidden="true" />}
    >
      <LegalSection heading="Not Medical Advice">
        <p>
          Torque Fit provides fitness, nutrition, and wellness information for
          general educational purposes only. It is not a substitute for
          professional medical advice, diagnosis, or treatment. Always seek the
          advice of your physician or another qualified health provider with any
          questions you may have regarding a medical condition.
        </p>
      </LegalSection>

      <LegalSection heading="Consult Your Doctor">
        <p>
          Before beginning any exercise program or making significant changes to
          your diet, consult your doctor, especially if you are pregnant,
          nursing, have a chronic condition, take medication, or have not
          exercised in a long time. Never disregard professional medical advice
          because of something you read in this app.
        </p>
      </LegalSection>

      <LegalSection heading="Exercise at Your Own Risk">
        <p>
          Exercise carries inherent risk of injury. You are responsible for
          performing exercises with proper form and within your own limits. Stop
          immediately if you experience pain, dizziness, or shortness of breath.
          Torque Fit is not liable for injuries or health issues resulting from
          your use of the app.
        </p>
      </LegalSection>

      <LegalSection heading="Emergency Situations">
        <p>
          If you are experiencing a medical emergency, call your local emergency
          services immediately. Do not rely on this app for emergency
          assistance.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
