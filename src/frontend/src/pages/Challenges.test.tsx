import Challenges from "@/pages/Challenges";
import {
  type MockActor,
  createMockActor,
  renderWithProviders,
} from "@/test/mocks";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

let mockActor: MockActor;

const ACTIVE_CHALLENGES = [
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

const COMPLETED_CHALLENGES = [
  {
    id: 2n,
    title: "First workout",
    description: "Log your first workout",
    target: 1n,
    progress: 1n,
    status: "completed" as const,
    rewardPoints: 50n,
    rewardBadge: "First Steps",
  },
];

const REWARDS = [
  {
    id: 1n,
    badge: "First Steps",
    points: 50n,
    earnedAtNs: 1700000000000000000n,
  },
];

beforeEach(() => {
  mockActor = createMockActor();
  mockActor.getChallenges.mockResolvedValue([
    ...ACTIVE_CHALLENGES,
    ...COMPLETED_CHALLENGES,
  ]);
  mockActor.getRewards.mockResolvedValue(REWARDS);
});

describe("Challenges", () => {
  it("shows active challenges with progress and reward", async () => {
    renderWithProviders(<Challenges />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("7-day streak")).toBeInTheDocument();
    });
    expect(screen.getByText("2 / 7")).toBeInTheDocument();
    expect(screen.getByText("Streak Master")).toBeInTheDocument();
    expect(screen.getByText("1 active")).toBeInTheDocument();
  });

  it("shows completed challenges and the rewards collection", async () => {
    renderWithProviders(<Challenges />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("First workout")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    // "First Steps" appears both as the completed challenge's reward badge and
    // as the reward in the collection, so assert it is present at least once.
    expect(screen.getAllByText("First Steps").length).toBeGreaterThan(0);
    expect(screen.getByText("1 earned")).toBeInTheDocument();
  });
});
