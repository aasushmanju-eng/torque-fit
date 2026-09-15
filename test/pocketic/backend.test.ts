import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

// Distinct callers for the friend-isolation test. `createIdentity` derives a
// deterministic principal from a seed phrase and is exported by @dfinity/pic,
// which resolves from this lane directory — unlike @icp-sdk/core, which is only
// a dependency of the frontend package and cannot be reached from app/test/.
const ALICE = createIdentity("alice-seed").getPrincipal();
const BOB = createIdentity("bob-seed").getPrincipal();
// The default caller for the non-isolation tests. The requireUser gate rejects
// only anonymous callers, so the default PocketIC caller (anonymous) must be
// replaced with a non-anonymous principal before any personal-data method runs.
const DEFAULT = createIdentity("default-seed").getPrincipal();

const PROFILE = {
  name: "Ada Lovelace",
  weightKg: 70,
  heightCm: 170,
  age: 30n,
  gender: { female: null },
  goal: { maintain: null },
  activityLevel: { moderate: null },
  targetSport: "Cricket",
};

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
  // Use a non-anonymous caller so the requireUser gate accepts the default
  // caller, then register it so role-guarded methods accept it.
  actor.setPrincipal(DEFAULT);
  await actor._initialize_access_control();
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  await expect(actor.getProfile()).resolves.toEqual([]);
  await expect(actor.getWorkouts()).resolves.toEqual([]);
  await expect(actor.getChallenges()).resolves.toEqual([]);
  await expect(actor.getRewards()).resolves.toEqual([]);
  await expect(actor.getFriends()).resolves.toEqual([]);
  await expect(actor.getFriendRequests()).resolves.toEqual([]);
});

it("round-trips a profile and computes a diet target", async () => {
  await expect(actor.updateProfile(PROFILE)).resolves.toBeNull();
  const profile = await actor.getProfile();
  expect(profile).toEqual([PROFILE]);

  const target = await actor.getDietTarget();
  expect(target.calories).toBeGreaterThan(0n);
  expect(target.protein).toBeGreaterThan(0n);
  expect(target.carbs).toBeGreaterThan(0n);
  expect(target.fat).toBeGreaterThan(0n);
});

it("awards XP and initializes challenges on first profile", async () => {
  const rank = await actor.getRankInfo();
  expect(rank.xp).toBe(0n);
  expect(rank.level).toBe(1n);

  const challenges = await actor.getChallenges();
  expect(challenges.length).toBeGreaterThan(0);
  expect(challenges[0].status).toEqual({ active: null });
});

it("logs a meal and reflects it in the daily totals", async () => {
  const product = {
    code: "3017620422003",
    name: "Test Bar",
    calories: 400,
    protein: 20,
    carbs: 50,
    fat: 10,
  };
  await expect(actor.logFood(product, 100)).resolves.toBeNull();

  const log = await actor.getDailyFoodLog();
  expect(log.entries).toHaveLength(1);
  expect(log.totalCalories).toBeCloseTo(400);
  expect(log.totalProtein).toBeCloseTo(20);
  expect(log.totalCarbs).toBeCloseTo(50);
  expect(log.totalFat).toBeCloseTo(10);
});

it("logs a workout and awards XP", async () => {
  const before = await actor.getRankInfo();
  await expect(
    actor.logWorkout("Upper body", [
      { name: "Bench press", sets: [{ reps: 10n, weightKg: 60 }] },
    ]),
  ).resolves.toBeNull();

  const workouts = await actor.getWorkouts();
  expect(workouts).toHaveLength(1);
  expect(workouts[0].title).toBe("Upper body");

  const after = await actor.getRankInfo();
  expect(after.xp).toBe(before.xp + 25n);
});

it("completes a challenge and awards a reward", async () => {
  // Logging 5 meals completes the "Log 5 meals" challenge (id 2).
  const product = {
    code: "1",
    name: "Meal",
    calories: 100,
    protein: 5,
    carbs: 10,
    fat: 2,
  };
  for (let i = 0; i < 5; i++) {
    await actor.logFood(product, 100);
  }

  const challenges = await actor.getChallenges();
  const mealChallenge = challenges.find((c) => c.id === 2n);
  expect(mealChallenge?.status).toEqual({ completed: null });

  const rewards = await actor.getRewards();
  expect(rewards.some((r) => r.badge === "Meal Logger")).toBe(true);
});

it("isolates friend data between callers", async () => {
  // Register Alice and give her a profile so Bob can find and request her.
  actor.setPrincipal(ALICE);
  await actor._initialize_access_control();
  await actor.updateProfile({ ...PROFILE, name: "Alice" });

  // Register a second caller on the same canister.
  actor.setPrincipal(BOB);
  await actor._initialize_access_control();
  await actor.updateProfile({ ...PROFILE, name: "Bob Builder" });

  // Bob cannot see Alice's friends or requests.
  await expect(actor.getFriends()).resolves.toEqual([]);
  await expect(actor.getFriendRequests()).resolves.toEqual([]);

  // Bob sends a request to Alice.
  const sent = await actor.sendFriendRequest(ALICE);
  expect(sent).toEqual({ ok: null });

  // Alice sees the incoming request and accepts it.
  actor.setPrincipal(ALICE);
  const requests = await actor.getFriendRequests();
  expect(requests).toHaveLength(1);
  expect(requests[0].from).toEqual(BOB);

  const accepted = await actor.respondToFriendRequest(BOB, true);
  expect(accepted).toEqual({ ok: null });

  // Alice now sees Bob as a friend with his rank.
  const friends = await actor.getFriends();
  expect(friends).toHaveLength(1);
  expect(friends[0].principal).toEqual(BOB);
  expect(friends[0].name).toBe("Bob Builder");
  expect(friends[0].rank.level).toBeGreaterThan(0n);
});
