import { SignInScreen } from "@/components/SignInScreen";
import { LEGAL_LINKS } from "@/lib/types";
import { createMockActor, renderWithProviders } from "@/test/mocks";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The sign-in screen uses useInternetIdentity for the login button. Stub it
// so the component renders without an auth provider, and so login() is a
// no-op the test never triggers.
vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => ({
    login: vi.fn(),
    isInitializing: false,
    isLoggingIn: false,
  }),
}));

const mockActor = createMockActor();

describe("SignInScreen legal links", () => {
  it("renders a link to every legal page before the user signs in", () => {
    renderWithProviders(<SignInScreen />, mockActor);

    // The sign-in screen renders a nav of legal links. Each link's accessible
    // name is the legal page's label, and its href is the page's path, so a
    // user can reach every legal page before authenticating.
    for (const link of LEGAL_LINKS) {
      const anchor = screen.getByRole("link", { name: link.label });
      expect(anchor).toHaveAttribute("href", link.path);
    }
  });

  it("renders the three required legal pages — Privacy, Terms, and Health Disclaimer", () => {
    renderWithProviders(<SignInScreen />, mockActor);

    // The acceptance criteria name Privacy Policy, Terms of Service, and the
    // Health Disclaimer specifically. Assert each is reachable from the
    // sign-in screen by its label and path.
    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", "/privacy");
    expect(
      screen.getByRole("link", { name: "Terms of Service" }),
    ).toHaveAttribute("href", "/terms");
    expect(
      screen.getByRole("link", { name: "Health Disclaimer" }),
    ).toHaveAttribute("href", "/disclaimer");
  });
});
