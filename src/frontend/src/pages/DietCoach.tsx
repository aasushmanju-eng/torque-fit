import { CoachType, createActor } from "@/backend";
import type { Profile, UserProfile } from "@/backend";
import { ChatWindow } from "@/components/ChatWindow";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Flame, Salad, Target, UserRound } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "What should I eat for breakfast to hit my protein target?",
  "I'm craving something sweet — what's a healthy option?",
  "Plan a high-protein dinner under 600 calories.",
  "How do I stay on track when eating out?",
];

function buildUserProfile(profile: Profile | null): UserProfile {
  if (!profile) {
    return { age: 30n, goal: "maintain", weightKg: 70, gender: "other" };
  }
  return {
    age: profile.age,
    goal: profile.goal,
    weightKg: profile.weightKg,
    gender: profile.gender,
  };
}

function goalLabel(goal: string): string {
  switch (goal) {
    case "lose":
      return "Lose weight";
    case "gain":
      return "Gain muscle";
    default:
      return "Maintain";
  }
}

function genderLabel(gender: string): string {
  switch (gender) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    default:
      return "Other";
  }
}

function DailyTargetCard({
  calories,
  protein,
  carbs,
  fat,
  loading,
}: {
  calories: bigint | undefined;
  protein: bigint | undefined;
  carbs: bigint | undefined;
  fat: bigint | undefined;
  loading: boolean;
}) {
  const rows = [
    { label: "Protein", value: protein, unit: "g", color: "bg-primary" },
    { label: "Carbs", value: carbs, unit: "g", color: "bg-chart-2" },
    { label: "Fat", value: fat, unit: "g", color: "bg-chart-3" },
  ];

  return (
    <Card
      data-ocid="diet_target_card"
      className="hover-lift bg-glow-primary focus-ring"
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Target className="size-4" aria-hidden="true" />
          </span>
          <CardTitle className="font-display text-base">Daily Target</CardTitle>
        </div>
        <CardDescription>Your personalized macro goals</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
          <Flame className="size-6 text-primary" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Calories
            </span>
            {loading ? (
              <Skeleton className="mt-1 h-6 w-20 animate-shimmer" />
            ) : (
              <span className="font-display text-2xl font-bold text-primary">
                {calories?.toString() ?? "—"}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                {loading ? (
                  <Skeleton className="h-4 w-12 animate-shimmer" />
                ) : (
                  <span className="font-medium">
                    {row.value?.toString() ?? "—"}
                    <span className="ml-0.5 text-xs text-muted-foreground">
                      {row.unit}
                    </span>
                  </span>
                )}
              </div>
              {loading ? (
                <Skeleton className="h-2 w-full animate-shimmer" />
              ) : (
                <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
                  <div
                    className={`h-full rounded-full ${row.color}`}
                    style={{
                      width: `${Math.min(
                        100,
                        Number((row.value ?? 0n) / 10n),
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileCard({ profile }: { profile: Profile | null }) {
  const rows = [
    { label: "Weight", value: profile ? `${profile.weightKg} kg` : "—" },
    { label: "Age", value: profile ? `${profile.age.toString()}` : "—" },
    { label: "Gender", value: profile ? genderLabel(profile.gender) : "—" },
    { label: "Goal", value: profile ? goalLabel(profile.goal) : "—" },
  ];

  return (
    <Card data-ocid="profile_card" className="hover-lift focus-ring">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <UserRound className="size-4" aria-hidden="true" />
          </span>
          <CardTitle className="font-display text-base">Your Profile</CardTitle>
        </div>
        <CardDescription>
          The coach personalizes advice to these details
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DietCoach() {
  const { actor, isFetching } = useActor(createActor);

  const targetQuery = useQuery({
    queryKey: ["dietTarget"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDietTarget();
    },
    enabled: !!actor && !isFetching,
  });

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProfile();
    },
    enabled: !!actor && !isFetching,
  });

  const userProfile = buildUserProfile(profileQuery.data ?? null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error("Backend is not ready");
      const res = await actor.chat({
        coach: CoachType.diet,
        message,
        profile: userProfile,
      });
      return res.reply;
    },
  });

  const handleSend = (message: string) => chatMutation.mutateAsync(message);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex animate-rise flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Salad className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            AI Diet Coach
          </h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Personalized nutrition guidance tuned to your weight, age, gender, and
          goals. Tell the coach what you ate, what you&apos;re craving, or ask
          for a plan — it listens and responds to you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="animate-slide-up">
          <ChatWindow
            onSend={handleSend}
            suggestedPrompts={SUGGESTED_PROMPTS}
            title="Diet Coach"
            subtitle="Personalized · listens to you"
            emptyTitle="How can I help you eat better today?"
            emptyDescription="Ask about meals, cravings, portion sizes, or a full day of eating. The coach tailors every answer to your body and goals."
            placeholder="Ask your diet coach anything…"
          />
        </div>

        <div className="stagger flex flex-col gap-6">
          <DailyTargetCard
            calories={targetQuery.data?.calories}
            protein={targetQuery.data?.protein}
            carbs={targetQuery.data?.carbs}
            fat={targetQuery.data?.fat}
            loading={targetQuery.isLoading}
          />
          <ProfileCard profile={profileQuery.data ?? null} />
        </div>
      </div>
    </div>
  );
}
