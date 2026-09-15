import Dashboard from "@/pages/Dashboard";
import {
  type MockActor,
  createMockActor,
  renderWithRouter,
} from "@/test/mocks";
import { screen, waitFor } from "@testing-library/react";
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
  goal: "maintain" as const,
  activityLevel: "moderate" as const,
  targetSport: "Cricket",
};

const DIET_TARGET = { calories: 2000n, protein: 150n, carbs: 200n, fat: 67n };

const FOOD_LOG = {
  entries: [],
  totalCalories: 500,
  totalProtein: 30,
  totalCarbs: 40,
  totalFat: 15,
};

const RANK = {
  xp: 250n,
  tier: "bronze" as const,
  level: 1n,
  xpToNextLevel: 750n,
};

const CHALLENGES = [
  {
    id: 1n,
    title: "7-day streak",
    description: "Log activity 7 days in a row",
    target: 7n,
    progress: 2n,
    status: "active" as const,
    rewardPoints: 100n,
    rewardBadge: "Streak Master",
  },
];

beforeEach(() => {
  mockActor = createMockActor();
  mockActor.getProfile.mockResolvedValue(PROFILE);
  mockActor.getDietTarget.mockResolvedValue(DIET_TARGET);
  mockActor.getDailyFoodLog.mockResolvedValue(FOOD_LOG);
  mockActor.getRankInfo.mockResolvedValue(RANK);
  mockActor.getChallenges.mockResolvedValue(CHALLENGES);
});

describe("Dashboard", () => {
  it("renders today's calorie and macro progress against the target", async () => {
    renderWithRouter(<Dashboard />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Calories")).toBeInTheDocument();
    });
    // 500 of 2000 kcal
    await waitFor(() => {
      expect(screen.getByText("of 2000 kcal")).toBeInTheDocument();
    });
    expect(screen.getByText("500")).toBeInTheDocument();
    // Macro labels
    expect(screen.getByText("Protein")).toBeInTheDocument();
    expect(screen.getByText("Carbs")).toBeInTheDocument();
    expect(screen.getByText("Fat")).toBeInTheDocument();
  });

  it("shows the rank tier, level, and XP progress", async () => {
    renderWithRouter(<Dashboard />, mockActor);

    await waitFor(() => {
      expect(screen.getByText(/Bronze · Level 1/)).toBeInTheDocument();
    });
    expect(screen.getByText("250 XP earned")).toBeInTheDocument();
  });

  it("lists active challenges with progress", async () => {
    renderWithRouter(<Dashboard />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("7-day streak")).toBeInTheDocument();
    });
    expect(screen.getByText("2 / 7")).toBeInTheDocument();
    expect(screen.getByText("Streak Master")).toBeInTheDocument();
  });

  it("renders quick actions linking to the main tools", async () => {
    renderWithRouter(<Dashboard />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("AI Diet Coach")).toBeInTheDocument();
    });
    expect(screen.getByText("AI Gym Mentor")).toBeInTheDocument();
    expect(screen.getByText("Calorie Camera")).toBeInTheDocument();
    expect(screen.getByText("Workouts")).toBeInTheDocument();
  });
});
