module {
  public type CoachType = {
    #diet;
    #gym;
    #cricket;
    #football;
    #basketball;
    #swimming;
  };

  public type UserProfile = {
    weightKg : Float;
    age : Nat;
    gender : Text;
    goal : Text;
  };

  public type ChatRequest = {
    message : Text;
    coach : CoachType;
    profile : UserProfile;
  };

  public type ChatResponse = {
    reply : Text;
  };
};
