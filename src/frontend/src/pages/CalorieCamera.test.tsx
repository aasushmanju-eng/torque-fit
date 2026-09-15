import CalorieCamera from "@/pages/CalorieCamera";
import {
  type MockActor,
  createMockActor,
  renderWithProviders,
} from "@/test/mocks";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
}));

vi.mock("@caffeineai/camera", () => ({
  useCamera: () => ({
    isActive: false,
    isSupported: true,
    isLoading: false,
    error: null,
    startCamera: vi.fn().mockResolvedValue(true),
    stopCamera: vi.fn().mockResolvedValue(undefined),
    capturePhoto: vi.fn().mockResolvedValue(null),
    switchCamera: vi.fn().mockResolvedValue(true),
    videoRef: { current: null },
    canvasRef: { current: null },
  }),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

let mockActor: MockActor;

const DIET_TARGET = { calories: 2000n, protein: 150n, carbs: 200n, fat: 70n };

const PRODUCT = {
  name: "Greek Yogurt",
  code: "3017620422003",
  calories: 59,
  protein: 10,
  carbs: 3.6,
  fat: 0.4,
};

const EMPTY_LOG = {
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
  entries: [],
};

beforeEach(() => {
  mockActor = createMockActor();
  mockActor.getDietTarget.mockResolvedValue(DIET_TARGET);
  mockActor.getDailyFoodLog.mockResolvedValue(EMPTY_LOG);
  mockActor.searchFoodByBarcode.mockResolvedValue({
    __kind__: "ok",
    ok: PRODUCT,
  });
  mockActor.logFood.mockResolvedValue(undefined);
});

describe("CalorieCamera", () => {
  it("searches a barcode and shows the found product", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalorieCamera />, mockActor);

    await waitFor(() => {
      expect(screen.getByLabelText("Find food by barcode")).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText("Find food by barcode"),
      "3017620422003",
    );
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(mockActor.searchFoodByBarcode).toHaveBeenCalledWith(
        "3017620422003",
      );
    });
    await waitFor(() => {
      expect(screen.getByText("Greek Yogurt")).toBeInTheDocument();
    });
    expect(screen.getByText("59 kcal")).toBeInTheDocument();
  });

  it("logs the found food and updates the daily totals", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CalorieCamera />, mockActor);

    await waitFor(() => {
      expect(screen.getByLabelText("Find food by barcode")).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText("Find food by barcode"),
      "3017620422003",
    );
    await user.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(screen.getByText("Greek Yogurt")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /add to log/i }));

    await waitFor(() => {
      expect(mockActor.logFood).toHaveBeenCalledWith(PRODUCT, 100);
    });
  });
});
