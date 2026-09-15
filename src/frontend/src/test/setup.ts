import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Unmount every rendered tree after each test so the shared jsdom document
// does not accumulate renders across tests. Without this, queries like
// getByPlaceholderText / getByRole / getByLabelText fail with
// "Found multiple elements" because earlier tests' DOM is still mounted.
afterEach(() => {
  cleanup();
});

// The generated components use `data-ocid` attributes as their primary
// semantic hooks. Configure Testing Library to treat them as test ids so
// queries can target them directly.
configure({ testIdAttribute: "data-ocid" });

// `@/backend` re-exports `ExternalBlob` from `@caffeineai/object-storage`,
// whose dist build has an unresolvable `./dist/blob` import under Vitest.
// The app never constructs blobs in the flows under test, so a stub class is
// sufficient to let the generated bindings load.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {},
}));

// jsdom does not implement Element.prototype.scrollIntoView, which the chat
// components call in a scroll effect. Stub it so those effects are no-ops.
Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  value: () => {},
});

// jsdom does not implement pointer capture, which Radix Select calls when a
// pointer event is dispatched. Stub the methods so the select can open and
// close during onboarding interactions.
Object.defineProperty(Element.prototype, "hasPointerCapture", {
  configurable: true,
  value: () => false,
});
Object.defineProperty(Element.prototype, "setPointerCapture", {
  configurable: true,
  value: () => {},
});
Object.defineProperty(Element.prototype, "releasePointerCapture", {
  configurable: true,
  value: () => {},
});
