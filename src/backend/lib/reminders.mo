import Types "../types/reminders";

module {
  // Construct a workout reminder record.
  public func newReminder(id : Nat, days : [Nat], timeMinutes : Nat, title : Text) : Types.WorkoutReminder {
    { id; days; timeMinutes; title };
  };
};
