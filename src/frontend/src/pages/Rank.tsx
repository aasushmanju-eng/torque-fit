import { RankTier } from "@/backend";
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
import { useRankInfo, useRewards } from "@/hooks/useQueries";
import { formatDate, timestampToDate } from "@/lib/api";
import {
  Award,
  Crown,
  Gem,
  Medal,
  Shield,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

const TIER_LABELS: Record<RankTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

const TIER_ORDER: RankTier[] = [
  RankTier.bronze,
  RankTier.silver,
  RankTier.gold,
  RankTier.platinum,
  RankTier.diamond,
];

const TIER_META: Record<
  RankTier,
  { icon: typeof Medal; ring: string; text: string; chip: string }
> = {
  bronze: {
    icon: Shield,
    ring: "border-amber-700/40",
    text: "text-amber-600",
    chip: "bg-amber-700/15 text-amber-500",
  },
  silver: {
    icon: Medal,
    ring: "border-slate-400/40",
    text: "text-slate-300",
    chip: "bg-slate-400/15 text-slate-300",
  },
  gold: {
    icon: Trophy,
    ring: "border-yellow-400/40",
    text: "text-yellow-400",
    chip: "bg-yellow-400/15 text-yellow-300",
  },
  platinum: {
    icon: Crown,
    ring: "border-cyan-300/40",
    text: "text-cyan-300",
    chip: "bg-cyan-300/15 text-cyan-200",
  },
  diamond: {
    icon: Gem,
    ring: "border-primary/50",
    text: "text-primary",
    chip: "bg-primary/15 text-primary",
  },
};

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
    toNext > 0 ? Math.min(100, Math.round((xpNum / toNext) * 100)) : 100;
  const meta = TIER_META[tier];
  const TierIcon = meta.icon;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span
          className={`flex size-16 shrink-0 items-center justify-center rounded-2xl border bg-card ${meta.ring} ${meta.text}`}
        >
          <TierIcon className="size-8" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <Badge
            variant="outline"
            className={`w-fit ${meta.chip} border-transparent`}
          >
            {TIER_LABELS[tier]}
          </Badge>
          <span className="font-display text-2xl font-bold tracking-tight">
            Level {level.toString()}
          </span>
          <span className="text-sm text-muted-foreground">
            {xpNum.toLocaleString()} XP earned
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress to next level</span>
          <span className="font-mono text-muted-foreground">{value}%</span>
        </div>
        <Progress value={value} data-ocid="rank_progress" />
        <p className="text-xs text-muted-foreground">
          {toNext > 0
            ? `${(toNext - xpNum).toLocaleString()} XP to reach Level ${(
                level + 1n
              ).toString()}`
            : "Max level reached — keep earning XP to stay on top."}
        </p>
      </div>
    </div>
  );
}

