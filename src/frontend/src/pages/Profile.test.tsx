import { ActivityLevel, FitnessGoal, Gender } from "@/backend";
import { type ProfileDraft, ProfileFields } from "@/components/OnboardingFlow";
import Profile from "@/pages/Profile";
import {
  type MockActor,
  createMockActor,
  renderWithProviders,
} from "@/test/mocks";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

let mockActor: MockActor;

beforeEach(() => {
  mockActor = createMockActor();
  // No profile yet: the page should show the onboarding wizard.
  mockActor.getProfile.mockResolvedValue(null);
  mockActor.updateProfile.mockResolvedValue(undefined);
});

describe("Profile onboarding", () => {
  it("shows the onboarding wizard when no profile exists", async () => {
    renderWithProviders(<Profile />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Let's set up your profile")).toBeInTheDocument();
    });
    expect(screen.getByText("Tell us about yourself")).toBeInTheDocument();
  });

  it("requires the step-1 fields before advancing to the next step", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, mockActor);

    await waitFor(() => {
      expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    });

    // Continue is disabled until name, age, and gender are all provided.
    const continueButton = screen.getByRole("button", { name: /continue/i });
    expect(continueButton).toBeDisabled();

    await user.type(screen.getByLabelText("Full name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Age"), "30");
    expect(continueButton).toBeDisabled();

    await user.click(screen.getByText("Female"));
    expect(continueButton).toBeEnabled();

    // Advancing shows the body-metrics step.
    await user.click(continueButton);
    await waitFor(() => {
      expect(screen.getByLabelText("Weight (kg)")).toBeInTheDocument();
    });
    expect(screen.getByText("Your body metrics")).toBeInTheDocument();
  });

  it("visibly highlights the selected gender option card with active styling", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, mockActor);

    await waitFor(() => {
      expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    });

    // Before selection, none of the gender option cards is highlighted: the
    // card uses the default border and lacks the primary fill. The option
    // cards are direct-click buttons (data-ocid `profile.gender_option.N`)
    // rather than Radix RadioGroupItems, per the project learning that sr-only
    // radios do not receive clicks reliably.
    const maleCard = screen
      .getByText("Male")
      .closest("[data-ocid='profile.gender_option.1']");
    expect(maleCard).not.toBeNull();
    expect(maleCard?.className).not.toMatch(/bg-primary\/10/);
    expect(maleCard).not.toHaveAttribute("aria-pressed", "true");

    // Clicking the "Male" option card drives the visible selection: the card
    // gains the primary border/background and the aria-pressed state flips.
    await user.click(screen.getByText("Male"));

    expect(maleCard).toHaveAttribute("aria-pressed", "true");
    expect(maleCard?.className).toMatch(/border-primary /);
    expect(maleCard?.className).toMatch(/bg-primary\/10/);

    // The other gender cards remain unselected (no primary fill, not pressed).
    const femaleCard = screen
      .getByText("Female")
      .closest("[data-ocid='profile.gender_option.2']");
    expect(femaleCard).not.toBeNull();
    expect(femaleCard?.className).not.toMatch(/bg-primary\/10/);
    expect(femaleCard).toHaveAttribute("aria-pressed", "false");
  });

  it("registers a goal selection on step 3 and keeps submit disabled until all fields are set", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Profile />, mockActor);

    // Fill step 1 (name, age, gender) and advance.
    await waitFor(() => {
      expect(screen.getByLabelText("Full name")).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText("Full name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Age"), "30");
    await user.click(screen.getByText("Female"));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Fill step 2 (weight, height) and advance to the goals step.
    await waitFor(() => {
      expect(screen.getByLabelText("Weight (kg)")).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText("Weight (kg)"), "70");
    await user.type(screen.getByLabelText("Height (cm)"), "170");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    // Step 3: the submit button is disabled until goal, activity, and sport
    // are all selected.
    await waitFor(() => {
      expect(screen.getByText("Set your goals")).toBeInTheDocument();
    });
    const submitButton = screen.getByRole("button", {
      name: /create my profile/i,
    });
    expect(submitButton).toBeDisabled();

    // Selecting a goal option registers the selection on the option card via
    // aria-pressed (the cards are direct-click buttons, not radio inputs).
    await user.click(screen.getByText("Lose weight"));
    const loseWeightCard = screen
      .getByText("Lose weight")
      .closest("[data-ocid='profile.goal_option.1']");
    expect(loseWeightCard).not.toBeNull();
    expect(loseWeightCard).toHaveAttribute("aria-pressed", "true");
    expect(loseWeightCard?.className).toMatch(/bg-primary\/10/);

    // Still disabled until activity level and target sport are chosen.
    expect(submitButton).toBeDisabled();
  });

  it("displays the chosen activity level and target sport in the dropdowns after selection", () => {
    // The activity level and target sport are Radix Select dropdowns. Radix
    // Select's content portal does not open reliably under jsdom (its pointer
    // handling and Presence animations need a real layout engine), so driving
    // an open → click → close cycle is unstable here. Instead we render the
    // step-3 `ProfileFields` with a draft that already has the activity level
    // and target sport set — the same state the Select reaches after the user
    // picks an option — and assert the SelectValue displays the chosen value.
    // This is the observable half of the criterion: after a selection, the
    // dropdown shows what was chosen.
    const draft: ProfileDraft = {
      name: "Ada Lovelace",
      age: "30",
      gender: Gender.female,
      weightKg: "70",
      heightCm: "170",
      goal: FitnessGoal.lose,
      activityLevel: ActivityLevel.active,
      targetSport: "Cricket",
    };

    renderWithProviders(
      <ProfileFields draft={draft} onChange={() => {}} step={3} />,
      mockActor,
    );

    // The activity level trigger displays the chosen "Active" value, not the
    // placeholder. The SelectValue renders the selected option's label.
    const activitySelect = screen.getByTestId("profile.activity_select");
    expect(activitySelect).toHaveTextContent("Active");

    // The target sport trigger displays the chosen "Cricket" value.
    const sportSelect = screen.getByTestId("profile.sport_select");
    expect(sportSelect).toHaveTextContent("Cricket");
  });
});
