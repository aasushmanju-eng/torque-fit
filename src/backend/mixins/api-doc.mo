mixin () {
  public query func getApiDoc() : async Text {
    "# Torque Fit — Backend API

Torque Fit is a personalized fitness and nutrition app. The backend stores a
user's profile, rank/XP, challenges and rewards, food log, workouts, friends,
workout reminders, challenge photo proofs, and per-pair friend chat messages,
and exposes an AI coach chat endpoint. All data is stored per principal (the
caller's Internet Identity principal).

## Authentication and authorization

Every public method below that reads or writes personal data requires a
**signed-in (non-anonymous) caller**. Anonymous callers trap with
`Unauthorized: Only registered users can perform this action` on personal-data
methods. A signed-in caller is authorized regardless of whether they have
completed onboarding: read methods return empty-state defaults (e.g.
`getRankInfo` returns XP 0 / level 1, `getChallenges` and `getRewards` return
empty, `getDailyFoodLog` and `getWorkouts` return empty) until the caller sets
a profile, and mutation methods work once a profile is set.

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding
the user's Internet Identity authorization derives the correct per-app
principal against that origin (for example `icp identity link web <name>
--app <host>`). Such a delegation acts with the user's full authority in this
app until it expires.

The `chat` endpoint does NOT trap for an anonymous or un-onboarded caller.
Instead it returns a `ChatResponse` with a guidance message in the `reply`
field: an anonymous caller receives `Please sign in with Internet Identity to
use the AI coach.`, and a signed-in caller with no completed profile receives
`Please complete your profile in the Profile tab first, then I can coach you.`
The real \"registered\" signal for this app is a completed profile (set via
`updateProfile`); there is no separate AccessControl role check on `chat`.

## Units and encodings

- **Identifiers**: `id` fields (`FoodLogEntry.id`, `Workout.id`, `Challenge.id`,
  `Reward.id`, `ChatMessage.id`, `WorkoutReminder.id`, `ChallengeProof.id`) are
  `Nat` counters assigned by the backend.
- **Principals**: `Principal` values are Internet Identity principals, encoded
  as text in the API.
- **Timestamps**: `loggedAtNs`, `completedAtNs`, `earnedAtNs`, `sentAtNs`, and
  `submittedAtNs` are `Int` nanoseconds since the Unix epoch (UTC). A \"day\"
  for the food log and streak is the UTC day number `ns / 86_400_000_000_000`.
- **Reminder days**: `WorkoutReminder.days` is an array of weekday numbers
  (0 = Monday ... 6 = Sunday); `timeMinutes` is minutes since midnight.
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
  Requires a signed-in caller.
- `getRewards() : async [Reward]` — returns the caller's earned rewards.
  Requires a signed-in caller.

Challenges progress automatically as the user logs food and workouts; when a
challenge's `progress` reaches its `target`, it becomes `#completed` and a
`Reward` is appended to the caller's rewards and the reward's points are added
to the caller's XP.

The **7-day streak challenge (id 1)** is tracked automatically: its `progress`
field reflects the caller's current consecutive-day streak, and its `target` is
7. The streak advances when the user logs food or completes a workout on a new
UTC day, increments on consecutive days, and resets to 1 on a gap. When the
streak reaches 7 the challenge auto-completes, awarding the `Streak Master`
badge and 100 XP. It does NOT accept photo proofs — `submitChallengeProof`
rejects it with `The 7-day streak challenge is tracked automatically — no
photo proof needed.`

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

### Friends chat

- `sendMessage(to : Principal, text : Text) : async Result<(), Text>` — sends a
  message from the caller to a friend. Returns `#err(\"Recipient is not your
  friend\")` if `to` is not in the caller's friend list, and `#err(\"Cannot
  message yourself\")` if `to` is the caller. The message is stored in the
  per-pair history for both parties with a `sentAtNs` timestamp. Requires a
  registered user.
- `getConversation(friend : Principal) : async [ChatMessage]` — returns the
  message history between the caller and `friend`, oldest first. Requires a
  registered user.
- `getConversations() : async [Conversation]` — returns all of the caller's
  conversations, each a `Conversation` record with a `friend` principal and the
  `messages` between them. Requires a registered user.

### Workout reminders

- `addWorkoutReminder(days : [Nat], timeMinutes : Nat, title : Text) : async
  Nat` — schedules a new workout reminder for the caller and returns its `id`.
  `days` is an array of weekday numbers (0 = Monday ... 6 = Sunday);
  `timeMinutes` is minutes since midnight. Requires a registered user.
- `listWorkoutReminders() : async [WorkoutReminder]` — returns the caller's
  workout reminders. Requires a registered user.
- `updateWorkoutReminder(id : Nat, days : [Nat], timeMinutes : Nat, title :
  Text) : async Result<(), Text>` — replaces the fields of the caller's
  reminder with the given `id`. Requires a registered user.
- `removeWorkoutReminder(id : Nat) : async Result<(), Text>` — deletes the
  caller's reminder with the given `id`. Requires a registered user.

### Challenge photo proofs

- `submitChallengeProof(challengeId : Nat, proofRef : Text) : async Result<(),
  Text>` — records a photo proof for a challenge the caller is participating
  in. `proofRef` is a reference to the proof file stored via the platform's
  file storage. Returns `#err(\"The 7-day streak challenge is tracked
  automatically — no photo proof needed.\")` if `challengeId` is 1 (the streak
  challenge is auto-tracked and accepts no photo proofs). Requires a signed-in
  caller.
- `getChallengeProofs(challengeId : Nat) : async [ChallengeProof]` — returns
  the caller's photo proofs for the given challenge. Requires a signed-in
  caller.

### Barcode food lookup

- `searchFoodByBarcode(barcode : Text) : async Result<FoodProduct, Text>` —
  looks up a food product by its barcode (EAN/UPC) via the Open Food Facts API.
  Returns `#err(\"Product not found\")` or `#err(\"Failed to parse response\")` on
  failure. Requires a registered user. Note: only barcode lookup is supported;
  name search is blocked by the upstream service.

### AI chat

- `chat(req : ChatRequest) : async ChatResponse` — sends a message to the
  selected AI coach (diet, gym, cricket, football, basketball, or swimming),
  personalized to the caller's profile. The response is a single `reply` text.
  This endpoint does NOT trap for an anonymous or un-onboarded caller: an
  anonymous caller receives a reply asking them to sign in, and a signed-in
  caller with no completed profile receives a reply asking them to complete
  their profile first. If the inference service call fails (network, auth, or
  service error, or an empty/no-content response), the endpoint returns a
  `ChatResponse` with `I couldn't reach the inference service right now. Please
  try again.` in the `reply` field rather than trapping, so the frontend can
  surface a retry path.

### Data intelligence (OQL)

- `schema() : async Text` — returns the JSON schema of the queryable entities.
- `execute(query : Text) : async Text` — runs a JSON query over the queryable
  entities and returns the result rows as JSON.

These endpoints are provided by the OQL `Expose` mixin. Every persisted
(non-transient) collection is exposed as a queryable entity: `profile`,
`workout`, `foodLogEntry`, `challenge`, `reward`, `friend`, `chatMessage`,
`workoutReminder`, and `challengeProof`. Each entity is scoped per user
(`controllerOrScoped`): a signed-in caller can only read rows owned by their
own principal, while the platform controller can read all rows. The `execute`
query language supports filtering, ordering, pagination, and aggregation over
these entities.

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
- `sendMessage` appends a new message each call; calling it twice sends two
  messages (not idempotent). It refuses to send to a non-friend.
- `addWorkoutReminder` creates a new reminder each call (not idempotent).
  `updateWorkoutReminder` and `removeWorkoutReminder` target a specific `id`
  and are safe to repeat.
- `submitChallengeProof` appends a new proof each call (not idempotent).

## Errors, traps, and gotchas

- Personal-data methods trap for anonymous callers (see Authentication above).
  A trap rolls back the whole message and surfaces as a reject to the caller.
- `getDietTarget` traps with `Profile not set` when the caller has no profile.
- `searchFoodByBarcode` depends on the external Open Food Facts service; it can
  fail if the service is unreachable or the barcode is unknown.
- `chat` depends on the Caffeine Inference service; on a failed inference call
  (network, auth, service error, or empty/no-content response) it returns a
  `ChatResponse` with a retry message in `reply` instead of trapping.
- `submitChallengeProof` returns `#err` (does not trap) for the streak
  challenge (id 1), which is auto-tracked and accepts no photo proofs.
- Friend operations are mutual: accepting a request adds both parties to each
  other's friend lists, and `getFriends` reflects the caller's own friend list
  only.
"
  };
};
