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
import SocialTypes "types/social";
import ReminderTypes "types/reminders";
import ChallengeTypes "types/challenges";
import CoreLib "lib/core";
import CoreApi "mixins/core-api";
import ChatApi "mixins/chat-api";
import SocialApi "mixins/social-api";
import RemindersApi "mixins/reminders-api";
import ChallengesApi "mixins/challenges-api";
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
  let messages : Map.Map<Principal, Map.Map<Principal, [SocialTypes.ChatMessage]>>;
  let reminders : Map.Map<Principal, [ReminderTypes.WorkoutReminder]>;
  let proofs : Map.Map<Principal, [ChallengeTypes.ChallengeProof]>;
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

  func messageRows() : [(Principal, SocialTypes.ChatMessage)] {
    let acc = List.empty<(Principal, SocialTypes.ChatMessage)>();
    for ((p, inner) in messages.entries()) {
      for ((_, msgs) in inner.entries()) {
        for (m in msgs.values()) {
          acc.add((p, m));
        };
      };
    };
    acc.toArray();
  };

  func reminderRows() : [(Principal, ReminderTypes.WorkoutReminder)] {
    let acc = List.empty<(Principal, ReminderTypes.WorkoutReminder)>();
    for ((p, rs) in reminders.entries()) {
      for (r in rs.values()) {
        acc.add((p, r));
      };
    };
    acc.toArray();
  };

  func proofRows() : [(Principal, ChallengeTypes.ChallengeProof)] {
    let acc = List.empty<(Principal, ChallengeTypes.ChallengeProof)>();
    for ((p, ps) in proofs.entries()) {
      for (pr in ps.values()) {
        acc.add((p, pr));
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
  include ChatApi(profiles);
  include SocialApi(messages, friends, state);
  include RemindersApi(reminders, state);
  include ChallengesApi(proofs, state);
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
      OQL.Entity.manual<(Principal, SocialTypes.ChatMessage)>("chatMessage", func () = messageRows().values(), "ChatMessage", "id")
        .sample((anyP, { id = 0; from = anyP; to = anyP; text = ""; sentAtNs = 0 }))
        .payload("principal", func ((p, _)) = p)
        .payload("id", func ((_, m)) = m.id)
        .payload("from", func ((_, m)) = m.from)
        .payload("to", func ((_, m)) = m.to)
        .payload("text", func ((_, m)) = m.text)
        .payload("sentAtNs", func ((_, m)) = m.sentAtNs)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, ReminderTypes.WorkoutReminder)>("workoutReminder", func () = reminderRows().values(), "WorkoutReminder", "id")
        .sample((anyP, { id = 0; days = []; timeMinutes = 0; title = "" }))
        .payload("principal", func ((p, _)) = p)
        .payload("id", func ((_, r)) = r.id)
        .payload("days", func ((_, r)) = r.days.values().map(func d = d.toText()).join(","))
        .payload("timeMinutes", func ((_, r)) = r.timeMinutes)
        .payload("title", func ((_, r)) = r.title)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
      OQL.Entity.manual<(Principal, ChallengeTypes.ChallengeProof)>("challengeProof", func () = proofRows().values(), "ChallengeProof", "id")
        .sample((anyP, { id = 0; challengeId = 0; proofRef = ""; submittedAtNs = 0 }))
        .payload("principal", func ((p, _)) = p)
        .payload("id", func ((_, pr)) = pr.id)
        .payload("challengeId", func ((_, pr)) = pr.challengeId)
        .payload("proofRef", func ((_, pr)) = pr.proofRef)
        .payload("submittedAtNs", func ((_, pr)) = pr.submittedAtNs)
        .ownedBy("principal")
        .controllerOrScoped()
        .build(),
    ];
  });
  include ApiDocMixin();
};
