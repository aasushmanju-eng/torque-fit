import { createActor } from "@/backend";
import type { FoodLogEntry, FoodProduct } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { timestampToDate } from "@/lib/api";
import { useCamera } from "@caffeineai/camera";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Flame,
  Pencil,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useRef, useState } from "react";

function useDietTarget() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dietTarget"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDietTarget();
    },
    enabled: !!actor && !isFetching,
  });
}

function useDailyFoodLog() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dailyFoodLog"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyFoodLog();
    },
    enabled: !!actor && !isFetching,
  });
}

function useSearchFoodByBarcode() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (barcode: string) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.searchFoodByBarcode(barcode);
    },
  });
}

function useLogFood() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      product,
      servingSize,
    }: {
      product: FoodProduct;
      servingSize: number;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.logFood(product, servingSize);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dailyFoodLog"] });
      // Food logs advance the "Log 5 meals" challenge and the 7-day streak, so
      // refresh challenges and rank so progress reflects immediately.
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["rankInfo"] });
      void queryClient.invalidateQueries({ queryKey: ["rewards"] });
    },
  });
}

function useUpdateFoodEntry() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      servingSize,
    }: {
      entryId: bigint;
      servingSize: number;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateFoodEntry(entryId, servingSize);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dailyFoodLog"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["rankInfo"] });
    },
  });
}

function useDeleteFoodEntry() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteFoodEntry(entryId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dailyFoodLog"] });
      void queryClient.invalidateQueries({ queryKey: ["challenges"] });
      void queryClient.invalidateQueries({ queryKey: ["rankInfo"] });
    },
  });
}

function MacroBar({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target: number;
}) {
  const pct =
    target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(value)} / {Math.round(target)}g
        </span>
      </div>
      <Progress value={pct} />
    </div>
  );
}

function CameraPreview({
  isActive,
  isSupported,
  isLoading,
  error,
  startCamera,
  stopCamera,
  capturePhoto,
  switchCamera,
  videoRef,
  canvasRef,
  capturedPhoto,
  onCaptured,
  onRetake,
}: {
  isActive: boolean;
  isSupported: boolean | null;
  isLoading: boolean;
  error: { type: string; message: string } | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => Promise<void>;
  capturePhoto: () => Promise<File | null>;
  switchCamera: () => Promise<boolean>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  capturedPhoto: string | null;
  onCaptured: (photo: string) => void;
  onRetake: () => void;
}) {
  const isMobile = useIsMobile();

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      onCaptured(URL.createObjectURL(file));
    }
  };

  if (isSupported === false) {
    return (
      <div
        data-ocid="camera_unsupported"
        className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-border bg-muted/40 text-center"
      >
        <CameraOff
          className="size-8 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          Camera is not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        {capturedPhoto ? (
          <img
            src={capturedPhoto}
            alt="Captured meal"
            className="size-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="size-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            {!isActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
                <Camera className="size-8 text-primary" aria-hidden="true" />
                <p className="px-6 text-sm text-muted-foreground">
                  Start the camera to capture your meal.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div
          data-ocid="camera_error"
          className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <span>{error.message}</span>
          <Button
            data-ocid="camera_retry_button"
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void startCamera()}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {capturedPhoto ? (
          <Button
            data-ocid="camera_retake_button"
            type="button"
            variant="outline"
            className="press"
            onClick={onRetake}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Retake photo
          </Button>
        ) : isActive ? (
          <>
            <Button
              data-ocid="camera_capture_button"
              type="button"
              className="press glow-primary"
              onClick={() => void handleCapture()}
            >
              <Camera className="size-4" aria-hidden="true" />
              Capture meal
            </Button>
            <Button
              data-ocid="camera_stop_button"
              type="button"
              variant="outline"
              className="press"
              onClick={() => void stopCamera()}
            >
              <CameraOff className="size-4" aria-hidden="true" />
              Stop
            </Button>
            {isMobile && (
              <Button
                data-ocid="camera_switch_button"
                type="button"
                variant="outline"
                className="press"
                onClick={() => void switchCamera()}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Switch camera
              </Button>
            )}
          </>
        ) : (
          <Button
            data-ocid="camera_start_button"
            type="button"
            className="press glow-primary"
            disabled={isLoading}
            onClick={() => void startCamera()}
          >
            <Camera className="size-4" aria-hidden="true" />
            Start camera
          </Button>
        )}
      </div>
    </div>
  );
}

