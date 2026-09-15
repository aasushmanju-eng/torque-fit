import { ActivityLevel, FitnessGoal, Gender, type Profile } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateProfile } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

/** Editable form state for a profile, using strings for numeric inputs. */
export interface ProfileDraft {
  name: string;
  age: string;
  gender: Gender | "";
  weightKg: string;
  heightCm: string;
  goal: FitnessGoal | "";
  activityLevel: ActivityLevel | "";
  targetSport: string;
}

export const EMPTY_DRAFT: ProfileDraft = {
  name: "",
  age: "",
  gender: "",
  weightKg: "",
  heightCm: "",
  goal: "",
  activityLevel: "",
  targetSport: "",
};

/** Convert a saved backend profile into editable draft state. */
export function profileToDraft(profile: Profile): ProfileDraft {
  return {
    name: profile.name,
    age: profile.age.toString(),
    gender: profile.gender,
    weightKg: profile.weightKg.toString(),
    heightCm: profile.heightCm.toString(),
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    targetSport: profile.targetSport,
  };
}

/** Convert draft state into the backend Profile payload. */
export function toProfile(draft: ProfileDraft): Profile {
  return {
    name: draft.name.trim(),
    age: BigInt(draft.age),
    gender: draft.gender as Gender,
    weightKg: Number(draft.weightKg),
    heightCm: Number(draft.heightCm),
    goal: draft.goal as FitnessGoal,
    activityLevel: draft.activityLevel as ActivityLevel,
    targetSport: draft.targetSport,
  };
}

const GENDER_OPTIONS: { value: Gender; label: string; hint: string }[] = [
  { value: Gender.male, label: "Male", hint: "He / him" },
  { value: Gender.female, label: "Female", hint: "She / her" },
  { value: Gender.other, label: "Other", hint: "Prefer not to say" },
];

const GOAL_OPTIONS: { value: FitnessGoal; label: string; hint: string }[] = [
  { value: FitnessGoal.lose, label: "Lose weight", hint: "Cut fat, lean out" },
  {
    value: FitnessGoal.gain,
    label: "Gain muscle",
    hint: "Build size & strength",
  },
  {
    value: FitnessGoal.maintain,
    label: "Maintain",
    hint: "Stay where you are",
  },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: ActivityLevel.sedentary, label: "Sedentary" },
  { value: ActivityLevel.light, label: "Light" },
  { value: ActivityLevel.moderate, label: "Moderate" },
  { value: ActivityLevel.active, label: "Active" },
  { value: ActivityLevel.veryActive, label: "Very active" },
];

const SPORT_OPTIONS = [
  "General fitness",
  "Gym & strength",
  "Basketball",
  "Football",
  "Swimming",
  "Cricket",
  "Running",
  "Cycling",
  "Yoga & mobility",
  "Other",
];

const STEPS = [
  {
    id: 1,
    label: "About you",
    title: "Tell us about yourself",
    description:
      "Your name, age, and gender help us personalize your coaching.",
  },
  {
    id: 2,
    label: "Your body",
    title: "Your body metrics",
    description: "Your weight and height let us calculate accurate targets.",
  },
  {
    id: 3,
    label: "Your goals",
    title: "Set your goals",
    description:
      "Pick your goal, activity level, and main sport to tune your plan.",
  },
] as const;

function RadioCard({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <Label
      htmlFor={`rc-${value}`}
      className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border bg-card px-3 py-3 transition-smooth has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/10"
    >
      <RadioGroupItem value={value} id={`rc-${value}`} className="sr-only" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
    </Label>
  );
}

