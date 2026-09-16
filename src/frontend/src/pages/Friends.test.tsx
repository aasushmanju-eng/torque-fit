import Friends from "@/pages/Friends";
import {
  type MockActor,
  createMockActor,
  renderWithProviders,
} from "@/test/mocks";
import { Principal } from "@icp-sdk/core/principal";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
  useInternetIdentity: () => ({ identity: null }),
}));

let mockActor: MockActor;

const ALICE = Principal.fromText("aaaaa-aa");
const BOB = Principal.anonymous();

const SEARCH_RESULTS = [
  {
    principal: ALICE,
    profile: {
      name: "Alice",
      age: 28n,
      goal: "maintain",
      weightKg: 60,
      gender: "female",
      activityLevel: "moderate",
      heightCm: 165,
      targetSport: "Cricket",
    },
  },
];

const FRIEND_VIEW = {
  principal: BOB,
  name: "Bob Builder",
  rank: { xp: 120n, tier: "bronze", level: 1n, xpToNextLevel: 880n },
  challengeProgress: [],
};

const INCOMING_REQUEST = {
  from: ALICE,
  to: BOB,
  status: "pending",
};

beforeEach(() => {
  mockActor = createMockActor();
  mockActor.searchUsers.mockResolvedValue(SEARCH_RESULTS);
  mockActor.sendFriendRequest.mockResolvedValue({ __kind__: "ok", ok: null });
  mockActor.getFriendRequests.mockResolvedValue([]);
  mockActor.respondToFriendRequest.mockResolvedValue({
    __kind__: "ok",
    ok: null,
  });
  mockActor.getFriends.mockResolvedValue([]);
  mockActor.getConversation.mockResolvedValue([]);
  mockActor.sendMessage.mockResolvedValue({ __kind__: "ok", ok: null });
});

describe("Friends", () => {
  it("searches for athletes and shows the matching profile", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Friends />, mockActor);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Search athletes by name"),
      ).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Search athletes by name"), "Alice");
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(mockActor.searchUsers).toHaveBeenCalledWith("Alice");
    });
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
    expect(screen.getByText("Cricket")).toBeInTheDocument();
  });

  it("sends a friend request and marks the athlete as requested", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Friends />, mockActor);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Search athletes by name"),
      ).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText("Search athletes by name"), "Alice");
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add friend/i }));

    await waitFor(() => {
      expect(mockActor.sendFriendRequest).toHaveBeenCalledWith(ALICE);
    });
    await waitFor(() => {
      expect(screen.getByText("Request sent")).toBeInTheDocument();
    });
  });

  it("shows incoming requests and accepts one", async () => {
    mockActor.getFriendRequests.mockResolvedValue([INCOMING_REQUEST]);
    const user = userEvent.setup();
    renderWithProviders(<Friends />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Wants to train with you")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /accept/i }));

    await waitFor(() => {
      expect(mockActor.respondToFriendRequest).toHaveBeenCalledWith(
        ALICE,
        true,
      );
    });
  });

  it("renders the friends list with rank tier and level", async () => {
    mockActor.getFriends.mockResolvedValue([FRIEND_VIEW]);
    renderWithProviders(<Friends />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    });
    expect(screen.getByText(/Bronze · Level 1/)).toBeInTheDocument();
    expect(screen.getByText("120 XP")).toBeInTheDocument();
  });

  it("opens a chat from a friend's card, shows the empty state, and sends a message", async () => {
    mockActor.getFriends.mockResolvedValue([FRIEND_VIEW]);
    const user = userEvent.setup();
    renderWithProviders(<Friends />, mockActor);

    await waitFor(() => {
      expect(screen.getByText("Bob Builder")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /message/i }));

    await waitFor(() => {
      expect(screen.getByText("No messages yet")).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText("Message Bob Builder"),
      "Ready for a session?",
    );
    await user.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(mockActor.sendMessage).toHaveBeenCalledWith(
        BOB,
        "Ready for a session?",
      );
    });
  });
});
