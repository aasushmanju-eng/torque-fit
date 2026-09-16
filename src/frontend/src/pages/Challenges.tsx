import { ChallengeStatus } from "@/backend";
import type { Challenge, Reward } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useChallengeProofs,
  useChallenges,
  useRewards,
  useSubmitChallengeProof,
} from "@/hooks/useQueries";
import { timestampToDate } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useCamera } from "@caffeineai/camera";
import {
  loadConfig,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import { StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";
import {
  Award,
  Camera,
  CameraOff,
  CheckCircle2,
  Dumbbell,
  Flame,
  ImageUp,
  Loader2,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UploadCloud,
  Utensils,
} from "lucide-react";
import { useRef, useState } from "react";
import type React from "react";
import { toast } from "sonner";

function challengeIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("streak")) return Flame;
  if (t.includes("meal") || t.includes("log")) return Utensils;
  if (t.includes("workout") || t.includes("gym")) return Dumbbell;
  return Target;
}

/** The 7-day streak challenge is auto-tracked via food/workout logs and must
 * NOT show a photo proof button — the backend rejects proof submission for it. */
const STREAK_CHALLENGE_ID = 1n;

function isStreakChallenge(challenge: Challenge): boolean {
  if (challenge.id === STREAK_CHALLENGE_ID) return true;
  const t = `${challenge.title} ${challenge.description}`.toLowerCase();
  return t.includes("streak");
}

/**
 * Uploads a captured proof photo through the object-storage extension and
 * returns the opaque file hash that the backend stores as the proof reference.
 *
 * Per the project learning, the upload must reuse the authenticated agent and
 * identity from useInternetIdentity — not build a divergent raw HttpAgent with
 * a different host. We construct the HttpAgent with the signed-in user's
 * identity and the same backend host the actor uses (which defaults to the IC
 * mainnet when undefined), so putFile succeeds with a certified payload.
 */
function useProofUpload() {
  const { identity } = useInternetIdentity();
  const storageRef = useRef<StorageClient | null>(null);

  const getStorage = async (): Promise<StorageClient> => {
    if (storageRef.current) return storageRef.current;
    const config = await loadConfig();
    const agent = new HttpAgent({
      host: config.backend_host,
      identity: identity ?? undefined,
    });
    // Local replica needs the root key fetched for certification to verify.
    if (config.backend_host?.includes("localhost")) {
      await agent.fetchRootKey().catch((err) => {
        console.warn("Unable to fetch root key for object-storage agent", err);
      });
    }
    const client = new StorageClient(
      config.bucket_name,
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
    storageRef.current = client;
    return client;
  };

  const upload = async (
    file: File,
    onProgress: (percentage: number) => void,
  ): Promise<string> => {
    const client = await getStorage();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { hash } = await client.putFile(
      bytes,
      onProgress,
      file.type,
      file.name,
    );
    return hash;
  };

  return { upload };
}

/**
 * Build an actionable, user-facing upload error message from a thrown error.
 * Avoids the generic "Photo upload failed" by surfacing the underlying reason
 * (certificate rejection, network, etc.) with a clear retry nudge.
 */
function describeUploadError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Unknown error";
  const reason = raw.trim() || "Unknown error";
  return `Upload failed: ${reason}. Check your connection and try again.`;
}

