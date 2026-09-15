import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface RankInfo {
    xp: bigint;
    tier: RankTier;
    level: bigint;
    xpToNextLevel: bigint;
}
export interface SearchResult {
    principal: Principal;
    profile: Profile;
}
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface HttpRequestResult {
    status: bigint;
    body: Uint8Array;
    headers: Array<HttpHeader>;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Profile {
    age: bigint;
    activityLevel: ActivityLevel;
    targetSport: string;
    heightCm: number;
    goal: FitnessGoal;
    name: string;
    weightKg: number;
    gender: Gender;
}
export type Result_1 = {
    __kind__: "ok";
    ok: FoodProduct;
} | {
    __kind__: "err";
    err: string;
};
export interface FoodProduct {
    fat: number;
    carbs: number;
    code: string;
    calories: number;
    name: string;
    protein: number;
}
export interface Challenge {
    id: bigint;
    status: ChallengeStatus;
    title: string;
    rewardPoints: bigint;
    description: string;
    progress: bigint;
    target: bigint;
    rewardBadge: string;
}
export interface FriendRequest {
    to: Principal;
    status: FriendRequestStatus;
    from: Principal;
}
export interface WorkoutSet {
    reps: bigint;
    weightKg: number;
}
export interface ChatRequest {
    coach: CoachType;
    message: string;
    profile: UserProfile;
}
export interface TransformationInput {
    context: Uint8Array;
    response: HttpRequestResult;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface DailyFoodLog {
    totalCarbs: number;
    totalFat: number;
    entries: Array<FoodLogEntry>;
    totalCalories: number;
    totalProtein: number;
}
export interface Workout {
    id: bigint;
    completedAtNs: bigint;
    title: string;
    exercises: Array<Exercise>;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface FoodLogEntry {
    id: bigint;
    loggedAtNs: bigint;
    servingSize: number;
    product: FoodProduct;
}
export interface Exercise {
    name: string;
    sets: Array<WorkoutSet>;
}
export interface DietTarget {
    fat: bigint;
    carbs: bigint;
    calories: bigint;
    protein: bigint;
}
export interface Reward {
    id: bigint;
    earnedAtNs: bigint;
    badge: string;
    points: bigint;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface HttpHeader {
    value: string;
    name: string;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: string;
};
export interface ChatResponse {
    reply: string;
}
export interface UserProfile {
    age: bigint;
    goal: string;
    weightKg: number;
    gender: string;
}
export interface FriendView {
    principal: Principal;
    name: string;
    rank: RankInfo;
    challengeProgress: Array<Challenge>;
}
export enum ActivityLevel {
    active = "active",
    veryActive = "veryActive",
    light = "light",
    sedentary = "sedentary",
    moderate = "moderate"
}
export enum ChallengeStatus {
    active = "active",
    completed = "completed"
}
export enum CoachType {
    gym = "gym",
    basketball = "basketball",
    swimming = "swimming",
    football = "football",
    diet = "diet",
    cricket = "cricket"
}
export enum FitnessGoal {
    gain = "gain",
    lose = "lose",
    maintain = "maintain"
}
export enum FriendRequestStatus {
    pending = "pending",
    accepted = "accepted",
    declined = "declined"
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male"
}
export enum RankTier {
    bronze = "bronze",
    gold = "gold",
    diamond = "diamond",
    platinum = "platinum",
    silver = "silver"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    chat(req: ChatRequest): Promise<ChatResponse>;
    deleteFoodEntry(entryId: bigint): Promise<void>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getChallenges(): Promise<Array<Challenge>>;
    getDailyFoodLog(): Promise<DailyFoodLog>;
    getDietTarget(): Promise<DietTarget>;
    getFriendRequests(): Promise<Array<FriendRequest>>;
    getFriends(): Promise<Array<FriendView>>;
    getProfile(): Promise<Profile | null>;
    getRankInfo(): Promise<RankInfo>;
    getRewards(): Promise<Array<Reward>>;
    getWorkouts(): Promise<Array<Workout>>;
    isCallerAdmin(): Promise<boolean>;
    logFood(product: FoodProduct, servingSize: number): Promise<void>;
    logWorkout(title: string, exercises: Array<Exercise>): Promise<void>;
    respondToFriendRequest(from: Principal, accept: boolean): Promise<Result>;
    schema(): Promise<string>;
    searchFoodByBarcode(barcode: string): Promise<Result_1>;
    searchUsers(name: string): Promise<Array<SearchResult>>;
    sendFriendRequest(to: Principal): Promise<Result>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateFoodEntry(entryId: bigint, servingSize: number): Promise<void>;
    updateProfile(profile: Profile): Promise<void>;
}
