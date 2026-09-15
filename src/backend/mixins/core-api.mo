import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Result "mo:core/Result";
import AccessControl "mo:caffeineai-authorization/access-control";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Json "mo:json";
import CoreLib "../lib/core";
import Types "../types/core";

mixin (
  accessControlState : AccessControl.AccessControlState,
  profiles : Map.Map<Principal, Types.Profile>,
  xp : Map.Map<Principal, Nat>,
  challengeList : Map.Map<Principal, [Types.Challenge]>,
  rewards : Map.Map<Principal, [Types.Reward]>,
  streaks : Map.Map<Principal, Types.StreakInfo>,
  friendRequests : List.List<Types.FriendRequest>,
  friends : Map.Map<Principal, [Principal]>,
  foodLog : Map.Map<Principal, [Types.FoodLogEntry]>,
  workouts : Map.Map<Principal, [Types.Workout]>,
  state : { var nextId : Nat },
) {
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func requireUser(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
  };

  func getText(json : Json.Json, path : Text, default : Text) : Text {
    switch (Json.getAsText(json, path)) {
      case (#ok v) v;
      case (#err _) default;
    };
  };

  func getFloat(json : Json.Json, path : Text, default : Float) : Float {
    switch (Json.getAsFloat(json, path)) {
      case (#ok v) v;
      case (#err _) default;
    };
  };

  // Set a challenge's progress, completing it and awarding a reward when the target is reached.
  func setChallengeProgress(user : Principal, challengeId : Nat, newProgress : Nat) {
    let current = challengeList.get(user) ?? [];
    let updated = current.map(func c = if (c.id == challengeId and c.status == #active) {
      let p = if (newProgress > c.target) { c.target } else { newProgress };
      if (p >= c.target) {
        { c with progress = c.target; status = #completed };
      } else {
        { c with progress = p };
      };
    } else { c });
    var newRewards = rewards.get(user) ?? [];
    for (i in current.keys()) {
      if (current[i].status != #completed and updated[i].status == #completed) {
        newRewards := newRewards.concat([{
          id = state.nextId;
          badge = updated[i].rewardBadge;
          points = updated[i].rewardPoints;
          earnedAtNs = Time.now();
        }]);
        state.nextId += 1;
        awardXp(user, updated[i].rewardPoints);
      };
    };
    challengeList.add(user, updated);
    rewards.add(user, newRewards);
  };

  func incrementChallengeProgress(user : Principal, challengeId : Nat, amount : Nat) {
    let current = challengeList.get(user) ?? [];
    switch (current.find(func c = c.id == challengeId)) {
      case (?c) { setChallengeProgress(user, challengeId, c.progress + amount) };
      case null {};
    };
  };

  func updateStreakAndChallenge(user : Principal) {
    let streak = streaks.get(user) ?? ({ var lastDay = -1; var current = 0 } : Types.StreakInfo);
    let updated = CoreLib.updateStreak(streak, Time.now());
    streaks.add(user, updated);
    setChallengeProgress(user, 1, updated.current);
  };

  func awardXp(user : Principal, amount : Nat) {
    let currentXp = xp.get(user) ?? 0;
    xp.add(user, CoreLib.addXp(currentXp, amount));
  };

  public query ({ caller }) func getProfile() : async ?Types.Profile {
    requireUser(caller);
    profiles.get(caller);
  };

  public shared ({ caller }) func updateProfile(profile : Types.Profile) : async () {
    requireUser(caller);
    let isNew = profiles.get(caller) == null;
    profiles.add(caller, profile);
    if (isNew) {
      challengeList.add(caller, CoreLib.newChallenges());
      rewards.add(caller, []);
      streaks.add(caller, { var lastDay = -1; var current = 0 });
      xp.add(caller, 0);
    };
  };

  public query ({ caller }) func getRankInfo() : async Types.RankInfo {
    requireUser(caller);
    CoreLib.getRankInfo(xp.get(caller) ?? 0);
  };

  public query ({ caller }) func getChallenges() : async [Types.Challenge] {
    requireUser(caller);
    challengeList.get(caller) ?? [];
  };

  public query ({ caller }) func getRewards() : async [Types.Reward] {
    requireUser(caller);
    rewards.get(caller) ?? [];
  };

  public query ({ caller }) func getDietTarget() : async Types.DietTarget {
    requireUser(caller);
    let profile = profiles.get(caller) ?? Runtime.trap("Profile not set");
    CoreLib.computeDietTarget(profile);
  };

  public query ({ caller }) func getDailyFoodLog() : async Types.DailyFoodLog {
    requireUser(caller);
    let today = CoreLib.dayOf(Time.now());
    let all = foodLog.get(caller) ?? [];
    let todays = all.filter(func e = CoreLib.dayOf(e.loggedAtNs) == today);
    CoreLib.foodLogTotals(todays);
  };

  public shared ({ caller }) func logFood(product : Types.FoodProduct, servingSize : Float) : async () {
    requireUser(caller);
    let entry : Types.FoodLogEntry = {
      id = state.nextId;
      product;
      servingSize;
      loggedAtNs = Time.now();
    };
    state.nextId += 1;
    let current = foodLog.get(caller) ?? [];
    foodLog.add(caller, current.concat([entry]));
    incrementChallengeProgress(caller, 2, 1);
    updateStreakAndChallenge(caller);
    awardXp(caller, 10);
  };

  public shared ({ caller }) func updateFoodEntry(entryId : Nat, servingSize : Float) : async () {
    requireUser(caller);
    let current = foodLog.get(caller) ?? [];
    let updated = current.map(func e = if (e.id == entryId) { { e with servingSize } } else { e });
    foodLog.add(caller, updated);
  };

  public shared ({ caller }) func deleteFoodEntry(entryId : Nat) : async () {
    requireUser(caller);
    let current = foodLog.get(caller) ?? [];
    let updated = current.filter(func e = e.id != entryId);
    foodLog.add(caller, updated);
  };

  public query ({ caller }) func getWorkouts() : async [Types.Workout] {
    requireUser(caller);
    workouts.get(caller) ?? [];
  };

  public shared ({ caller }) func logWorkout(title : Text, exercises : [Types.Exercise]) : async () {
    requireUser(caller);
    let workout : Types.Workout = {
      id = state.nextId;
      title;
      exercises;
      completedAtNs = Time.now();
    };
    state.nextId += 1;
    let current = workouts.get(caller) ?? [];
    workouts.add(caller, current.concat([workout]));
    incrementChallengeProgress(caller, 3, 1);
    updateStreakAndChallenge(caller);
    awardXp(caller, 25);
  };

  public query ({ caller }) func searchUsers(name : Text) : async [Types.SearchResult] {
    requireUser(caller);
    let term = name.toLower();
    let all = profiles.entries().toArray();
    all.filter(func (p, _) = p != caller)
      .filter(func (_, pr) = pr.name.toLower().contains(#text term))
      .map(func (p, pr) = { principal = p; profile = pr });
  };

  public shared ({ caller }) func sendFriendRequest(to : Principal) : async Result.Result<(), Text> {
    requireUser(caller);
    if (caller == to) {
      return #err("Cannot add yourself as a friend");
    };
    if (profiles.get(to) == null) {
      return #err("User not found");
    };
    let myFriends = friends.get(caller) ?? [];
    if (myFriends.contains(to)) {
      return #err("Already friends");
    };
    let existing = friendRequests.toArray().find(func r = r.from == caller and r.to == to and r.status == #pending);
    if (existing != null) {
      return #err("Friend request already sent");
    };
    friendRequests.add({ from = caller; to; status = #pending });
    #ok;
  };

  public shared ({ caller }) func respondToFriendRequest(from : Principal, accept : Bool) : async Result.Result<(), Text> {
    requireUser(caller);
    let snapshot = friendRequests.toArray();
    let req = snapshot.find(func r = r.from == from and r.to == caller and r.status == #pending);
    switch (req) {
      case null { #err("No pending request from this user") };
      case (?_) {
        let remaining = snapshot.filter(func x = not (x.from == from and x.to == caller and x.status == #pending));
        friendRequests.clear();
        for (x in remaining.values()) {
          friendRequests.add(x);
        };
        if (accept) {
          let myFriends = friends.get(caller) ?? [];
          let theirFriends = friends.get(from) ?? [];
          friends.add(caller, myFriends.concat([from]));
          friends.add(from, theirFriends.concat([caller]));
        };
        #ok;
      };
    };
  };

  public query ({ caller }) func getFriendRequests() : async [Types.FriendRequest] {
    requireUser(caller);
    friendRequests.toArray().filter(func r = r.to == caller and r.status == #pending);
  };

  public query ({ caller }) func getFriends() : async [Types.FriendView] {
    requireUser(caller);
    let myFriends = friends.get(caller) ?? [];
    let views = List.empty<Types.FriendView>();
    for (f in myFriends.values()) {
      let profile = profiles.get(f) ?? CoreLib.emptyProfile();
      let fxp = xp.get(f) ?? 0;
      let fchallenges = challengeList.get(f) ?? [];
      views.add({
        principal = f;
        name = profile.name;
        rank = CoreLib.getRankInfo(fxp);
        challengeProgress = fchallenges;
      });
    };
    views.toArray();
  };

  public shared ({ caller }) func searchFoodByBarcode(barcode : Text) : async Result.Result<Types.FoodProduct, Text> {
    requireUser(caller);
    let url = "https://world.openfoodfacts.org/api/v2/product/" # barcode # ".json?fields=code,product_name,nutriments";
    let body = await OutCall.httpGetRequest(url, [], transform);
    switch (Json.parse(body)) {
      case (#err _) { #err("Failed to parse response") };
      case (#ok json) {
        switch (Json.getAsNat(json, "status")) {
          case (#err _) { #err("Product not found") };
          case (#ok 1) {
            #ok({
              code = getText(json, "code", barcode);
              name = getText(json, "product.product_name", "Unknown");
              calories = getFloat(json, "product.nutriments.energy-kcal", 0.0);
              protein = getFloat(json, "product.nutriments.proteins", 0.0);
              carbs = getFloat(json, "product.nutriments.carbohydrates", 0.0);
              fat = getFloat(json, "product.nutriments.fat", 0.0);
            });
          };
          case (#ok _) { #err("Product not found") };
        };
      };
    };
  };
};
