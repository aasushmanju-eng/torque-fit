import { CookieConsent } from "@/components/CookieConsent";
import { Layout } from "@/components/Layout";
import { LegalLayout } from "@/components/LegalLayout";
import { SignInScreen } from "@/components/SignInScreen";
import { useProfile } from "@/hooks/useQueries";
import CalorieCamera from "@/pages/CalorieCamera";
import Challenges from "@/pages/Challenges";
import CookiesPage from "@/pages/CookiesPage";
import Dashboard from "@/pages/Dashboard";
import DietCoach from "@/pages/DietCoach";
import DisclaimerPage from "@/pages/DisclaimerPage";
import Friends from "@/pages/Friends";
import GymMentor from "@/pages/GymMentor";
import IpPage from "@/pages/IpPage";
import PricingPage from "@/pages/PricingPage";
import PrivacyPage from "@/pages/PrivacyPage";
import Profile from "@/pages/Profile";
import Rank from "@/pages/Rank";
import TermsPage from "@/pages/TermsPage";
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
  component: () => (
    <>
      <Layout />
      <CookieConsent />
    </>
  ),
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

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

const disclaimerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/disclaimer",
  component: DisclaimerPage,
});

const cookiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/cookies",
  component: CookiesPage,
});

const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pricing",
  component: PricingPage,
});

const ipRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ip",
  component: IpPage,
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
  privacyRoute,
  termsRoute,
  disclaimerRoute,
  cookiesRoute,
  pricingRoute,
  ipRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/**
 * Standalone router for the legal content pages. It is rendered OUTSIDE the
 * auth gate so the legal links on the sign-in screen actually navigate to
 * their pages before the user signs in. The legal pages render inside a
 * dedicated LegalLayout (same design language, no authenticated sidebar), and
 * the "/" route shows the sign-in screen so the "Back to dashboard" link in
 * LegalPage resolves pre-login.
 */
const legalRootRoute = createRootRoute({
  component: () => <Outlet />,
});

const legalLayoutRoute = createRoute({
  getParentRoute: () => legalRootRoute,
  id: "legal-layout",
  component: LegalLayout,
});

const legalPrivacyRoute = createRoute({
  getParentRoute: () => legalLayoutRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const legalTermsRoute = createRoute({
  getParentRoute: () => legalLayoutRoute,
  path: "/terms",
  component: TermsPage,
});

const legalDisclaimerRoute = createRoute({
  getParentRoute: () => legalLayoutRoute,
  path: "/disclaimer",
  component: DisclaimerPage,
});

const legalCookiesRoute = createRoute({
  getParentRoute: () => legalLayoutRoute,
  path: "/cookies",
  component: CookiesPage,
});

const legalPricingRoute = createRoute({
  getParentRoute: () => legalLayoutRoute,
  path: "/pricing",
  component: PricingPage,
});

const legalIpRoute = createRoute({
  getParentRoute: () => legalLayoutRoute,
  path: "/ip",
  component: IpPage,
});

const legalSignInRoute = createRoute({
  getParentRoute: () => legalRootRoute,
  path: "/",
  component: SignInScreen,
});

const legalRouteTree = legalRootRoute.addChildren([
  legalLayoutRoute.addChildren([
    legalPrivacyRoute,
    legalTermsRoute,
    legalDisclaimerRoute,
    legalCookiesRoute,
    legalPricingRoute,
    legalIpRoute,
  ]),
  legalSignInRoute,
]);

const legalRouter = createRouter({ routeTree: legalRouteTree });

/** Paths that must be reachable before sign-in. */
const LEGAL_PATHS = [
  "/privacy",
  "/terms",
  "/disclaimer",
  "/cookies",
  "/pricing",
  "/ip",
];

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
    const pathname = window.location.pathname;
    if (LEGAL_PATHS.includes(pathname)) {
      return <RouterProvider router={legalRouter} />;
    }
    return <SignInScreen />;
  }

  return <RouterProvider router={router} />;
}
