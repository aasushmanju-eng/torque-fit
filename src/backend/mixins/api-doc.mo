mixin () {
  public query func getApiDoc() : async Text {
    "# Torque Fit — Backend API

Torque Fit is a personalized fitness and nutrition app. The backend stores a
user's profile, rank/XP, challenges and rewards, food log, workouts, and
friends, and exposes an AI coach chat endpoint. All data is stored per
principal (the caller's Internet Identity principal).

## Authentication and authorization

Every public method below that reads or writes personal data requires a
**signed-in (non-anonymous) caller** who has been registered. Registration
happens only when a caller signs in through the app's own frontend, which calls
`_initialize_access_control` (or the Internet Identity sign-in flow) once. The
**first** caller to register becomes the **admin**; every subsequent caller
becomes a regular **user**. Anonymous callers are never registered.

A caller can be unregistered even when it belongs to the app's owner: a
principal is only registered when it signs in through the app's frontend, so a
principal that never did so is unregistered even if it is the owner. A
signed-in caller derived against a different origin is a different principal
than the one the frontend registered.

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding
the user's Internet Identity authorization derives the correct per-app
principal against that origin (for example `icp identity link web <name>
--app <host>`). Such a delegation acts with the user's full authority in this
app until it expires.

Personal-data methods below require a **signed-in (non-anonymous)** caller.
They trap for an anonymous caller with `Unauthorized: Only registered users can
perform this action`. A signed-in caller is authorized regardless of whether
they have completed registration or set up a profile: read methods return
empty-state defaults (e.g. `getRankInfo` returns XP 0 / level 1, `getChallenges`
and `getRewards` return empty, `getDailyFoodLog` and `getWorkouts` return empty)
until the caller sets a profile, and mutation methods work once a profile is
set.

The `chat` endpoint traps with `Authentication required: sign in to use the AI
coach` for an anonymous caller.

## Units and encodings

- **Identifiers**: `id` fields (`FoodLogEntry.id`, `Workout.id`, `Challenge.id`,
  `Reward.id`) are `Nat` counters assigned by the backend.
- **Principals**: `Principal` values are Internet Identity principals, encoded
  as text in the API.
- **Timestamps**: `loggedAtNs`, `completedAtNs`, and `earnedAtNs` are `Int`
  nanoseconds since the Unix epoch (UTC). A \"day\" for the food log and streak
  is the UTC day number `ns / 86_400_000_000_000`.
- **Nutrition**: `FoodProduct.calories/protein/carbs/fat` are per 100 g.
  `FoodLogEntry.servingSize` is grams. `DietTarget` values are daily totals
  (kcal and grams).
- **Weight/height**: `Profile.weightKg` and `heightCm` are `Float`.
- **Variants**: `Gender` is `#male | #female | #other`; `FitnessGoal` is
  `#lose | #gain | #maintain`; `ActivityLevel` is `#sedentary | #light |
  #moderate | #active | #veryActive`; `ChallengeStatus` is `#active |
  #completed`; `CoachType` is `#diet | #gym | #cricket | #football |
  #basketball | #swimming`.

## Methods

### Profile

- `getProfile() : async ?Profile` — returns the caller's profile, or `null` if
  none is set. Requires a registered user.
- `updateProfile(profile : Profile) : async ()` — sets the caller's profile.
  The first time a profile is set, the backend initializes the caller's
  challenges, rewards, streak, and XP. Requires a registered user.

### Rank / XP

- `getRankInfo() : async RankInfo` — returns the caller's tier, level, XP, and
  XP needed for the next level. Tier thresholds: bronze < 1000 XP, silver <
  5000, gold < 15000, platinum < 50000, diamond >= 50000. Level is
  `xp / 1000 + 1`. Requires a registered user.

### Challenges and rewards

- `getChallenges() : async [Challenge]` — returns the caller's challenges.
  Requires a registered user.
- `getRewards() : async [Reward]` — returns the caller's earned rewards.
  Requires a registered user.

Challenges progress automatically as the user logs food and workouts; when a
challenge's `progress` reaches its `target`, it becomes `#completed` and a
`Reward` is appended to the caller's rewards.

### Food log

- `getDietTarget() : async DietTarget` — computes the caller's daily calorie
  and macro target from their profile (Mifflin-St Jeor BMR + activity + goal).
  Traps with `Profile not set` if the caller has no profile. Requires a
  registered user.
- `getDailyFoodLog() : async DailyFoodLog` — returns today's food entries and
  running calorie/macro totals. Requires a registered user.
- `logFood(product : FoodProduct, servingSize : Float) : async ()` — appends a
  food log entry, advances the streak and challenge progress, and awards 10 XP.
  Requires a registered user.
- `updateFoodEntry(entryId : Nat, servingSize : Float) : async ()` — updates
  the serving size of one of the caller's entries. Requires a registered user.
- `deleteFoodEntry(entryId : Nat) : async ()` — removes one of the caller's
  entries. Requires a registered user.

### Workouts

- `getWorkouts() : async [Workout]` — returns the caller's workouts. Requires a
  registered user.
- `logWorkout(title : Text, exercises : [Exercise]) : async ()` — appends a
  workout, advances the streak and challenge progress, and awards 25 XP.
  Requires a registered user.

### Friends

- `searchUsers(name : Text) : async [SearchResult]` — searches registered
  profiles by name (case-insensitive substring), excluding the caller. Each
  result is a `SearchResult` record with a `principal` (the user's Principal,
  usable as the `to` argument of `sendFriendRequest`) and a `profile` field.
  Requires a registered user.
- `sendFriendRequest(to : Principal) : async Result<(), Text>` — sends a friend
  request. Returns `#err` if the target is yourself, does not exist, is already
  a friend, or already has a pending request from you. Requires a registered
  user.
- `respondToFriendRequest(from : Principal, accept : Bool) : async
  Result<(), Text>` — accepts or declines a pending request addressed to the
  caller. Returns `#err(\"No pending request from this user\")` if there is none.
  Accepting adds both parties to each other's friend lists. Requires a
  registered user.
- `getFriendRequests() : async [FriendRequest]` — returns the caller's pending
  incoming requests. Requires a registered user.
- `getFriends() : async [FriendView]` — returns the caller's friends with their
  profile name, rank, and challenge progress. Requires a registered user.

### Barcode food lookup

- `searchFoodByBarcode(barcode : Text) : async Result<FoodProduct, Text>` —
  looks up a food product by its barcode (EAN/UPC) via the Open Food Facts API.
  Returns `#err(\"Product not found\")` or `#err(\"Failed to parse response\")` on
  failure. Requires a registered user. Note: only barcode lookup is supported;
  name search is blocked by the upstream service.

### AI chat

- `chat(req : ChatRequest) : async ChatResponse` — sends a message to the
  selected AI coach (diet, gym, cricket, football, basketball, or swimming),
  personalized to the caller's profile. Requires a signed-in, registered
  caller. The response is a single `reply` text.

## Lifecycle and polling

There is no long-running job or polling contract. All methods return
synchronously. `getDailyFoodLog` reflects only the current UTC day; entries
from earlier days are retained in storage but not included in the daily view.

## Mutation retry safety and idempotency

- `updateProfile` is idempotent: setting the same profile again is safe. The
  one-time initialization (challenges/rewards/streak/XP) runs only when no
  profile existed before.
- `logFood` and `logWorkout` append a new entry each call; calling them twice
  creates two entries (not idempotent). `updateFoodEntry` and
  `deleteFoodEntry` target a specific `entryId` and are safe to repeat.
- `sendFriendRequest` guards against duplicates (returns `#err` rather than
  creating a duplicate pending request).
- `respondToFriendRequest` consumes the pending request, so a second call
  returns `#err(\"No pending request from this user\")`.

## Errors, traps, and gotchas

- Personal-data methods trap for anonymous callers (see Authentication above).
  A trap rolls back the whole message and surfaces as a reject to the caller.
- `getDietTarget` traps with `Profile not set` when the caller has no profile.
- `searchFoodByBarcode` depends on the external Open Food Facts service; it can
  fail if the service is unreachable or the barcode is unknown.
- `chat` depends on the Caffeine Inference service; it traps if the inference
  call returns no choices or no text content.
- Friend operations are mutual: accepting a request adds both parties to each
  other's friend lists, and `getFriends` reflects the caller's own friend list
  only.
"
  };
};
