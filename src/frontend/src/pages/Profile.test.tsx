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
});
