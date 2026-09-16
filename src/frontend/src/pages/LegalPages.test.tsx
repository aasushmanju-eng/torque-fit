import CookiesPage from "@/pages/CookiesPage";
import DisclaimerPage from "@/pages/DisclaimerPage";
import IpPage from "@/pages/IpPage";
import PricingPage from "@/pages/PricingPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import { createMockActor, renderWithProviders } from "@/test/mocks";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The legal pages are static content shells that render a title, a "Last
// updated" line, and titled sections. They do not call the backend actor. The
// only router dependency is the `Link` back button, which we stub to a plain
// anchor so the pages render without a full router.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: { children: React.ReactNode } & Record<string, unknown>) => (
    <a {...props}>{children}</a>
  ),
}));

const mockActor = createMockActor();

describe("Legal pages", () => {
  it("renders the Privacy Policy with its sections", () => {
    renderWithProviders(<PrivacyPage />, mockActor);
    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "1. Information We Collect" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });

  it("renders the Terms of Service with its sections", () => {
    renderWithProviders(<TermsPage />, mockActor);
    expect(
      screen.getByRole("heading", { name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "1. Acceptance of Terms" }),
    ).toBeInTheDocument();
  });

  it("renders the health & fitness disclaimer", () => {
    renderWithProviders(<DisclaimerPage />, mockActor);
    expect(
      screen.getByRole("heading", { name: "Health & Fitness Disclaimer" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Not Medical Advice" }),
    ).toBeInTheDocument();
  });

  it("renders the cookies & data consent page", () => {
    renderWithProviders(<CookiesPage />, mockActor);
    expect(
      screen.getByRole("heading", { name: "Cookies & Data Consent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Your Consent Choices" }),
    ).toBeInTheDocument();
  });

  it("renders the pricing & billing terms", () => {
    renderWithProviders(<PricingPage />, mockActor);
    expect(
      screen.getByRole("heading", { name: "Pricing & Billing" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cancellation and Refunds" }),
    ).toBeInTheDocument();
  });

  it("renders the IP, trademark & compliance page", () => {
    renderWithProviders(<IpPage />, mockActor);
    expect(
      screen.getByRole("heading", { name: "IP, Trademark & Compliance" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Open-Source Compliance" }),
    ).toBeInTheDocument();
  });
});
