import Principal "mo:core/Principal";

module {
  public type Gender = { #male; #female; #other };
  public type FitnessGoal = { #lose; #gain; #maintain };
  public type ActivityLevel = { #sedentary; #light; #moderate; #active; #veryActive };

  public type Profile = {
    name : Text;
    weightKg : Float;
    heightCm : Float;
    age : Nat;
    gender : Gender;
    goal : FitnessGoal;
    activityLevel : ActivityLevel;
    targetSport : Text;
  };

  public type RankTier = {
    #bronze;
    #silver;
    #gold;
    #platinum;
    #diamond;
  };

  public type RankInfo = {
    tier : RankTier;
    level : Nat;
    xp : Nat;
    xpToNextLevel : Nat;
  };

  public type ChallengeStatus = {
    #active;
    #completed;
  };

  public type Challenge = {
    id : Nat;
    title : Text;
    description : Text;
    target : Nat;
    progress : Nat;
    status : ChallengeStatus;
    rewardPoints : Nat;
    rewardBadge : Text;
  };

  public type Reward = {
    id : Nat;
    badge : Text;
    points : Nat;
    earnedAtNs : Int;
  };

  public type FriendRequestStatus = {
    #pending;
    #accepted;
    #declined;
  };

  public type FriendRequest = {
    from : Principal;
    to : Principal;
    status : FriendRequestStatus;
  };

  public type FriendView = {
    principal : Principal;
    name : Text;
    rank : RankInfo;
    challengeProgress : [Challenge];
  };

  public type SearchResult = {
    principal : Principal;
    profile : Profile;
  };

  public type StreakInfo = {
    var lastDay : Int;
    var current : Nat;
  };

  public type FoodProduct = {
    code : Text;
    name : Text;
    calories : Float; // kcal per 100g
    protein : Float; // g per 100g
    carbs : Float; // g per 100g
    fat : Float; // g per 100g
  };

  public type FoodLogEntry = {
    id : Nat;
    product : FoodProduct;
    servingSize : Float; // grams
    loggedAtNs : Int;
  };

  public type DietTarget = {
    calories : Nat;
    protein : Nat;
    carbs : Nat;
    fat : Nat;
  };

  public type DailyFoodLog = {
    entries : [FoodLogEntry];
    totalCalories : Float;
    totalProtein : Float;
    totalCarbs : Float;
    totalFat : Float;
  };

  public type WorkoutSet = {
    reps : Nat;
    weightKg : Float;
  };

  public type Exercise = {
    name : Text;
    sets : [WorkoutSet];
  };

  public type Workout = {
    id : Nat;
    title : Text;
    exercises : [Exercise];
    completedAtNs : Int;
  };
};
