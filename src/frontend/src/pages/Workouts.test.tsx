import Workouts from "@/pages/Workouts";
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
  mockActor.getWorkouts.mockResolvedValue([]);
  mockActor.logWorkout.mockResolvedValue(undefined);
});

describe("Workouts", () => {
  it("shows the empty state when no workouts are logged", async () => {
    renderWithProviders(<Workouts />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("No workouts logged yet")).toBeInTheDocument();
    });
    expect(screen.getByText("0 sessions")).toBeInTheDocument();
  });

  it("logs a workout with title and exercises", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Workouts />, mockActor);

    await waitFor(() => {
      expect(screen.getByLabelText("Workout title")).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText("Workout title"),
      "Upper body strength",
    );
    await user.type(
      screen.getByPlaceholderText("Exercise name"),
      "Bench Press",
    );
    await user.type(screen.getByLabelText("Sets"), "3");
    await user.type(screen.getByLabelText("Reps"), "10");
    await user.type(screen.getByLabelText("Weight (kg)"), "50");

    await user.click(screen.getByRole("button", { name: /save workout/i }));

    await waitFor(() => {
      expect(mockActor.logWorkout).toHaveBeenCalledWith("Upper body strength", [
        {
          name: "Bench Press",
          sets: [
            { reps: 10n, weightKg: 50 },
            { reps: 10n, weightKg: 50 },
            { reps: 10n, weightKg: 50 },
          ],
        },
      ]);
    });
  });
});
