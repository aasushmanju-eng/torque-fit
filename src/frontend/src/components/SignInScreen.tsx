import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Dumbbell } from "lucide-react";

export function SignInScreen() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();
  const disabled = isInitializing || isLoggingIn;

  return (
    <div className="bg-glow-primary relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Dumbbell className="size-9" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-4xl font-bold tracking-tight">
              <span className="text-gradient-neon">Torque Fit</span>
            </h1>
            <p className="text-muted-foreground">
              Your AI diet coach and gym mentor, personalized to your body and
              goals.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            data-ocid="signin_button"
            size="lg"
            className="w-full"
            onClick={() => login()}
            disabled={disabled}
          >
            {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Sign in securely to sync your personalized plan, workouts, and
            progress.
          </p>
        </div>
      </div>
    </div>
  );
}
