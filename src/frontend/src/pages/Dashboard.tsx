import type { RankTier } from "@/backend";
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
import {
  useChallenges,
  useDailyFoodLog,
  useDietTarget,
  useRankInfo,
} from "@/hooks/useQueries";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  Camera,
  ChevronRight,
  Dumbbell,
  Flame,
  Medal,
  Salad,
  Target,
  Trophy,
} from "lucide-react";

const TIER_LABELS: Record<RankTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

const QUICK_ACTIONS = [
  {
    label: "AI Diet Coach",
    description: "Personalized nutrition guidance",
    path: "/diet-coach",
    icon: Salad,
  },
  {
    label: "AI Gym Mentor",
    description: "Training plans & form coaching",
    path: "/gym-mentor",
    icon: Dumbbell,
  },
  {
    label: "Calorie Camera",
    description: "Snap a meal for instant macros",
    path: "/calorie-camera",
    icon: Camera,
  },
  {
    label: "Workouts",
    description: "Log sessions & track volume",
    path: "/workouts",
    icon: Activity,
  },
];

function pct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function MacroBar({
  label,
  current,
  target,
  unit,
  colorClass,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  colorClass: string;
}) {
  const value = pct(current, target);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {Math.round(current)}
          <span className="text-xs">
            {" "}
            / {Math.round(target)} {unit}
          </span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function CalorieGauge({
  current,
  target,
}: {
  current: number;
  target: number;
}) {
  const value = pct(current, target);
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto flex size-52 items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="14"
          className="stroke-primary/15"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="flex items-center gap-1 text-primary">
          <Flame className="size-4" aria-hidden="true" />
        </span>
        <span className="font-display text-3xl font-bold tracking-tight">
          {Math.round(current)}
        </span>
        <span className="text-xs text-muted-foreground">
          of {Math.round(target)} kcal
        </span>
      </div>
    </div>
  );
}

function RankProgress({
  xp,
  level,
  tier,
  xpToNextLevel,
}: {
  xp: bigint;
  level: bigint;
  tier: RankTier;
  xpToNextLevel: bigint;
}) {
  const xpNum = Number(xp);
  const toNext = Number(xpToNextLevel);
  const value =
    toNext > 0 ? Math.min(100, Math.round((xpNum / toNext) * 100)) : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Medal className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-sm font-semibold">
              {TIER_LABELS[tier]} · Level {level.toString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {xpNum.toLocaleString()} XP earned
            </span>
          </div>
        </div>
        <Badge variant="secondary" className="text-primary">
          {value}%
        </Badge>
      </div>
      <Progress value={value} data-ocid="rank_progress" />
      <p className="text-xs text-muted-foreground">
        {toNext > 0
          ? `${(toNext - xpNum).toLocaleString()} XP to the next level`
          : "Max level reached"}
      </p>
    </div>
  );
}

function ChallengeCard({
  title,
  description,
  progress,
  target,
  rewardPoints,
  rewardBadge,
}: {
  title: string;
  description: string;
  progress: bigint;
  target: bigint;
  rewardPoints: bigint;
  rewardBadge: string;
}) {
  const value =
    Number(target) > 0
      ? Math.min(100, Math.round((Number(progress) / Number(target)) * 100))
      : 0;

  return (
    <Card data-ocid="challenge_card" className="gap-4">
      <CardContent className="flex flex-col gap-3 px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="font-display text-sm font-semibold">{title}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <Badge variant="outline" className="shrink-0 text-primary">
            <Trophy className="size-3" aria-hidden="true" />
            {rewardPoints.toString()} XP
          </Badge>
        </div>
        <Progress value={value} data-ocid="challenge_progress" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {progress.toString()} / {target.toString()}
          </span>
          <span className="text-primary">{rewardBadge}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const dietTarget = useDietTarget();
  const foodLog = useDailyFoodLog();
  const rankInfo = useRankInfo();
  const challenges = useChallenges();

  const loading =
    dietTarget.isLoading || foodLog.isLoading || rankInfo.isLoading;

  const target = dietTarget.data;
  const log = foodLog.data;
  const rank = rankInfo.data;

  const activeChallenges = (challenges.data ?? []).filter(
    (c) => c.status === "active",
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Your <span className="text-gradient-neon">daily performance</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Track your fuel, rank, and challenges to stay on pace with your goals.
        </p>
      </section>

      {/* Top row: calorie gauge + macros */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Card
          data-ocid="calorie_card"
          className="bg-glow-primary lg:col-span-2"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4 text-primary" aria-hidden="true" />
              Calories
            </CardTitle>
            <CardDescription>Today&apos;s intake vs. target</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="size-52 rounded-full" />
              </div>
            ) : target && log ? (
              <CalorieGauge
                current={log.totalCalories}
                target={Number(target.calories)}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Set your diet target to see today&apos;s progress.
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-ocid="macro_card" className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-primary" aria-hidden="true" />
              Macros
            </CardTitle>
            <CardDescription>
              Protein, carbs &amp; fat breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 3 }, (_, i) => `macro-skeleton-${i}`).map(
                  (id) => (
                    <div key={id} className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ),
                )}
              </div>
            ) : target && log ? (
              <div className="flex flex-col gap-5">
                <MacroBar
                  label="Protein"
                  current={log.totalProtein}
                  target={Number(target.protein)}
                  unit="g"
                  colorClass="bg-primary"
                />
                <MacroBar
                  label="Carbs"
                  current={log.totalCarbs}
                  target={Number(target.carbs)}
                  unit="g"
                  colorClass="bg-chart-2"
                />
                <MacroBar
                  label="Fat"
                  current={log.totalFat}
                  target={Number(target.fat)}
                  unit="g"
                  colorClass="bg-chart-3"
                />
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Log your meals to see your macro breakdown.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Rank + challenges */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Card data-ocid="rank_card" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="size-4 text-primary" aria-hidden="true" />
              Rank &amp; XP
            </CardTitle>
            <CardDescription>
              Your progress toward the next tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : rank ? (
              <RankProgress
                xp={rank.xp}
                level={rank.level}
                tier={rank.tier}
                xpToNextLevel={rank.xpToNextLevel}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Complete challenges to earn XP and rank up.
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-ocid="challenges_card" className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" aria-hidden="true" />
              Active Challenges
            </CardTitle>
            <CardDescription>
              Keep the streak going to earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {challenges.isLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from(
                  { length: 2 },
                  (_, i) => `challenge-skeleton-${i}`,
                ).map((id) => (
                  <div key={id} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : activeChallenges.length > 0 ? (
              activeChallenges.map((c) => (
                <ChallengeCard
                  key={c.id.toString()}
                  title={c.title}
                  description={c.description}
                  progress={c.progress}
                  target={c.target}
                  rewardPoints={c.rewardPoints}
                  rewardBadge={c.rewardBadge}
                />
              ))
            ) : (
              <div
                data-ocid="challenges_empty_state"
                className="flex flex-col items-center gap-2 py-8 text-center"
              >
                <Trophy
                  className="size-8 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  No active challenges right now. Check back soon.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick actions */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.path}
                to={action.path}
                data-ocid={`quick_action_${action.path.replace("/", "")}`}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-smooth hover:border-primary/40 hover:bg-accent"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-sm font-semibold">
                    {action.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
                <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
                  Open
                  <ChevronRight
                    className="size-3 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
