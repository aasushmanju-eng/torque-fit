module {
  // A scheduled workout reminder for chosen days and a time.
  public type WorkoutReminder = {
    id : Nat;
    days : [Nat];       // 0 = Monday ... 6 = Sunday
    timeMinutes : Nat;  // minutes since midnight
    title : Text;
  };
};