function ProofDialog({
  challenge,
  open,
  onOpenChange,
}: {
  challenge: Challenge;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const {
    isActive,
    isSupported,
    isLoading,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: "environment",
    format: "image/jpeg",
    quality: 0.9,
  });

  const { upload } = useProofUpload();
  const submitMutation = useSubmitChallengeProof();

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [phase, setPhase] = useState<
    "idle" | "uploading" | "submitting" | "done"
  >("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      setCapturedFile(file);
      setCapturedPhoto(URL.createObjectURL(file));
      setPhase("idle");
      setUploadError(null);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedFile(null);
    setUploadProgress(0);
    setPhase("idle");
    setUploadError(null);
  };

  const handleSubmit = async () => {
    if (!capturedFile) return;
    setUploadError(null);
    setPhase("uploading");
    setUploadProgress(0);
    try {
      const hash = await upload(capturedFile, (pct) => setUploadProgress(pct));
      setPhase("submitting");
      submitMutation.mutate(
        { challengeId: challenge.id, proofRef: hash },
        {
          onSuccess: (result) => {
            if (result.__kind__ === "ok") {
              setPhase("done");
              toast.success("Proof submitted — nice work!");
            } else {
              setPhase("idle");
              setUploadError(result.err);
              toast.error(result.err);
            }
          },
          onError: () => {
            setPhase("idle");
            setUploadError("Could not submit your proof. Please try again.");
            toast.error("Could not submit your proof. Please try again.");
          },
        },
      );
    } catch (err) {
      setPhase("idle");
      const message = describeUploadError(err);
      setUploadError(message);
      toast.error(message);
    }
  };

  const handleClose = (next: boolean) => {
    if (phase === "uploading" || phase === "submitting") return;
    if (!next) {
      setCapturedPhoto(null);
      setCapturedFile(null);
      setUploadProgress(0);
      setPhase("idle");
      setUploadError(null);
      void stopCamera();
    }
    onOpenChange(next);
  };

  const busy = phase === "uploading" || phase === "submitting";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent data-ocid="proof_dialog" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            Submit proof
          </DialogTitle>
          <DialogDescription>
            Photograph your completed {challenge.title} to verify it. The photo
            is stored securely and attached to your challenge.
          </DialogDescription>
        </DialogHeader>

        {phase === "done" ? (
          <div
            data-ocid="proof_success"
            className="animate-scale-in flex flex-col items-center gap-4 py-8 text-center"
          >
            <span className="flex size-16 items-center justify-center rounded-2xl bg-success/15 text-success">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-lg font-semibold">
                Proof submitted
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Your photo has been uploaded and attached to {challenge.title}.
                Keep going to earn your reward.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
              {capturedPhoto ? (
                <img
                  src={capturedPhoto}
                  alt={`Proof for ${challenge.title}`}
                  className="size-full object-cover"
                />
              ) : isSupported === false ? (
                <div
                  data-ocid="proof_camera_unsupported"
                  className="flex size-full flex-col items-center justify-center gap-3 bg-muted/40 text-center"
                >
                  <CameraOff
                    className="size-8 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="px-6 text-sm text-muted-foreground">
                    Camera is not supported in this browser.
                  </p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="size-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
                      <Camera
                        className="size-8 text-primary"
                        aria-hidden="true"
                      />
                      <p className="px-6 text-sm text-muted-foreground">
                        Start the camera to capture your proof.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {error && (
              <div
                data-ocid="proof_camera_error"
                className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <span>{error.message}</span>
                <Button
                  data-ocid="proof_camera_retry_button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void startCamera()}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Retry
                </Button>
              </div>
            )}

            {uploadError && (
              <div
                data-ocid="proof_error"
                className="animate-scale-in rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {uploadError}
              </div>
            )}

            {phase === "uploading" && (
              <div data-ocid="proof_uploading" className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <UploadCloud
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    Uploading photo…
                  </span>
                  <span className="font-mono text-primary">
                    {uploadProgress}%
                  </span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {capturedPhoto ? (
                <>
                  <Button
                    data-ocid="proof_retake_button"
                    type="button"
                    variant="outline"
                    className="press"
                    onClick={handleRetake}
                    disabled={busy}
                  >
                    <RefreshCw className="size-4" aria-hidden="true" />
                    Retake
                  </Button>
                  <Button
                    data-ocid="proof_submit_button"
                    type="button"
                    className="press glow-primary"
                    onClick={() => void handleSubmit()}
                    disabled={busy}
                  >
                    {busy ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <ImageUp className="size-4" aria-hidden="true" />
                    )}
                    {phase === "uploading"
                      ? "Uploading…"
                      : phase === "submitting"
                        ? "Submitting…"
                        : "Submit proof"}
                  </Button>
                </>
              ) : isActive ? (
                <>
                  <Button
                    data-ocid="proof_capture_button"
                    type="button"
                    className="press glow-primary"
                    onClick={() => void handleCapture()}
                  >
                    <Camera className="size-4" aria-hidden="true" />
                    Capture photo
                  </Button>
                  <Button
                    data-ocid="proof_stop_button"
                    type="button"
                    variant="outline"
                    className="press"
                    onClick={() => void stopCamera()}
                  >
                    <CameraOff className="size-4" aria-hidden="true" />
                    Stop
                  </Button>
                  {isMobile && (
                    <Button
                      data-ocid="proof_switch_button"
                      type="button"
                      variant="outline"
                      className="press"
                      onClick={() => void switchCamera()}
                    >
                      <RefreshCw className="size-4" aria-hidden="true" />
                      Switch
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  data-ocid="proof_start_button"
                  type="button"
                  className="press glow-primary"
                  disabled={isLoading}
                  onClick={() => void startCamera()}
                >
                  <Camera className="size-4" aria-hidden="true" />
                  Start camera
                </Button>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            data-ocid="proof_close_button"
            type="button"
            variant="outline"
            className="press"
            onClick={() => handleClose(false)}
            disabled={busy}
          >
            {phase === "done" ? "Close" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChallengeCard({
  challenge,
  footer,
}: {
  challenge: Challenge;
  footer?: React.ReactNode;
}) {
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
      {footer && (
        <CardFooter className="flex items-center justify-between gap-3 pt-0">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

function ActiveChallengeCard({ challenge }: { challenge: Challenge }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: proofs } = useChallengeProofs(challenge.id);
  const hasProof = (proofs?.length ?? 0) > 0;

  // The 7-day streak challenge is auto-tracked via food/workout logs — it must
  // NOT show a photo proof button. Render an auto-tracking status card instead.
  if (isStreakChallenge(challenge)) {
    const streakCount = Number(challenge.progress);
    const target = Number(challenge.target);
    return (
      <ChallengeCard
        challenge={challenge}
        footer={
          <div
            data-ocid="streak_auto_status"
            className="flex w-full items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5"
          >
            <Flame
              className="size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold text-primary">
                {streakCount}-day streak · auto-tracked
              </span>
              <span className="text-xs text-muted-foreground">
                This challenge tracks automatically — log food or a workout each
                day to build your streak
                {target > 0 ? ` to ${target} days` : ""}. No photo needed.
              </span>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <>
      <ChallengeCard
        challenge={challenge}
        footer={
          <>
            {hasProof ? (
              <Badge
                data-ocid="proof_submitted_badge"
                variant="secondary"
                className="border-success/40 bg-success/15 text-success"
              >
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Proof submitted
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                Add a photo to verify this challenge.
              </span>
            )}
            <Button
              data-ocid="proof_open_button"
              type="button"
              variant={hasProof ? "outline" : "default"}
              className={cn("press", !hasProof && "glow-primary")}
              onClick={() => setDialogOpen(true)}
            >
              <Camera className="size-4" aria-hidden="true" />
              {hasProof ? "View / resubmit" : "Submit proof"}
            </Button>
          </>
        }
      />
      <ProofDialog
        challenge={challenge}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
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
      <div className="animate-rise flex flex-col gap-2">
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
          <div className="stagger grid gap-4 md:grid-cols-2">
            {activeChallenges.map((challenge) => (
              <ActiveChallengeCard
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
          <div className="stagger grid gap-4 md:grid-cols-2">
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
          <div className="stagger grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
