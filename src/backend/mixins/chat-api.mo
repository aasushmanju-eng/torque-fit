import Map "mo:core/Map";
import Principal "mo:core/Principal";
import ChatLib "../lib/chat";
import Types "../types/chat";
import CoreTypes "../types/core";

mixin (profiles : Map.Map<Principal, CoreTypes.Profile>) {
  public shared ({ caller }) func chat(req : Types.ChatRequest) : async Types.ChatResponse {
    if (caller.isAnonymous()) {
      return { reply = "Please sign in with Internet Identity to use the AI coach." };
    };
    // The real "registered" signal for this app is a completed profile.
    // Do NOT trap on a missing profile — return a clear, actionable reply so
    // the frontend can guide the user to the Profile tab.
    if (profiles.get(caller) == null) {
      return { reply = "Please complete your profile in the Profile tab first, then I can coach you." };
    };
    await* ChatLib.runChat<system>(req);
  };
};
