import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import Types "../types/reminders";

mixin (
  reminders : Map.Map<Principal, [Types.WorkoutReminder]>,
  state : { var nextId : Nat },
) {
  func requireUserReminder(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
  };

  // Schedule a new workout reminder. Returns the new reminder's id.
  public shared ({ caller }) func addWorkoutReminder(days : [Nat], timeMinutes : Nat, title : Text) : async Nat {
    requireUserReminder(caller);
    let reminder : Types.WorkoutReminder = {
      id = state.nextId;
      days;
      timeMinutes;
      title;
    };
    state.nextId += 1;
    let current = reminders.get(caller) ?? [];
    reminders.add(caller, current.concat([reminder]));
    reminder.id;
  };

  // List the caller's workout reminders.
  public query ({ caller }) func listWorkoutReminders() : async [Types.WorkoutReminder] {
    requireUserReminder(caller);
    reminders.get(caller) ?? [];
  };

  // Edit an existing workout reminder.
  public shared ({ caller }) func updateWorkoutReminder(id : Nat, days : [Nat], timeMinutes : Nat, title : Text) : async Result.Result<(), Text> {
    requireUserReminder(caller);
    let current = reminders.get(caller) ?? [];
    let updated = current.map(func r = if (r.id == id) { { r with days; timeMinutes; title } } else { r });
    reminders.add(caller, updated);
    #ok;
  };

  // Remove a workout reminder.
  public shared ({ caller }) func removeWorkoutReminder(id : Nat) : async Result.Result<(), Text> {
    requireUserReminder(caller);
    let current = reminders.get(caller) ?? [];
    let updated = current.filter(func r = r.id != id);
    reminders.add(caller, updated);
    #ok;
  };
};
