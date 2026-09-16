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
  mockActor.listWorkoutReminders.mockResolvedValue([]);
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

  it("schedules a workout reminder for chosen days and time", async () => {
    mockActor.addWorkoutReminder.mockResolvedValue(1n);
    const user = userEvent.setup();
    renderWithProviders(<Workouts />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("No reminders scheduled")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add reminder/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Reminder title")).toBeInTheDocument();
    });
    await user.type(screen.getByLabelText("Reminder title"), "Morning lift");
    await user.click(screen.getByLabelText("Monday"));
    await user.click(screen.getByTestId("reminder_save_button"));

    await waitFor(() => {
      expect(mockActor.addWorkoutReminder).toHaveBeenCalledWith(
        [0n],
        420n,
        "Morning lift",
      );
    });
  });

  it("edits an existing workout reminder", async () => {
    mockActor.listWorkoutReminders.mockResolvedValue([
      { id: 1n, title: "Morning lift", days: [0n], timeMinutes: 420n },
    ]);
    mockActor.updateWorkoutReminder.mockResolvedValue({
      __kind__: "ok",
      ok: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<Workouts />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Morning lift")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /edit reminder morning lift/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Reminder title")).toBeInTheDocument();
    });
    await user.clear(screen.getByLabelText("Reminder title"));
    await user.type(screen.getByLabelText("Reminder title"), "Evening run");
    await user.click(screen.getByTestId("reminder_save_button"));

    await waitFor(() => {
      expect(mockActor.updateWorkoutReminder).toHaveBeenCalledWith(
        1n,
        [0n],
        420n,
        "Evening run",
      );
    });
  });

  it("removes a workout reminder", async () => {
    mockActor.listWorkoutReminders.mockResolvedValue([
      { id: 1n, title: "Morning lift", days: [0n], timeMinutes: 420n },
    ]);
    mockActor.removeWorkoutReminder.mockResolvedValue({
      __kind__: "ok",
      ok: null,
    });
    const user = userEvent.setup();
    renderWithProviders(<Workouts />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Morning lift")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", {
        name: /delete reminder morning lift/i,
      }),
    );

    await waitFor(() => {
      expect(mockActor.removeWorkoutReminder).toHaveBeenCalledWith(1n);
    });
  });
});
