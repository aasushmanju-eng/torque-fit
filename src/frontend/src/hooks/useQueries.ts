import {
  type Challenge,
  type DailyFoodLog,
  type DietTarget,
  type Exercise,
  type FriendRequest,
  type FriendView,
  type Profile,
  type RankInfo,
  type Reward,
  type SearchResult,
  type Workout,
  createActor,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Fetch the caller's saved profile, or null when none exists yet. */
export function useProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Create or update the caller's profile, then refresh the cached profile. */
export function useUpdateProfile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateProfile(profile);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

/** Fetch the caller's active and completed challenges. */
export function useChallenges() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async (): Promise<Challenge[]> => {
      if (!actor) return [];
      return actor.getChallenges();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch the caller's earned rewards. */
export function useRewards() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["rewards"],
    queryFn: async (): Promise<Reward[]> => {
      if (!actor) return [];
      return actor.getRewards();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch today's food log totals. */
export function useDailyFoodLog() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dailyFoodLog"],
    queryFn: async (): Promise<DailyFoodLog | null> => {
      if (!actor) return null;
      return actor.getDailyFoodLog();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch the caller's daily macro targets. */
export function useDietTarget() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dietTarget"],
    queryFn: async (): Promise<DietTarget | null> => {
      if (!actor) return null;
      return actor.getDietTarget();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch the caller's rank, tier, and XP progress. */
export function useRankInfo() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["rankInfo"],
    queryFn: async (): Promise<RankInfo | null> => {
      if (!actor) return null;
      return actor.getRankInfo();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch incoming friend requests. */
export function useFriendRequests() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["friendRequests"],
    queryFn: async (): Promise<FriendRequest[]> => {
      if (!actor) return [];
      return actor.getFriendRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Fetch the caller's friends with rank and challenge progress. */
export function useFriends() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["friends"],
    queryFn: async (): Promise<FriendView[]> => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Accept or decline an incoming friend request. */
export function useRespondToFriendRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      from,
      accept,
    }: {
      from: Principal;
      accept: boolean;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.respondToFriendRequest(from, accept);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
      void queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

/** Search for athletes by name. */
export function useSearchUsers(term: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["users", term],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!actor) return [];
      return actor.searchUsers(term);
    },
    enabled: !!actor && !isFetching && term.trim().length > 0,
  });
}

/** Send a friend request to another athlete, then refresh friends and requests. */
export function useSendFriendRequest() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (to: Principal) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.sendFriendRequest(to);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
      void queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
  });
}

/** Fetch the caller's logged workouts. */
export function useWorkouts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["workouts"],
    queryFn: async (): Promise<Workout[]> => {
      if (!actor) return [];
      return actor.getWorkouts();
    },
    enabled: !!actor && !isFetching,
  });
}

/** Log a new workout, then refresh the workout history. */
export function useLogWorkout() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      exercises,
    }: {
      title: string;
      exercises: Exercise[];
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.logWorkout(title, exercises);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["workouts"] });
    },
  });
}
