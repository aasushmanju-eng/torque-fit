import {
  ActivityLevel,
  type Profile as BackendProfile,
  FitnessGoal,
  Gender,
} from "@/backend";
import {
  OnboardingFlow,
  type ProfileDraft,
  ProfileFields,
  profileToDraft,
  toProfile,
} from "@/components/OnboardingFlow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks/useQueries";
import { Medal, Pencil, Save, X } from "lucide-react";
import { useState } from "react";

const GENDER_LABEL: Record<Gender, string> = {
  [Gender.male]: "Male",
  [Gender.female]: "Female",
  [Gender.other]: "Other",
};

const GOAL_LABEL: Record<FitnessGoal, string> = {
  [FitnessGoal.lose]: "Lose weight",
  [FitnessGoal.gain]: "Gain muscle",
  [FitnessGoal.maintain]: "Maintain",
};

const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  [ActivityLevel.sedentary]: "Sedentary",
  [ActivityLevel.light]: "Light",
  [ActivityLevel.moderate]: "Moderate",
  [ActivityLevel.active]: "Active",
  [ActivityLevel.veryActive]: "Very active",
};

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 7 }, (_, i) => `stat-${i}`).map((id) => (
              <Skeleton key={id} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileSummary({
  profile,
  onEdit,
}: {
  profile: BackendProfile;
  onEdit: () => void;
}) {
  const stats = [
    { label: "Gender", value: GENDER_LABEL[profile.gender] },
    { label: "Age", value: `${profile.age.toString()} years` },
    { label: "Weight", value: `${profile.weightKg} kg` },
    { label: "Height", value: `${profile.heightCm} cm` },
    { label: "Goal", value: GOAL_LABEL[profile.goal] },
    { label: "Activity", value: ACTIVITY_LABEL[profile.activityLevel] },
    { label: "Target sport", value: profile.targetSport },
  ];

  return (
    <Card className="bg-glow-primary">
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Medal className="size-7" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-xl font-semibold">
                {profile.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Your personalization profile
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            data-ocid="profile_edit_button"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-card px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-base font-semibold">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return <OnboardingFlow onComplete={() => {}} />;
  }

  const startEdit = () => {
    setDraft(profileToDraft(profile));
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  const handleSave = () => {
    if (!draft) return;
    updateProfile.mutate(toProfile(draft), {
      onSuccess: () => {
        setEditing(false);
        setDraft(null);
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Medal className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Your stats and personalization settings.
          </p>
        </div>
      </div>

      {editing && draft ? (
        <Card className="bg-glow-primary">
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-xl font-semibold">
                Edit profile
              </h2>
              <p className="text-sm text-muted-foreground">
                Update your details — your AI coach will adapt.
              </p>
            </div>

            <ProfileFields
              draft={draft}
              onChange={(p) => setDraft((d) => (d ? { ...d, ...p } : d))}
              step="all"
            />

            {updateProfile.isError && (
              <p
                className="text-sm text-destructive"
                data-ocid="profile_edit_error"
              >
                Something went wrong saving your profile. Please try again.
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEdit}
                data-ocid="profile_cancel_button"
              >
                <X className="size-4" aria-hidden="true" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateProfile.isPending}
                data-ocid="profile_save_button"
              >
                <Save className="size-4" aria-hidden="true" />
                {updateProfile.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ProfileSummary profile={profile} onEdit={startEdit} />
      )}
    </div>
  );
}
