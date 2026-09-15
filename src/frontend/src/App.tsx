import { Layout } from "@/components/Layout";
import { SignInScreen } from "@/components/SignInScreen";
import { useProfile } from "@/hooks/useQueries";
import CalorieCamera from "@/pages/CalorieCamera";
import Challenges from "@/pages/Challenges";
import Dashboard from "@/pages/Dashboard";
import DietCoach from "@/pages/DietCoach";
import Friends from "@/pages/Friends";
import GymMentor from "@/pages/GymMentor";
import Profile from "@/pages/Profile";
import Rank from "@/pages/Rank";
import Workouts from "@/pages/Workouts";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Navigate,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => <Layout />,
});

/**
 * Guards the default dashboard route. A freshly signed-in user without a
 * profile would otherwise hit getDietTarget and trap with "Profile not set",
 * so redirect them to the Profile page, which shows the onboarding flow.
 */
function DashboardGate() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/profile" replace />;
  }

  return <Dashboard />;
}

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardGate,
});

const dietCoachRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/diet-coach",
  component: DietCoach,
});

const gymMentorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gym-mentor",
  component: GymMentor,
});

const calorieCameraRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/calorie-camera",
  component: CalorieCamera,
});

const workoutsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workouts",
  component: Workouts,
});

const challengesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/challenges",
  component: Challenges,
});

const friendsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/friends",
  component: Friends,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: Profile,
});

const rankRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/rank",
  component: Rank,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dietCoachRoute,
  gymMentorRoute,
  calorieCameraRoute,
  workoutsRoute,
  challengesRoute,
  friendsRoute,
  profileRoute,
  rankRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        <span className="text-sm text-muted-foreground">
          Loading Torque Fit…
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return <RouterProvider router={router} />;
}
