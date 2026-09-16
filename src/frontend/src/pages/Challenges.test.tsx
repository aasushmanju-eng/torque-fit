import Challenges from "@/pages/Challenges";
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
  useInternetIdentity: () => ({ identity: null }),
}));

vi.mock("@caffeineai/camera", () => ({
  useCamera: () => ({
    isActive: false,
    isSupported: true,
    isLoading: false,
    error: null,
    startCamera: vi.fn().mockResolvedValue(true),
    stopCamera: vi.fn().mockResolvedValue(undefined),
    capturePhoto: vi.fn().mockResolvedValue(null),
    switchCamera: vi.fn().mockResolvedValue(true),
    videoRef: { current: null },
    canvasRef: { current: null },
  }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
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
  {
    id: 3n,
    title: "Run 5K",
    description: "Complete a 5K run",
    target: 1n,
    progress: 0n,
    status: "active" as const,
    rewardPoints: 75n,
    rewardBadge: "Runner",
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
  mockActor.getChallengeProofs.mockResolvedValue([]);
});

describe("Challenges", () => {
  it("shows active challenges with progress and reward", async () => {
    renderWithProviders(<Challenges />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("7-day streak")).toBeInTheDocument();
    });
    expect(screen.getByText("2 / 7")).toBeInTheDocument();
    expect(screen.getByText("Streak Master")).toBeInTheDocument();
    expect(screen.getByText("2 active")).toBeInTheDocument();
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

  it("shows the 7-day streak challenge as auto-tracked with no photo proof button", async () => {
    renderWithProviders(<Challenges />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("7-day streak")).toBeInTheDocument();
    });

    // The streak challenge card renders the auto-tracking status footer and
    // does NOT render a photo proof button — the backend rejects proof
    // submission for it, so the UI must not offer one.
    const streakCard = screen
      .getByText("7-day streak")
      .closest("[data-ocid='challenge_card']");
    expect(streakCard).not.toBeNull();
    expect(
      streakCard?.querySelector("[data-ocid='streak_auto_status']"),
    ).not.toBeNull();
    expect(
      streakCard?.querySelector("[data-ocid='proof_open_button']"),
    ).toBeNull();
    expect(screen.getByText(/auto-tracked/i)).toBeInTheDocument();
    expect(screen.getByText(/No photo needed/i)).toBeInTheDocument();
  });

  it("opens the proof dialog from a non-streak active challenge and shows the camera start action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Challenges />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Run 5K")).toBeInTheDocument();
    });

    // The non-streak 5K challenge carries a photo proof CTA. Scope the click
    // to its card so it is unambiguous against the streak card, which has none.
    const runCard = screen
      .getByText("Run 5K")
      .closest("[data-ocid='challenge_card']");
    const proofButton = runCard?.querySelector(
      "[data-ocid='proof_open_button']",
    );
    expect(proofButton).not.toBeNull();
    await user.click(proofButton as HTMLElement);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /start camera/i }),
      ).toBeInTheDocument();
    });
    expect(
      screen.getByRole("heading", { name: "Submit proof" }),
    ).toBeInTheDocument();
  });

  it("shows a non-streak active challenge with its proof button and a submitted-proof badge once a proof exists", async () => {
    // A non-streak challenge (the 5K run) carries a submitted proof, so its
    // card shows the "Proof submitted" badge and a "View / resubmit" action
    // instead of the default "Submit proof" CTA. This is the working
    // photo-proof flow that should remain unchanged.
    mockActor.getChallengeProofs.mockImplementation((id: bigint) =>
      Promise.resolve(
        id === 3n
          ? [
              {
                id: 1n,
                challengeId: 3n,
                proofRef: "hash-5k",
                submittedAtNs: 1700000000000000000n,
              },
            ]
          : Promise.resolve([]),
      ),
    );
    renderWithProviders(<Challenges />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Run 5K")).toBeInTheDocument();
    });
    expect(screen.getByText("Runner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Proof submitted")).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /view \/ resubmit/i }),
    ).toBeInTheDocument();
  });
});
