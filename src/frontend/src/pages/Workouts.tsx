import type { Workout, WorkoutReminder } from "@/backend";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddWorkoutReminder,
  useLogWorkout,
  useRemoveWorkoutReminder,
  useUpdateWorkoutReminder,
  useWorkoutReminders,
  useWorkouts,
} from "@/hooks/useQueries";
import { formatDate, timestampToDate } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlarmClock,
  Bell,
  BellRing,
  Dumbbell,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ExerciseDraft {
  id: number;
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

interface ReminderDraft {
  id: bigint | null;
  title: string;
  days: number[];
  time: string;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

let nextExerciseId = 0;

const createEmptyExercise = (): ExerciseDraft => ({
  id: nextExerciseId++,
  name: "",
  sets: "",
  reps: "",
  weight: "",
});

const emptyReminderDraft = (): ReminderDraft => ({
  id: null,
  title: "",
  days: [],
  time: "07:00",
});

/** Convert minutes since midnight to a "HH:MM" 24h string. */
const minutesToTime = (minutes: number): string => {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

/** Convert a "HH:MM" 24h string to minutes since midnight. */
const timeToMinutes = (time: string): number => {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
};

/** Format minutes since midnight as a friendly 12h time. */
const formatTime = (minutes: number): string => {
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const period = hh >= 12 ? "PM" : "AM";
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, "0")} ${period}`;
};

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
    <Card data-ocid="workout_item" className="hover-lift bg-glow-primary">
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

function ReminderSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
}

function ReminderCard({
  reminder,
  onEdit,
  onDelete,
  isDeleting,
}: {
  reminder: WorkoutReminder;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const dayNames = reminder.days
    .map((d) => DAY_LABELS[Number(d)])
    .filter(Boolean);

  return (
    <Card data-ocid="reminder_item" className="hover-lift bg-glow-primary">
      <CardContent className="flex items-center gap-4 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <BellRing className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate font-display text-sm font-semibold">
            {reminder.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-mono text-primary">
              <AlarmClock className="size-3.5" aria-hidden="true" />
              {formatTime(Number(reminder.timeMinutes))}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {dayNames.length > 0 ? dayNames.join(", ") : "No days selected"}
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            data-ocid="reminder_edit_button"
            variant="ghost"
            size="icon"
            aria-label={`Edit reminder ${reminder.title}`}
            onClick={onEdit}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            data-ocid="reminder_delete_button"
            variant="ghost"
            size="icon"
            aria-label={`Delete reminder ${reminder.title}`}
            disabled={isDeleting}
            onClick={onDelete}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Workouts() {
  const { data: workouts, isLoading } = useWorkouts();
  const logWorkout = useLogWorkout();
  const { data: reminders, isLoading: remindersLoading } =
    useWorkoutReminders();
  const addReminder = useAddWorkoutReminder();
  const updateReminder = useUpdateWorkoutReminder();
  const removeReminder = useRemoveWorkoutReminder();

  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([
    createEmptyExercise(),
  ]);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<ReminderDraft>(emptyReminderDraft());
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [notifNote, setNotifNote] = useState<string | null>(null);
  const firedRef = useRef<Set<string>>(new Set());

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

  const openAddDialog = () => {
    setDraft(emptyReminderDraft());
    setReminderError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (reminder: WorkoutReminder) => {
    setDraft({
      id: reminder.id,
      title: reminder.title,
      days: reminder.days.map((d) => Number(d)),
      time: minutesToTime(Number(reminder.timeMinutes)),
    });
    setReminderError(null);
    setDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    setDraft((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((d) => d !== day)
        : [...current.days, day].sort((a, b) => a - b),
    }));
  };

  const canSaveReminder =
    draft.title.trim().length > 0 && draft.days.length > 0;

  const handleSaveReminder = () => {
    if (!canSaveReminder) return;

    const capturedTitle = draft.title.trim();
    const capturedDays = draft.days.map((d) => BigInt(d));
    const capturedTime = BigInt(timeToMinutes(draft.time));
    const isEditing = draft.id !== null;

    setDialogOpen(false);
    setReminderError(null);

    if (isEditing && draft.id !== null) {
      updateReminder.mutate(
        {
          id: draft.id,
          days: capturedDays,
          timeMinutes: capturedTime,
          title: capturedTitle,
        },
        {
          onError: () => {
            setReminderError(
              "Could not update this reminder. Please try again.",
            );
            setDialogOpen(true);
          },
        },
      );
    } else {
      addReminder.mutate(
        {
          days: capturedDays,
          timeMinutes: capturedTime,
          title: capturedTitle,
        },
        {
          onError: () => {
            setReminderError("Could not save this reminder. Please try again.");
            setDialogOpen(true);
          },
        },
      );
    }

    // Ask for notification permission so reminders can alert while the app is open.
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      void Notification.requestPermission().then((permission) => {
        setNotifNote(
          permission === "granted"
            ? "Notifications enabled — you'll be alerted when a reminder is due."
            : "Notifications are blocked. Reminders will still show in-app.",
        );
      });
    }
  };

  const handleDeleteReminder = (reminder: WorkoutReminder) => {
    removeReminder.mutate(reminder.id);
  };

  // Fire a browser notification when a reminder's day + time matches now.
  useEffect(() => {
    if (!reminders || reminders.length === 0) return;
    if (typeof Notification === "undefined") return;

    const check = () => {
      const now = new Date();
      const backendDay = (now.getDay() + 6) % 7;
      const minutes = now.getHours() * 60 + now.getMinutes();

      for (const r of reminders) {
        if (!r.days.includes(BigInt(backendDay))) continue;
        if (Number(r.timeMinutes) !== minutes) continue;
        const key = `${r.id.toString()}:${now.toDateString()}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);
        try {
          new Notification(r.title || "Time to work out", {
            body: "Your scheduled workout reminder is due. Let's get moving!",
            tag: `workout-${r.id.toString()}`,
          });
        } catch {
          // Notification constructor can throw in restricted environments.
        }
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [reminders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-rise flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Activity className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Workouts
          </h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Log your sessions, track volume, and schedule reminders so you never
          miss a training day.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Log workout form */}
        <Card
          data-ocid="log_workout_panel"
          className="animate-rise h-fit bg-glow-primary"
        >
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
        <div className="animate-rise flex flex-col gap-4">
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
            <div className="stagger flex flex-col gap-4">
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

      {/* Workout reminders */}
      <section
        data-ocid="reminders_section"
        className="animate-slide-up flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Bell className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col">
              <h2 className="font-display text-lg font-semibold">
                Workout reminders
              </h2>
              <p className="text-sm text-muted-foreground">
                Schedule alerts for the days and times you train.
              </p>
            </div>
          </div>
          <Button
            type="button"
            data-ocid="add_reminder_button"
            onClick={openAddDialog}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add reminder
          </Button>
        </div>

        {notifNote && (
          <p
            data-ocid="notification_note"
            className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
          >
            {notifNote}
          </p>
        )}

        {remindersLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 2 }, (_, i) => `reminder-skeleton-${i}`).map(
              (id) => (
                <ReminderSkeleton key={id} />
              ),
            )}
          </div>
        ) : reminders && reminders.length > 0 ? (
          <div className="stagger flex flex-col gap-3">
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id.toString()}
                reminder={reminder}
                onEdit={() => openEditDialog(reminder)}
                onDelete={() => handleDeleteReminder(reminder)}
                isDeleting={removeReminder.isPending}
              />
            ))}
          </div>
        ) : (
          <Card data-ocid="reminders_empty_state" className="bg-glow-primary">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <BellRing className="size-7" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg font-semibold">
                  No reminders scheduled
                </h3>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Add a reminder for your training days and times, and we'll
                  nudge you when it's time to hit the gym.
                </p>
              </div>
              <Button
                type="button"
                data-ocid="reminders_empty_add_button"
                variant="outline"
                onClick={openAddDialog}
              >
                <Plus className="size-4" aria-hidden="true" />
                Schedule a reminder
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Add / edit reminder dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="reminder_dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {draft.id !== null ? "Edit reminder" : "New workout reminder"}
            </DialogTitle>
            <DialogDescription>
              Choose the days and time you want to be reminded to train.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="reminder-title">Reminder title</Label>
              <Input
                id="reminder-title"
                data-ocid="reminder_title_input"
                placeholder="e.g. Morning lift"
                value={draft.title}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    title: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Days</Label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAY_LABELS.map((label, day) => (
                  <div
                    key={label}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-border px-1 py-2.5 transition-fast hover:border-primary/40",
                      draft.days.includes(day) &&
                        "border-primary bg-primary/15 text-primary",
                    )}
                  >
                    <Checkbox
                      data-ocid={`reminder_day_checkbox.${day}`}
                      checked={draft.days.includes(day)}
                      onCheckedChange={() => toggleDay(day)}
                      aria-label={DAY_FULL[day]}
                    />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="reminder-time">Time</Label>
              <Input
                id="reminder-time"
                data-ocid="reminder_time_input"
                type="time"
                value={draft.time}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    time: e.target.value,
                  }))
                }
              />
            </div>

            {reminderError && (
              <p
                data-ocid="reminder_error"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {reminderError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              data-ocid="reminder_cancel_button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              data-ocid="reminder_save_button"
              disabled={
                !canSaveReminder ||
                addReminder.isPending ||
                updateReminder.isPending
              }
              onClick={handleSaveReminder}
            >
              {addReminder.isPending || updateReminder.isPending
                ? "Saving…"
                : draft.id !== null
                  ? "Save changes"
                  : "Add reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
