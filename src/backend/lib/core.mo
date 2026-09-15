import Float "mo:core/Float";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Types "../types/core";

module {
  public func emptyProfile() : Types.Profile {
    {
      name = "";
      weightKg = 0.0;
      heightCm = 0.0;
      age = 0;
      gender = #other;
      goal = #maintain;
      activityLevel = #moderate;
      targetSport = "";
    };
  };

  // Rank system: XP drives a level and a named tier.
  public func getRankInfo(xp : Nat) : Types.RankInfo {
    let tier = if (xp >= 50000) {
      #diamond;
    } else if (xp >= 15000) {
      #platinum;
    } else if (xp >= 5000) {
      #gold;
    } else if (xp >= 1000) {
      #silver;
    } else {
      #bronze;
    };
    let level = xp / 1000 + 1;
    let nextLevelXp = level * 1000;
    { tier; level; xp; xpToNextLevel = nextLevelXp - xp };
  };

  public func addXp(currentXp : Nat, amount : Nat) : Nat {
    currentXp + amount;
  };

  // Daily calorie/macro target from the profile (Mifflin-St Jeor BMR + activity + goal).
  public func computeDietTarget(profile : Types.Profile) : Types.DietTarget {
    let bmr = switch (profile.gender) {
      case (#male) {
        10.0 * profile.weightKg + 6.25 * profile.heightCm - 5.0 * profile.age.toFloat() + 5.0;
      };
      case (#female) {
        10.0 * profile.weightKg + 6.25 * profile.heightCm - 5.0 * profile.age.toFloat() - 161.0;
      };
      case (#other) {
        10.0 * profile.weightKg + 6.25 * profile.heightCm - 5.0 * profile.age.toFloat() - 78.0;
      };
    };
    let activityMult = switch (profile.activityLevel) {
      case (#sedentary) { 1.2 };
      case (#light) { 1.375 };
      case (#moderate) { 1.55 };
      case (#active) { 1.725 };
      case (#veryActive) { 1.9 };
    };
    let tdee = bmr * activityMult;
    let goalAdj = switch (profile.goal) {
      case (#lose) { -500.0 };
      case (#gain) { 500.0 };
      case (#maintain) { 0.0 };
    };
    let raw = tdee + goalAdj;
    let cal = if (raw < 1200.0) { 1200.0 } else { raw };
    {
      calories = Int.abs(cal.toInt());
      protein = Int.abs((cal * 0.30 / 4.0).toInt());
      carbs = Int.abs((cal * 0.40 / 4.0).toInt());
      fat = Int.abs((cal * 0.30 / 9.0).toInt());
    };
  };

  // Default challenge set for a new user.
  public func newChallenges() : [Types.Challenge] {
    [
      {
        id = 1;
        title = "7-day streak";
        description = "Log activity 7 days in a row";
        target = 7;
        progress = 0;
        status = #active;
        rewardPoints = 100;
        rewardBadge = "Streak Master";
      },
      {
        id = 2;
        title = "Log 5 meals";
        description = "Log 5 meals";
        target = 5;
        progress = 0;
        status = #active;
        rewardPoints = 50;
        rewardBadge = "Meal Logger";
      },
      {
        id = 3;
        title = "Complete 3 workouts";
        description = "Complete 3 workouts";
        target = 3;
        progress = 0;
        status = #active;
        rewardPoints = 150;
        rewardBadge = "Workout Warrior";
      },
    ];
  };

  // Day number (UTC) for a nanosecond timestamp.
  public func dayOf(ns : Int) : Int {
    ns / 86_400_000_000_000;
  };

  // Advance a streak given the current time. Mutates the passed record.
  public func updateStreak(streak : Types.StreakInfo, nowNs : Int) : Types.StreakInfo {
    let day = dayOf(nowNs);
    if (streak.lastDay < 0) {
      streak.lastDay := day;
      streak.current := 1;
    } else if (day == streak.lastDay) {
      // same day: no change
    } else if (day == streak.lastDay + 1) {
      streak.current += 1;
      streak.lastDay := day;
    } else {
      streak.current := 1;
      streak.lastDay := day;
    };
    streak;
  };

  // Running calorie/macro totals for a set of food log entries.
  public func foodLogTotals(entries : [Types.FoodLogEntry]) : Types.DailyFoodLog {
    var cal = 0.0;
    var prot = 0.0;
    var carb = 0.0;
    var fat = 0.0;
    for (e in entries.values()) {
      let factor = e.servingSize / 100.0;
      cal += e.product.calories * factor;
      prot += e.product.protein * factor;
      carb += e.product.carbs * factor;
      fat += e.product.fat * factor;
    };
    {
      entries;
      totalCalories = cal;
      totalProtein = prot;
      totalCarbs = carb;
      totalFat = fat;
    };
  };
};
