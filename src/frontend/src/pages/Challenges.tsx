import { ChallengeStatus } from "@/backend";
import type { Challenge, Reward } from "@/backend";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useChallenges, useRewards } from "@/hooks/useQueries";
import { timestampToDate } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Award,
  CheckCircle2,
  Dumbbell,
  Flame,
  Medal,
  Sparkles,
  Target,
  Trophy,
  Utensils,
} from "lucide-react";

function challengeIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("streak")) return Flame;
  if (t.includes("meal") || t.includes("log")) return Utensils;
  if (t.includes("workout") || t.includes("gym")) return Dumbbell;
  return Target;
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const Icon = challengeIcon(challenge.title);
  const pct =
    challenge.target > 0n
      ? Math.min(
          100,
          Math.round(
            (Number(challenge.progress) / Number(challenge.target)) * 100,
          ),
        )
      : 0;
  const completed = challenge.status === ChallengeStatus.completed;

  return (
    <Card
      data-ocid="challenge_card"
      className={cn(
        "bg-glow-primary transition-smooth hover:border-primary/40",
        completed && "border-success/40",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-xl",
                completed
                  ? "bg-success/15 text-success"
                  : "bg-primary/15 text-primary",
              )}
            >
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <CardTitle className="font-display text-base">
                {challenge.title}
              </CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </div>
          </div>
          {completed ? (
            <Badge
              variant="secondary"
              className="border-success/40 bg-success/15 text-success"
            >
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Completed
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {Number(challenge.progress)} / {Number(challenge.target)}
          </span>
          <span className="font-medium text-primary">{pct}%</span>
        </div>
        <Progress value={pct} data-ocid="challenge_progress" />
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Award className="size-4 text-primary" aria-hidden="true" />
          <span>
            Reward:{" "}
            <span className="font-medium text-foreground">
              {challenge.rewardBadge}
            </span>{" "}
            · {Number(challenge.rewardPoints)} pts
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function RewardCard({ reward }: { reward: Reward }) {
  const date = timestampToDate(reward.earnedAtNs);
  return (
    <div
      data-ocid="reward_item"
      className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center transition-smooth hover:border-primary/40"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Medal className="size-7" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-display text-sm font-semibold">
          {reward.badge}
        </span>
        <span className="text-xs text-muted-foreground">
          {Number(reward.points)} pts
        </span>
        {date && (
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

function ChallengeSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  );
}

export default function Challenges() {
  const { data: challenges, isLoading: challengesLoading } = useChallenges();
  const { data: rewards, isLoading: rewardsLoading } = useRewards();

  const activeChallenges =
    challenges?.filter((c) => c.status === ChallengeStatus.active) ?? [];
  const completedChallenges =
    challenges?.filter((c) => c.status === ChallengeStatus.completed) ?? [];

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Trophy className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Challenges &amp; Rewards
          </h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Stay consistent to earn XP, unlock badges, and grow your collection.
          Every completed challenge adds a reward to your trophy case.
        </p>
      </div>

      {/* Active challenges */}
      <section
        className="flex flex-col gap-4"
        aria-labelledby="active-challenges"
      >
        <div className="flex items-center justify-between">
          <h2
            id="active-challenges"
            className="font-display text-lg font-semibold"
          >
            Active Challenges
          </h2>
          <Badge
            variant="secondary"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            {activeChallenges.length} active
          </Badge>
        </div>

        {challengesLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => `skeleton-${i}`).map((id) => (
              <ChallengeSkeleton key={id} />
            ))}
          </div>
        ) : activeChallenges.length === 0 ? (
          <Card data-ocid="challenges_empty_state" className="bg-glow-primary">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-7" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg font-semibold">
                  No active challenges
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  You&apos;re all caught up. New challenges will appear here as
                  you keep training and logging your progress.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id.toString()}
                challenge={challenge}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed challenges */}
      {completedChallenges.length > 0 && (
        <section
          className="flex flex-col gap-4"
          aria-labelledby="completed-challenges"
        >
          <h2
            id="completed-challenges"
            className="font-display text-lg font-semibold"
          >
            Completed
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id.toString()}
                challenge={challenge}
              />
            ))}
          </div>
        </section>
      )}

      {/* Rewards collection */}
      <section
        className="flex flex-col gap-4"
        aria-labelledby="rewards-collection"
      >
        <div className="flex items-center justify-between">
          <h2
            id="rewards-collection"
            className="font-display text-lg font-semibold"
          >
            Rewards Collection
          </h2>
          <Badge
            variant="secondary"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            {rewards?.length ?? 0} earned
          </Badge>
        </div>

        {rewardsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => `reward-skeleton-${i}`).map(
              (id) => (
                <Skeleton key={id} className="h-40 rounded-xl" />
              ),
            )}
          </div>
        ) : rewards && rewards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {rewards.map((reward) => (
              <RewardCard key={reward.id.toString()} reward={reward} />
            ))}
          </div>
        ) : (
          <Card data-ocid="rewards_empty_state" className="bg-glow-primary">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Award className="size-7" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg font-semibold">
                  Your trophy case is empty
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Complete challenges to earn badges and points. Your rewards
                  will show up here as you hit your goals.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
