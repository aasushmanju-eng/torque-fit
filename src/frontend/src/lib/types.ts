import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Camera,
  Dumbbell,
  LayoutDashboard,
  Medal,
  Salad,
  Trophy,
  Users,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    description: "Your daily overview, macros, and XP progress.",
  },
  {
    label: "AI Diet Coach",
    path: "/diet-coach",
    icon: Salad,
    description:
      "Personalized nutrition guidance tuned to your body and goals.",
  },
  {
    label: "AI Gym Mentor & Sports",
    path: "/gym-mentor",
    icon: Dumbbell,
    description: "Training plans and form coaching from your AI mentor.",
  },
  {
    label: "Calorie Camera",
    path: "/calorie-camera",
    icon: Camera,
    description: "Snap a meal and get instant calorie and macro estimates.",
  },
  {
    label: "Workouts",
    path: "/workouts",
    icon: Activity,
    description: "Log sessions, track volume, and hit your weekly targets.",
  },
  {
    label: "Challenges & Rewards",
    path: "/challenges",
    icon: Trophy,
    description: "Earn XP and unlock rewards as you stay consistent.",
  },
  {
    label: "Friends",
    path: "/friends",
    icon: Users,
    description: "Connect with training partners and share progress.",
  },
  {
    label: "Profile",
    path: "/profile",
    icon: Medal,
    description: "Your stats, personalization, and account settings.",
  },
  {
    label: "Rank & Rewards",
    path: "/rank",
    icon: Trophy,
    description: "Your tier, level, XP, and earned badges.",
  },
];
