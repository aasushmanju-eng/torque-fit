import DietCoach from "@/pages/DietCoach";
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

const DIET_TARGET = { calories: 1800n, protein: 135n, carbs: 180n, fat: 60n };

beforeEach(() => {
  mockActor = createMockActor();
  mockActor.getProfile.mockResolvedValue(PROFILE);
  mockActor.getDietTarget.mockResolvedValue(DIET_TARGET);
  mockActor.chat.mockResolvedValue({
    reply: "Given your goal to lose weight, aim for a high-protein breakfast.",
  });
});

describe("DietCoach", () => {
  it("shows the personalized daily target and profile", async () => {
    renderWithProviders(<DietCoach />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Daily Target")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText("1800")).toBeInTheDocument();
    });
    expect(screen.getByText("70 kg")).toBeInTheDocument();
    expect(screen.getByText("Lose weight")).toBeInTheDocument();
  });

  it("sends the user's message to the diet coach with their profile and shows the reply", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DietCoach />, mockActor);

    await waitFor(() => {
      expect(screen.getByLabelText("Message your coach")).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText("Message your coach"),
      "What should I eat for breakfast?",
    );
    await user.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockActor.chat).toHaveBeenCalledWith({
        coach: "diet",
        message: "What should I eat for breakfast?",
        profile: { age: 30n, goal: "lose", weightKg: 70, gender: "female" },
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "Given your goal to lose weight, aim for a high-protein breakfast.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows a clear error and retries the coach call when it fails", async () => {
    mockActor.chat
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ reply: "Retried successfully." });
    const user = userEvent.setup();
    renderWithProviders(<DietCoach />, mockActor);

    await waitFor(() => {
      expect(screen.getByLabelText("Message your coach")).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText("Message your coach"),
      "What should I eat?",
    );
    await user.click(screen.getByLabelText("Send message"));

    // The failed call surfaces a clear error and a retry action.
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
    expect(screen.getByText("Couldn't reach the coach.")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /retry/i })[0]);

    // Retrying re-sends the same message and shows the new reply.
    await waitFor(() => {
      expect(screen.getByText("Retried successfully.")).toBeInTheDocument();
    });
    expect(mockActor.chat).toHaveBeenCalledTimes(2);
  });
});
