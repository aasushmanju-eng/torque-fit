import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { type ReactNode, createElement } from "react";
import { vi } from "vitest";

/**
 * A typed mock of the backend actor surface the app's hooks call. Tests fill
 * in the methods they exercise; anything left undefined resolves to a no-op
 * that returns undefined so a component that calls it does not crash.
 */
export type MockActor = {
  getProfile: ReturnType<typeof vi.fn>;
  updateProfile: ReturnType<typeof vi.fn>;
  getDietTarget: ReturnType<typeof vi.fn>;
  getDailyFoodLog: ReturnType<typeof vi.fn>;
  getRankInfo: ReturnType<typeof vi.fn>;
  getChallenges: ReturnType<typeof vi.fn>;
  getRewards: ReturnType<typeof vi.fn>;
  getWorkouts: ReturnType<typeof vi.fn>;
  logWorkout: ReturnType<typeof vi.fn>;
  logFood: ReturnType<typeof vi.fn>;
  searchFoodByBarcode: ReturnType<typeof vi.fn>;
  searchUsers: ReturnType<typeof vi.fn>;
  sendFriendRequest: ReturnType<typeof vi.fn>;
  respondToFriendRequest: ReturnType<typeof vi.fn>;
  getFriendRequests: ReturnType<typeof vi.fn>;
  getFriends: ReturnType<typeof vi.fn>;
  chat: ReturnType<typeof vi.fn>;
  getChallengeProofs: ReturnType<typeof vi.fn>;
  submitChallengeProof: ReturnType<typeof vi.fn>;
  getConversation: ReturnType<typeof vi.fn>;
  getConversations: ReturnType<typeof vi.fn>;
  sendMessage: ReturnType<typeof vi.fn>;
  listWorkoutReminders: ReturnType<typeof vi.fn>;
  addWorkoutReminder: ReturnType<typeof vi.fn>;
  updateWorkoutReminder: ReturnType<typeof vi.fn>;
  removeWorkoutReminder: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
};

export function createMockActor(): MockActor {
  return {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getDietTarget: vi.fn(),
    getDailyFoodLog: vi.fn(),
    getRankInfo: vi.fn(),
    getChallenges: vi.fn(),
    getRewards: vi.fn(),
    getWorkouts: vi.fn(),
    logWorkout: vi.fn(),
    logFood: vi.fn(),
    searchFoodByBarcode: vi.fn(),
    searchUsers: vi.fn(),
    sendFriendRequest: vi.fn(),
    respondToFriendRequest: vi.fn(),
    getFriendRequests: vi.fn(),
    getFriends: vi.fn(),
    chat: vi.fn(),
    getChallengeProofs: vi.fn(),
    submitChallengeProof: vi.fn(),
    getConversation: vi.fn(),
    getConversations: vi.fn(),
    sendMessage: vi.fn(),
    listWorkoutReminders: vi.fn(),
    addWorkoutReminder: vi.fn(),
    updateWorkoutReminder: vi.fn(),
    removeWorkoutReminder: vi.fn(),
  };
}

export function renderWithProviders(ui: ReactNode, _actor: MockActor) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

/**
 * Renders a component inside both a QueryClient and a real TanStack Router so
 * that `Link` and other router hooks used by pages resolve. The component is
 * mounted as the root route's content.
 */
export function renderWithRouter(ui: ReactNode, _actor: MockActor) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const rootRoute = createRootRoute({ component: () => ui });
  const router = createRouter({ routeTree: rootRoute });
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RouterProvider, { router }),
    ),
  );
}