async function decodeBarcodeFromImage(
  imageUrl: string,
): Promise<string | null> {
  const img = new Image();
  img.src = imageUrl;
  await img.decode();

  const canvas = document.createElement("canvas");
  const maxDim = 1280;
  const scale = Math.min(
    1,
    maxDim / Math.max(img.naturalWidth, img.naturalHeight),
  );
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;
  const luminance = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j += 1) {
    luminance[j] =
      (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  }

  const source = new RGBLuminanceSource(luminance, width, height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.QR_CODE,
    BarcodeFormat.DATA_MATRIX,
  ]);
  hints.set(DecodeHintType.TRY_HARDER, true);

  try {
    const result = reader.decode(bitmap, hints);
    const text = result.getText();
    return text && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}

export default function CalorieCamera() {
  const isMobile = useIsMobile();
  const {
    isActive,
    isSupported,
    isLoading,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: "environment",
    format: "image/jpeg",
    quality: 0.9,
  });

  const dietTarget = useDietTarget();
  const foodLog = useDailyFoodLog();

  const searchMutation = useSearchFoodByBarcode();
  const logMutation = useLogFood();
  const updateMutation = useUpdateFoodEntry();
  const deleteMutation = useDeleteFoodEntry();

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [barcode, setBarcode] = useState("");
  const [grams, setGrams] = useState(100);
  const [foundProduct, setFoundProduct] = useState<FoodProduct | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [editEntry, setEditEntry] = useState<FoodLogEntry | null>(null);
  const [editGrams, setEditGrams] = useState("100");
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const target = dietTarget.data;
  const log = foodLog.data;

  const handleSearch = () => {
    const code = barcode.trim();
    if (!code) return;
    setSearchError(null);
    setFoundProduct(null);
    searchMutation.mutate(code, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          setFoundProduct(result.ok);
        } else {
          setSearchError(result.err);
        }
      },
      onError: () => {
        setSearchError("Could not reach the food database. Please try again.");
      },
    });
  };

  const handleLog = () => {
    if (!foundProduct) return;
    const product = foundProduct;
    const size = grams;
    setGrams(100);
    setBarcode("");
    setFoundProduct(null);
    logMutation.mutate(
      { product, servingSize: size },
      {
        onError: () => setGrams((cur) => (cur === 100 ? size : cur)),
      },
    );
  };

  const openEdit = (entry: FoodLogEntry) => {
    setEditEntry(entry);
    setEditGrams(String(entry.servingSize));
  };

  const handleSaveEdit = () => {
    if (!editEntry) return;
    const size = Number(editGrams);
    if (!Number.isFinite(size) || size <= 0) return;
    const id = editEntry.id;
    setEditEntry(null);
    updateMutation.mutate({ entryId: id, servingSize: size });
  };

  const handleScanBarcode = () => {
    if (!isActive) {
      void startCamera();
    }
  };

  const handleCaptured = (photo: string) => {
    setCapturedPhoto(photo);
    setSearchError(null);
    setFoundProduct(null);
    setDecoding(true);
    void (async () => {
      try {
        const code = await decodeBarcodeFromImage(photo);
        if (code) {
          setBarcode(code);
          searchMutation.mutate(code, {
            onSuccess: (result) => {
              if (result.__kind__ === "ok") {
                setFoundProduct(result.ok);
              } else {
                setSearchError(result.err);
              }
            },
            onError: () => {
              setSearchError(
                "Could not reach the food database. Please try again.",
              );
            },
          });
        } else {
          // Decoding failed — keep the clear hint asking for manual entry.
          requestAnimationFrame(() => barcodeInputRef.current?.focus());
        }
      } finally {
        setDecoding(false);
      }
    })();
  };

  const caloriesPct =
    target && Number(target.calories) > 0
      ? Math.min(
          100,
          Math.round(
            ((log?.totalCalories ?? 0) / Number(target.calories)) * 100,
          ),
        )
      : 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="animate-rise flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Calorie Camera
        </h1>
        <p className="text-sm text-muted-foreground">
          Capture your meal, look it up by barcode, and log it against your
          daily targets.
        </p>
      </div>

      <div className="stagger grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Log a meal */}
        <Card className="hover-lift lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="size-5 text-primary" aria-hidden="true" />
              Log a meal
            </CardTitle>
            <CardDescription>
              Snap a photo of your meal, then find it by barcode to log it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <CameraPreview
              isActive={isActive}
              isSupported={isSupported}
              isLoading={isLoading}
              error={error}
              startCamera={startCamera}
              stopCamera={stopCamera}
              capturePhoto={capturePhoto}
              switchCamera={switchCamera}
              videoRef={videoRef}
              canvasRef={canvasRef}
              capturedPhoto={capturedPhoto}
              onCaptured={handleCaptured}
              onRetake={() => setCapturedPhoto(null)}
            />

            <div className="space-y-3">
              <Label htmlFor="barcode">Find food by barcode</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <ScanLine
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="barcode"
                    ref={barcodeInputRef}
                    data-ocid="barcode_input"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="e.g. 3017620422003"
                    className="pl-9 focus-ring"
                    inputMode="numeric"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    data-ocid="barcode_search_button"
                    type="button"
                    className="press glow-primary"
                    onClick={handleSearch}
                    disabled={!barcode.trim() || searchMutation.isPending}
                  >
                    <Search className="size-4" aria-hidden="true" />
                    Search
                  </Button>
                  <Button
                    data-ocid="barcode_scan_button"
                    type="button"
                    variant="outline"
                    className="press"
                    onClick={handleScanBarcode}
                  >
                    <Camera className="size-4" aria-hidden="true" />
                    Scan barcode
                  </Button>
                </div>
              </div>

              {decoding ? (
                <div
                  data-ocid="barcode_decoding"
                  className="animate-scale-in flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary"
                >
                  <RefreshCw
                    className="size-4 shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Reading barcode from photo…</span>
                </div>
              ) : capturedPhoto ? (
                <div
                  data-ocid="barcode_captured_hint"
                  className="animate-scale-in flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary"
                >
                  <CheckCircle2
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {barcode
                      ? `Barcode ${barcode} detected — searching…`
                      : "Barcode not detected — enter the number below to look it up."}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isMobile
                    ? "Use the camera above to photograph the barcode, then type the number."
                    : "Point the camera at a barcode to photograph it, then type the number to search."}
                </p>
              )}
            </div>

            {searchMutation.isPending && (
              <div
                data-ocid="barcode_loading"
                className="space-y-2 rounded-lg border border-border p-4"
              >
                <Skeleton className="animate-shimmer h-5 w-2/3" />
                <Skeleton className="animate-shimmer h-4 w-1/3" />
              </div>
            )}

            {searchError && (
              <div
                data-ocid="barcode_error"
                className="animate-scale-in rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {searchError}
              </div>
            )}

            {foundProduct && (
              <div
                data-ocid="food_result"
                className="animate-scale-in space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-semibold">
                      {foundProduct.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Barcode {foundProduct.code}
                    </p>
                  </div>
                  <Badge className="shrink-0">
                    <Flame className="size-3" aria-hidden="true" />
                    {Math.round(foundProduct.calories)} kcal
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-card px-2 py-2">
                    <p className="text-xs text-muted-foreground">Protein</p>
                    <p className="font-semibold">{foundProduct.protein}g</p>
                  </div>
                  <div className="rounded-md bg-card px-2 py-2">
                    <p className="text-xs text-muted-foreground">Carbs</p>
                    <p className="font-semibold">{foundProduct.carbs}g</p>
                  </div>
                  <div className="rounded-md bg-card px-2 py-2">
                    <p className="text-xs text-muted-foreground">Fat</p>
                    <p className="font-semibold">{foundProduct.fat}g</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="servings">Serving size (g)</Label>
                    <Input
                      id="servings"
                      data-ocid="servings_input"
                      type="number"
                      min={1}
                      step={1}
                      value={grams}
                      onChange={(e) => setGrams(Number(e.target.value))}
                      className="focus-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nutrition is per 100 g — enter the amount you ate in
                      grams.
                    </p>
                  </div>
                  <Button
                    data-ocid="log_food_button"
                    type="button"
                    onClick={handleLog}
                    disabled={logMutation.isPending}
                    className="press glow-primary sm:w-auto"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add to log
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily food log */}
        <Card className="hover-lift lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UtensilsCrossed
                className="size-5 text-primary"
                aria-hidden="true"
              />
              Today&apos;s food log
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {foodLog.isLoading || dietTarget.isLoading ? (
              <div data-ocid="food_log_loading" className="space-y-3">
                <Skeleton className="animate-shimmer h-4 w-full" />
                <Skeleton className="animate-shimmer h-2 w-full" />
                <Skeleton className="animate-shimmer h-2 w-full" />
                <Skeleton className="animate-shimmer h-2 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Calories</span>
                    <span className="font-semibold">
                      {Math.round(log?.totalCalories ?? 0)} /{" "}
                      {target ? Math.round(Number(target.calories)) : 0} kcal
                    </span>
                  </div>
                  <Progress value={caloriesPct} />
                </div>
                {target && (
                  <div className="space-y-3">
                    <MacroBar
                      label="Protein"
                      value={log?.totalProtein ?? 0}
                      target={Number(target.protein)}
                    />
                    <MacroBar
                      label="Carbs"
                      value={log?.totalCarbs ?? 0}
                      target={Number(target.carbs)}
                    />
                    <MacroBar
                      label="Fat"
                      value={log?.totalFat ?? 0}
                      target={Number(target.fat)}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Logged meals
              </h2>

              {foodLog.isLoading ? (
                <div data-ocid="food_log_items_loading" className="space-y-2">
                  {Array.from({ length: 3 }, (_, i) => `skeleton-${i}`).map(
                    (id) => (
                      <Skeleton
                        key={id}
                        className="animate-shimmer h-16 w-full"
                      />
                    ),
                  )}
                </div>
              ) : log && log.entries.length > 0 ? (
                <ul className="space-y-2">
                  {log.entries.map((entry) => {
                    const time = timestampToDate(entry.loggedAtNs);
                    const kcal = Math.round(
                      (entry.product.calories * entry.servingSize) / 100,
                    );
                    return (
                      <li
                        key={entry.id.toString()}
                        data-ocid={`food_log_item.${log.entries.indexOf(entry) + 1}`}
                        className="hover-lift flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {entry.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {time
                              ? time.toLocaleTimeString(undefined, {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })
                              : "—"}{" "}
                            · {entry.servingSize} g
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <div className="mr-1 text-right">
                            <p className="text-sm font-semibold">{kcal} kcal</p>
                            <p className="text-xs text-muted-foreground">
                              P{" "}
                              {Math.round(
                                (entry.product.protein * entry.servingSize) /
                                  100,
                              )}{" "}
                              · C{" "}
                              {Math.round(
                                (entry.product.carbs * entry.servingSize) / 100,
                              )}{" "}
                              · F{" "}
                              {Math.round(
                                (entry.product.fat * entry.servingSize) / 100,
                              )}
                            </p>
                          </div>
                          <Button
                            data-ocid={`food_log_edit_button.${log.entries.indexOf(entry) + 1}`}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="press"
                            aria-label={`Edit ${entry.product.name}`}
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            data-ocid={`food_log_delete_button.${log.entries.indexOf(entry) + 1}`}
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="press"
                            aria-label={`Delete ${entry.product.name}`}
                            onClick={() => deleteMutation.mutate(entry.id)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div
                  data-ocid="food_log_empty"
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center"
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                    <UtensilsCrossed
                      className="size-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-sm font-medium">No meals logged yet</p>
                  <p className="max-w-[220px] text-xs text-muted-foreground">
                    Capture a meal and search its barcode to get started.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit serving size dialog */}
      <Dialog
        open={editEntry !== null}
        onOpenChange={(open) => {
          if (!open) setEditEntry(null);
        }}
      >
        <DialogContent data-ocid="edit_serving_dialog">
          <DialogHeader>
            <DialogTitle>Edit serving size</DialogTitle>
            <DialogDescription>
              Adjust the serving size for {editEntry?.product.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edit-servings">Serving size (g)</Label>
            <Input
              id="edit-servings"
              data-ocid="edit_servings_input"
              type="number"
              min={1}
              step={1}
              value={editGrams}
              onChange={(e) => setEditGrams(e.target.value)}
              className="focus-ring"
            />
            <p className="text-xs text-muted-foreground">
              Nutrition is per 100 g — enter the amount you ate in grams.
            </p>
          </div>
          <DialogFooter>
            <Button
              data-ocid="edit_cancel_button"
              type="button"
              variant="outline"
              className="press"
              onClick={() => setEditEntry(null)}
            >
              Cancel
            </Button>
            <Button
              data-ocid="edit_save_button"
              type="button"
              className="press glow-primary"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
