import type { Workout } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogWorkout, useWorkouts } from "@/hooks/useQueries";
import { formatDate, timestampToDate } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Activity, Dumbbell, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface ExerciseDraft {
  id: number;
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

let nextExerciseId = 0;

const createEmptyExercise = (): ExerciseDraft => ({
  id: nextExerciseId++,
  name: "",
  sets: "",
  reps: "",
  weight: "",
});

function WorkoutCard({ workout }: { workout: Workout }) {
  const date = timestampToDate(workout.completedAtNs);
  const totalSets = workout.exercises.reduce(
    (sum, ex) => sum + ex.sets.length,
    0,
  );
  const totalVolume = workout.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + Number(set.reps) * set.weightKg, 0),
    0,
  );

  return (
    <Card data-ocid="workout_item" className="bg-glow-primary">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Dumbbell className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <CardTitle className="font-display text-base">
                {workout.title}
              </CardTitle>
              <CardDescription>{formatDate(date)}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-display text-sm font-semibold text-primary">
              {totalVolume.toLocaleString()} kg
            </span>
            <span className="text-xs text-muted-foreground">
              {totalSets} {totalSets === 1 ? "set" : "sets"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {workout.exercises.map((exercise, i) => (
          <div
            key={`${workout.id}-${exercise.name}-${i}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/40 px-4 py-3"
          >
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {exercise.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {exercise.sets.length}{" "}
                {exercise.sets.length === 1 ? "set" : "sets"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">
                {exercise.sets[0] ? `${exercise.sets[0].reps} reps` : "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {exercise.sets[0] ? `${exercise.sets[0].weightKg} kg` : "—"}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorkoutSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, i) => `skeleton-${i}`).map((id) => (
          <Skeleton key={id} className="h-14 w-full rounded-lg" />
        ))}
      </CardContent>
    </Card>
  );
}

export default function Workouts() {
  const { data: workouts, isLoading } = useWorkouts();
  const logWorkout = useLogWorkout();

  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    createEmptyExercise(),
  ]);
  const [error, setError] = useState<string | null>(null);

  const updateExercise = (index: number, patch: Partial<ExerciseDraft>) => {
    setExercises((current) =>
      current.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)),
    );
  };

  const addExercise = () => {
    setExercises((current) => [...current, createEmptyExercise()]);
  };

  const removeExercise = (index: number) => {
    setExercises((current) =>
      current.length === 1
        ? [createEmptyExercise()]
        : current.filter((_, i) => i !== index),
    );
  };

  const canSubmit =
    title.trim().length > 0 &&
    exercises.length > 0 &&
    exercises.every(
      (ex) =>
        ex.name.trim().length > 0 &&
        Number(ex.sets) > 0 &&
        Number(ex.reps) > 0 &&
        Number(ex.weight) >= 0,
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const capturedTitle = title.trim();
    const capturedDraft = exercises.map((ex) => ({ ...ex }));
    const capturedExercises = exercises.map((ex) => ({
      name: ex.name.trim(),
      sets: Array.from({ length: Number(ex.sets) }, () => ({
        reps: BigInt(Number(ex.reps)),
        weightKg: Number(ex.weight),
      })),
    }));

    setTitle("");
    setExercises([createEmptyExercise()]);
    setError(null);

    logWorkout.mutate(
      { title: capturedTitle, exercises: capturedExercises },
      {
        onError: () => {
          setError(
            "Could not save your workout. Please check your connection and try again.",
          );
          setTitle(capturedTitle);
          setExercises(capturedDraft);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Activity className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Workouts
          </h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Log your sessions, track volume, and build momentum toward your
          training targets.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Log workout form */}
        <Card data-ocid="log_workout_panel" className="h-fit bg-glow-primary">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Log a workout
            </CardTitle>
            <CardDescription>
              Add a session with one or more exercises. Sets, reps, and weight
              are recorded per exercise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
              data-ocid="log_workout_form"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="workout-title">Workout title</Label>
                <Input
                  id="workout-title"
                  data-ocid="workout_title_input"
                  placeholder="e.g. Upper body strength"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label>Exercises</Label>
                  <Button
                    type="button"
                    data-ocid="add_exercise_button"
                    variant="outline"
                    size="sm"
                    onClick={addExercise}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add exercise
                  </Button>
                </div>

                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    data-ocid={`exercise_row.${index}`}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-background/40 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        data-ocid={`exercise_name_input.${index}`}
                        placeholder="Exercise name"
                        value={exercise.name}
                        onChange={(e) =>
                          updateExercise(index, { name: e.target.value })
                        }
                      />
                      <Button
                        type="button"
                        data-ocid={`remove_exercise_button.${index}`}
                        variant="ghost"
                        size="icon"
                        aria-label="Remove exercise"
                        onClick={() => removeExercise(index)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor={`sets-${index}`}
                          className="text-xs text-muted-foreground"
                        >
                          Sets
                        </Label>
                        <Input
                          id={`sets-${index}`}
                          data-ocid={`sets_input.${index}`}
                          type="number"
                          min="1"
                          placeholder="3"
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(index, { sets: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor={`reps-${index}`}
                          className="text-xs text-muted-foreground"
                        >
                          Reps
                        </Label>
                        <Input
                          id={`reps-${index}`}
                          data-ocid={`reps_input.${index}`}
                          type="number"
                          min="1"
                          placeholder="10"
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExercise(index, { reps: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label
                          htmlFor={`weight-${index}`}
                          className="text-xs text-muted-foreground"
                        >
                          Weight (kg)
                        </Label>
                        <Input
                          id={`weight-${index}`}
                          data-ocid={`weight_input.${index}`}
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="50"
                          value={exercise.weight}
                          onChange={(e) =>
                            updateExercise(index, { weight: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p
                  data-ocid="log_workout_error"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                data-ocid="log_workout_submit"
                className="w-full"
                disabled={!canSubmit || logWorkout.isPending}
              >
                {logWorkout.isPending ? "Saving…" : "Save workout"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Workout history */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              Workout history
            </h2>
            <span className="text-sm text-muted-foreground">
              {workouts?.length ?? 0}{" "}
              {workouts?.length === 1 ? "session" : "sessions"}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 2 }, (_, i) => `skeleton-${i}`).map(
                (id) => (
                  <WorkoutSkeleton key={id} />
                ),
              )}
            </div>
          ) : workouts && workouts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {workouts.map((workout) => (
                <WorkoutCard key={workout.id.toString()} workout={workout} />
              ))}
            </div>
          ) : (
            <Card data-ocid="workouts_empty_state" className="bg-glow-primary">
              <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Dumbbell className="size-7" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-display text-lg font-semibold">
                    No workouts logged yet
                  </h3>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Log your first session to start tracking volume and earning
                    progress toward your challenges and rank.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
