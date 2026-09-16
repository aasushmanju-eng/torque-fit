import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Gender = { #male; #female; #other };
  type FitnessGoal = { #lose; #gain; #maintain };
  type ActivityLevel = { #sedentary; #light; #moderate; #active; #veryActive };
  type Profile = {
    name : Text;
    weightKg : Float;
    heightCm : Float;
    age : Nat;
    gender : Gender;
    goal : FitnessGoal;
    activityLevel : ActivityLevel;
    targetSport : Text;
  };
  type ChallengeStatus = { #active; #completed };
  type Challenge = {
    id : Nat;
    title : Text;
    description : Text;
    target : Nat;
    progress : Nat;
    status : ChallengeStatus;
    rewardPoints : Nat;
    rewardBadge : Text;
  };
  type Reward = { id : Nat; badge : Text; points : Nat; earnedAtNs : Int };
  type StreakInfo = { var lastDay : Int; var current : Nat };
  type FriendRequestStatus = { #pending; #accepted; #declined };
  type FriendRequest = { from : Principal; to : Principal; status : FriendRequestStatus };
  type FoodProduct = {
    code : Text;
    name : Text;
    calories : Float;
    protein : Float;
    carbs : Float;
    fat : Float;
  };
  type FoodLogEntry = { id : Nat; product : FoodProduct; servingSize : Float; loggedAtNs : Int };
  type WorkoutSet = { reps : Nat; weightKg : Float };
  type Exercise = { name : Text; sets : [WorkoutSet] };
  type Workout = { id : Nat; title : Text; exercises : [Exercise]; completedAtNs : Int };

  // New types introduced by this migration.
  type ChatMessage = { id : Nat; from : Principal; to : Principal; text : Text; sentAtNs : Int };
  type WorkoutReminder = { id : Nat; days : [Nat]; timeMinutes : Nat; title : Text };
  type ChallengeProof = { id : Nat; challengeId : Nat; proofRef : Text; submittedAtNs : Int };

  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<Principal, Profile>;
    xp : Map.Map<Principal, Nat>;
    challengeList : Map.Map<Principal, [Challenge]>;
    rewards : Map.Map<Principal, [Reward]>;
    streaks : Map.Map<Principal, StreakInfo>;
    friendRequests : List.List<FriendRequest>;
    friends : Map.Map<Principal, [Principal]>;
    foodLog : Map.Map<Principal, [FoodLogEntry]>;
    workouts : Map.Map<Principal, [Workout]>;
    state : { var nextId : Nat };
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    profiles : Map.Map<Principal, Profile>;
    xp : Map.Map<Principal, Nat>;
    challengeList : Map.Map<Principal, [Challenge]>;
    rewards : Map.Map<Principal, [Reward]>;
    streaks : Map.Map<Principal, StreakInfo>;
    friendRequests : List.List<FriendRequest>;
    friends : Map.Map<Principal, [Principal]>;
    foodLog : Map.Map<Principal, [FoodLogEntry]>;
    workouts : Map.Map<Principal, [Workout]>;
    state : { var nextId : Nat };
    messages : Map.Map<Principal, Map.Map<Principal, [ChatMessage]>>;
    reminders : Map.Map<Principal, [WorkoutReminder]>;
    proofs : Map.Map<Principal, [ChallengeProof]>;
  };

  public func migration(old : OldActor) : NewActor {
    {
      accessControlState = old.accessControlState;
      profiles = old.profiles;
      xp = old.xp;
      challengeList = old.challengeList;
      rewards = old.rewards;
      streaks = old.streaks;
      friendRequests = old.friendRequests;
      friends = old.friends;
      foodLog = old.foodLog;
      workouts = old.workouts;
      state = old.state;
      messages = Map.empty();
      reminders = Map.empty();
      proofs = Map.empty();
    };
  };
};
