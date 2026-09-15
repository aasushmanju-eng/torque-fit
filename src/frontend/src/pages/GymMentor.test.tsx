import GymMentor from "@/pages/GymMentor";
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

const PROFILE = {
  name: "Ada",
  weightKg: 70,
  heightCm: 170,
  age: 30n,
  gender: "female" as const,
  goal: "lose" as const,
  activityLevel: "moderate" as const,
  targetSport: "Cricket",
};

beforeEach(() => {
  mockActor = createMockActor();
  mockActor.getProfile.mockResolvedValue(PROFILE);
  mockActor.chat.mockResolvedValue({
    reply: "Focus on your front foot drive and keep your head still.",
  });
});

describe("GymMentor", () => {
  it("shows the coach tabs and defaults to the gym mentor", async () => {
    renderWithProviders(<GymMentor />, mockActor);

    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: "Gym Mentor" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("tab", { name: "Cricket" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Football" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Basketball" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Swimming" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Gym Mentor" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches to the cricket coach and sends a sport-specific message with the user's profile", async () => {
    const user = userEvent.setup();
    renderWithProviders(<GymMentor />, mockActor);

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Cricket" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("tab", { name: "Cricket" }));

    // Cricket-specific empty state and suggestions appear.
    await waitFor(() => {
      expect(
        screen.getByText("Drills to improve my batting timing"),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("How do I bowl a consistent line and length?"),
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Message Cricket"),
      "How do I bowl a consistent line and length?",
    );
    await user.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockActor.chat).toHaveBeenCalledWith({
        coach: "cricket",
        message: "How do I bowl a consistent line and length?",
        profile: { age: 30n, goal: "lose", weightKg: 70, gender: "female" },
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "Focus on your front foot drive and keep your head still.",
        ),
      ).toBeInTheDocument();
    });
  });
});
