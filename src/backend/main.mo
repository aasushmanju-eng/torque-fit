import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import TextValue "mo:caffeineai-oql/TextValue";
import FloatValue "mo:caffeineai-oql/FloatValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import Types "types/core";
import CoreLib "lib/core";
import CoreApi "mixins/core-api";
import ChatApi "mixins/chat-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let profiles : Map.Map<Principal, Types.Profile>;
  let xp : Map.Map<Principal, Nat>;
  let challengeList : Map.Map<Principal, [Types.Challenge]>;
  let rewards : Map.Map<Principal, [Types.Reward]>;
  let streaks : Map.Map<Principal, Types.StreakInfo>;
  let friendRequests : List.List<Types.FriendRequest>;
  let friends : Map.Map<Principal, [Principal]>;
  let foodLog : Map.Map<Principal, [Types.FoodLogEntry]>;
  let workouts : Map.Map<Principal, [Types.Workout]>;
  let state : { var nextId : Nat };

  transient let anyP = Principal.fromText("aaaaa-aa");

  func workoutRows() : [(Principal, Types.Workout)] {
    let acc = List.empty<(Principal, Types.Workout)>();
    for ((p, ws) in workouts.entries()) {
      for (w in ws.values()) {
        acc.add((p, w));
      };
    };
    acc.toArray();
  };

  func foodLogRows() : [(Principal, Types.FoodLogEntry)] {
    let acc = List.empty<(Principal, Types.FoodLogEntry)>();
    for ((p, es) in foodLog.entries()) {
      for (e in es.values()) {
        acc.add((p, e));
      };
    };
    acc.toArray();
  };

  func challengeRows() : [(Principal, Types.Challenge)] {
    let acc = List.empty<(Principal, Types.Challenge)>();
    for ((p, cs) in challengeList.entries()) {
      for (c in cs.values()) {
        acc.add((p, c));
      };
    };
    acc.toArray();
  };

  func rewardRows() : [(Principal, Types.Reward)] {
    let acc = List.empty<(Principal, Types.Reward)>();
    for ((p, rs) in rewards.entries()) {
      for (r in rs.values()) {
        acc.add((p, r));
      };
    };
    acc.toArray();
  };

  func friendRows() : [(Principal, Principal)] {
    let acc = List.empty<(Principal, Principal)>();
    for ((p, fs) in friends.entries()) {
      for (f in fs.values()) {
        acc.add((p, f));
      };
    };
    acc.toArray();
  };

  include MixinAuthorization(accessControlState, null);
  include CoreApi(
    accessControlState,
    profiles,
    xp,
    challengeList,
    rewards,
    streaks,
    friendRequests,
    friends,
    foodLog,
    workouts,
    state,
  );
  include ChatApi(accessControlState);
  include Expose({
    entities = [
      OQL.Entity.manual<(Principal, Types.Profile)>("profile", func () = profiles.entries(), "Profile", "principal")
        .sample((anyP, CoreLib.emptyProfile()))
        .payload("principal", func ((p, _)) = p)
        .payload("name", func ((_, pr)) = pr.name)
        .payload("weightKg", func ((_, pr)) = pr.weightKg)
        .payload("heightCm", func ((_, pr)) = pr.heightCm)
        .payload("age", func ((_, pr)) = pr.age)
        .payload("targetSport", func ((_, pr)) = pr.targetSport)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, Types.Workout)>("workout", func () = workoutRows().values(), "Workout", "id")
        .sample((anyP, { id = 0; title = ""; exercises = []; completedAtNs = 0 }))
        .payload("principal", func ((p, _)) = p)
        .payload("id", func ((_, w)) = w.id)
        .payload("title", func ((_, w)) = w.title)
        .payload("completedAtNs", func ((_, w)) = w.completedAtNs)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, Types.FoodLogEntry)>("foodLogEntry", func () = foodLogRows().values(), "FoodLogEntry", "id")
        .sample((anyP, { id = 0; product = { code = ""; name = ""; calories = 0.0; protein = 0.0; carbs = 0.0; fat = 0.0 }; servingSize = 0.0; loggedAtNs = 0 }))
        .payload("principal", func ((p, _)) = p)
        .payload("id", func ((_, e)) = e.id)
        .payload("productName", func ((_, e)) = e.product.name)
        .payload("productCode", func ((_, e)) = e.product.code)
        .payload("calories", func ((_, e)) = e.product.calories)
        .payload("protein", func ((_, e)) = e.product.protein)
        .payload("carbs", func ((_, e)) = e.product.carbs)
        .payload("fat", func ((_, e)) = e.product.fat)
        .payload("servingSize", func ((_, e)) = e.servingSize)
        .payload("loggedAtNs", func ((_, e)) = e.loggedAtNs)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, Types.Challenge)>("challenge", func () = challengeRows().values(), "Challenge", "id")
        .sample((anyP, { id = 0; title = ""; description = ""; target = 0; progress = 0; status = #active; rewardPoints = 0; rewardBadge = "" }))
        .payload("principal", func ((p, _)) = p)
        .payload("id", func ((_, c)) = c.id)
        .payload("title", func ((_, c)) = c.title)
        .payload("description", func ((_, c)) = c.description)
        .payload("target", func ((_, c)) = c.target)
        .payload("progress", func ((_, c)) = c.progress)
        .payload("status", func ((_, c)) = switch (c.status) { case (#active) "active"; case (#completed) "completed" })
        .payload("rewardPoints", func ((_, c)) = c.rewardPoints)
        .payload("rewardBadge", func ((_, c)) = c.rewardBadge)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, Types.Reward)>("reward", func () = rewardRows().values(), "Reward", "id")
        .sample((anyP, { id = 0; badge = ""; points = 0; earnedAtNs = 0 }))
        .payload("principal", func ((p, _)) = p)
        .payload("id", func ((_, r)) = r.id)
        .payload("badge", func ((_, r)) = r.badge)
        .payload("points", func ((_, r)) = r.points)
        .payload("earnedAtNs", func ((_, r)) = r.earnedAtNs)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, Principal)>("friend", func () = friendRows().values(), "Friend", "friend")
        .sample((anyP, anyP))
        .payload("principal", func ((p, _)) = p)
        .payload("friend", func ((_, f)) = f)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
    ];
  });
  include ApiDocMixin();
};