function SelectField({
  label,
  value,
  placeholder,
  options,
  onValueChange,
  ocid,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  ocid: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full" data-ocid={ocid}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ProfileFieldsProps {
  draft: ProfileDraft;
  onChange: (patch: Partial<ProfileDraft>) => void;
  step: 1 | 2 | 3 | "all";
}

/** Renders the profile input fields, optionally filtered to a wizard step. */
export function ProfileFields({ draft, onChange, step }: ProfileFieldsProps) {
  const show = (s: 1 | 2 | 3) => step === "all" || step === s;

  return (
    <>
      {show(1) && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={draft.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Alex Morgan"
              data-ocid="profile.name_input"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-age">Age</Label>
            <Input
              id="profile-age"
              type="number"
              min={13}
              max={100}
              value={draft.age}
              onChange={(e) => onChange({ age: e.target.value })}
              placeholder="e.g. 28"
              data-ocid="profile.age_input"
            />
          </div>
          <div className="grid gap-3">
            <Label>Gender</Label>
            <RadioGroup
              value={draft.gender}
              onValueChange={(v) => onChange({ gender: v as Gender })}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              data-ocid="profile.gender_radio"
            >
              {GENDER_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  hint={opt.hint}
                />
              ))}
            </RadioGroup>
          </div>
        </>
      )}

      {show(2) && (
        <>
          <div className="grid gap-2">
            <Label htmlFor="profile-weight">Weight (kg)</Label>
            <Input
              id="profile-weight"
              type="number"
              min={30}
              max={300}
              step="0.1"
              value={draft.weightKg}
              onChange={(e) => onChange({ weightKg: e.target.value })}
              placeholder="e.g. 72.5"
              data-ocid="profile.weight_input"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-height">Height (cm)</Label>
            <Input
              id="profile-height"
              type="number"
              min={120}
              max={230}
              value={draft.heightCm}
              onChange={(e) => onChange({ heightCm: e.target.value })}
              placeholder="e.g. 175"
              data-ocid="profile.height_input"
            />
          </div>
        </>
      )}

      {show(3) && (
        <>
          <div className="grid gap-3">
            <Label>Fitness goal</Label>
            <RadioGroup
              value={draft.goal}
              onValueChange={(v) => onChange({ goal: v as FitnessGoal })}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
              data-ocid="profile.goal_radio"
            >
              {GOAL_OPTIONS.map((opt) => (
                <RadioCard
                  key={opt.value}
                  value={opt.value}
                  label={opt.label}
                  hint={opt.hint}
                />
              ))}
            </RadioGroup>
          </div>
          <SelectField
            label="Activity level"
            value={draft.activityLevel}
            placeholder="Select your activity level"
            options={ACTIVITY_OPTIONS}
            onValueChange={(v) =>
              onChange({ activityLevel: v as ActivityLevel })
            }
            ocid="profile.activity_select"
          />
          <SelectField
            label="Target sport"
            value={draft.targetSport}
            placeholder="Select your main sport"
            options={SPORT_OPTIONS.map((s) => ({ value: s, label: s }))}
            onValueChange={(v) => onChange({ targetSport: v })}
            ocid="profile.sport_select"
          />
        </>
      )}
    </>
  );
}

/**
 * Multi-step onboarding wizard shown on first run. Collects the profile
 * details and saves them through the backend updateProfile method.
 */
export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  const updateProfile = useUpdateProfile();

  const patch = (p: Partial<ProfileDraft>) => setDraft((d) => ({ ...d, ...p }));

  const canContinue =
    step === 1
      ? draft.name.trim() !== "" && draft.age !== "" && draft.gender !== ""
      : step === 2
        ? draft.weightKg !== "" && draft.heightCm !== ""
        : draft.goal !== "" &&
          draft.activityLevel !== "" &&
          draft.targetSport !== "";

  const current = STEPS.find((s) => s.id === step) ?? STEPS[0];

  const handleSubmit = () => {
    updateProfile.mutate(toProfile(draft), {
      onSuccess: () => onComplete(),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Dumbbell className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Let&apos;s set up your profile
          </h1>
          <p className="text-sm text-muted-foreground">
            A few details so your AI coach can personalize everything.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2" data-ocid="onboarding_stepper">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-smooth",
                  s.id === step
                    ? "bg-primary text-primary-foreground"
                    : s.id < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {s.id < step ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  s.id
                )}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium sm:inline",
                  s.id === step ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1",
                  s.id < step ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        ))}
      </div>

      <Card className="bg-glow-primary">
        <CardContent className="flex flex-col gap-6 px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-semibold">
              {current.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {current.description}
            </p>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            <ProfileFields draft={draft} onChange={patch} step={step} />
          </motion.div>

          {updateProfile.isError && (
            <p
              className="text-sm text-destructive"
              data-ocid="onboarding_error"
            >
              Something went wrong saving your profile. Please try again.
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              disabled={step === 1}
              data-ocid="onboarding_back_button"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}
                disabled={!canContinue}
                data-ocid="onboarding_continue_button"
              >
                Continue
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canContinue || updateProfile.isPending}
                data-ocid="onboarding_submit_button"
              >
                {updateProfile.isPending ? "Saving…" : "Create my profile"}
                <Sparkles className="size-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
