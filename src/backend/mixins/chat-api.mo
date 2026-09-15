import AccessControl "mo:caffeineai-authorization/access-control";
import Runtime "mo:core/Runtime";
import ChatLib "../lib/chat";
import Types "../types/chat";

mixin (accessControlState : AccessControl.AccessControlState) {
  public shared ({ caller }) func chat(req : Types.ChatRequest) : async Types.ChatResponse {
    if (caller.isAnonymous()) {
      Runtime.trap("Authentication required: sign in to use the AI coach");
    };
    // Registration gate: traps with "User is not registered" for a caller that
    // has never signed in through the app's frontend.
    ignore AccessControl.getUserRole(accessControlState, caller);
    await* ChatLib.runChat<system>(req);
  };
};