function TierLadder({ currentTier }: { currentTier: RankTier }) {
  const currentIndex = TIER_ORDER.indexOf(currentTier);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {TIER_ORDER.map((tier, index) => {
          const meta = TIER_META[tier];
          const TierIcon = meta.icon;
          const reached = index <= currentIndex;
          return (
            <div key={tier} className="flex flex-1 flex-col items-center gap-2">
              <span
                className={`flex size-11 items-center justify-center rounded-xl border transition-smooth ${
                  reached
                    ? `${meta.ring} ${meta.text} bg-card`
                    : "border-border text-muted-foreground/40"
                }`}
              >
                <TierIcon className="size-5" aria-hidden="true" />
              </span>
              <span
                className={`text-xs font-medium ${
                  reached ? meta.text : "text-muted-foreground/50"
                }`}
              >
                {TIER_LABELS[tier]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700"
          style={{
            width: `${((currentIndex + 1) / TIER_ORDER.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

function RewardCard({
  badge,
  points,
  earnedAtNs,
  index,
}: {
  badge: string;
  points: bigint;
  earnedAtNs: bigint;
  index: number;
}) {
  const earnedAt = timestampToDate(earnedAtNs);

  return (
    <Card
      data-ocid={`reward_card.${index}`}
      className="gap-3 transition-smooth hover:border-primary/40 hover:bg-accent hover-lift focus-ring"
    >
      <CardContent className="flex flex-col items-center gap-3 px-6 py-5 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-primary transition-transform duration-300 group-hover:scale-110">
          <Award className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="font-display text-sm font-semibold">{badge}</span>
          <span className="text-xs text-muted-foreground">
            {points.toString()} XP · {formatDate(earnedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Rank() {
  const rankInfo = useRankInfo();
  const rewards = useRewards();

  const loading = rankInfo.isLoading || rewards.isLoading;
  const rank = rankInfo.data;
  const rewardList = rewards.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="flex flex-col gap-1 animate-rise">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Your <span className="text-gradient-neon">rank &amp; rewards</span>
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Climb the tiers, earn XP, and collect badges as you stay consistent
          with your training.
        </p>
      </section>

      {/* Rank overview */}
      <section className="grid gap-6 lg:grid-cols-5">
        <Card
          data-ocid="rank_card"
          className="bg-glow-primary lg:col-span-2 animate-rise"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-primary" aria-hidden="true" />
              Current Rank
            </CardTitle>
            <CardDescription>Your tier, level, and XP progress</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="size-16 animate-shimmer rounded-2xl" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-20 animate-shimmer" />
                    <Skeleton className="h-7 w-32 animate-shimmer" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full animate-shimmer" />
              </div>
            ) : rank ? (
              <RankProgress
                xp={rank.xp}
                level={rank.level}
                tier={rank.tier}
                xpToNextLevel={rank.xpToNextLevel}
              />
            ) : (
              <div
                data-ocid="rank_empty_state"
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Star className="size-6" aria-hidden="true" />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Complete challenges to earn XP and rank up.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card
          data-ocid="tier_ladder_card"
          className="lg:col-span-3 animate-rise"
          style={{ animationDelay: "0.06s" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" aria-hidden="true" />
              Tier Ladder
            </CardTitle>
            <CardDescription>Your standing across all ranks</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between">
                  {Array.from(
                    { length: 5 },
                    (_, i) => `tier-skeleton-${i}`,
                  ).map((id) => (
                    <Skeleton
                      key={id}
                      className="size-11 animate-shimmer rounded-xl"
                    />
                  ))}
                </div>
                <Skeleton className="h-1.5 w-full animate-shimmer" />
              </div>
            ) : rank ? (
              <TierLadder currentTier={rank.tier} />
            ) : (
              <div
                data-ocid="tier_ladder_empty_state"
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Trophy className="size-6" aria-hidden="true" />
                </span>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Your tier will appear here once you start earning XP.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Rewards / badges */}
      <section className="flex flex-col gap-3 animate-rise">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-lg font-semibold">
              Earned badges &amp; rewards
            </h2>
            <p className="text-sm text-muted-foreground">
              Badges you&apos;ve unlocked along your journey
            </p>
          </div>
          <Badge variant="secondary" className="text-primary">
            {rewardList.length} earned
          </Badge>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => `reward-skeleton-${i}`).map(
              (id) => (
                <Card key={id} className="gap-3">
                  <CardContent className="flex flex-col items-center gap-3 px-6 py-5">
                    <Skeleton className="size-12 animate-shimmer rounded-xl" />
                    <Skeleton className="h-4 w-24 animate-shimmer" />
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        ) : rewardList.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger">
            {rewardList.map((reward, index) => (
              <RewardCard
                key={reward.id.toString()}
                badge={reward.badge}
                points={reward.points}
                earnedAtNs={reward.earnedAtNs}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Card
            data-ocid="rewards_empty_state"
            className="bg-glow-primary animate-scale-in"
          >
            <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="size-7" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg font-semibold">
                  No badges yet
                </h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  Complete challenges and stay consistent to unlock your first
                  reward badge.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
