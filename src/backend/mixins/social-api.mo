import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/social";

mixin (
  messages : Map.Map<Principal, Map.Map<Principal, [Types.ChatMessage]>>,
  friends : Map.Map<Principal, [Principal]>,
  state : { var nextId : Nat },
) {
  func requireUserSocial(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
  };

  // Send a message to a friend. Appends to the per-pair history for both parties.
  public shared ({ caller }) func sendMessage(to : Principal, text : Text) : async Result.Result<(), Text> {
    requireUserSocial(caller);
    if (caller == to) {
      return #err("Cannot message yourself");
    };
    let myFriends = friends.get(caller) ?? [];
    if (not myFriends.contains(to)) {
      return #err("Recipient is not your friend");
    };
    let message : Types.ChatMessage = {
      id = state.nextId;
      from = caller;
      to;
      text;
      sentAtNs = Time.now();
    };
    state.nextId += 1;
    // Store the message in both directions so each party sees the conversation.
    let myMap = messages.get(caller) ?? Map.empty<Principal, [Types.ChatMessage]>();
    let myHistory = myMap.get(to) ?? [];
    myMap.add(to, myHistory.concat([message]));
    messages.add(caller, myMap);
    let theirMap = messages.get(to) ?? Map.empty<Principal, [Types.ChatMessage]>();
    let theirHistory = theirMap.get(caller) ?? [];
    theirMap.add(caller, theirHistory.concat([message]));
    messages.add(to, theirMap);
    #ok;
  };

  // Return the message history between the caller and one friend.
  public query ({ caller }) func getConversation(friend : Principal) : async [Types.ChatMessage] {
    requireUserSocial(caller);
    let myMap = messages.get(caller) ?? Map.empty<Principal, [Types.ChatMessage]>();
    myMap.get(friend) ?? [];
  };

  // Return all of the caller's conversations with their message histories.
  public query ({ caller }) func getConversations() : async [Types.Conversation] {
    requireUserSocial(caller);
    let myMap = messages.get(caller) ?? Map.empty<Principal, [Types.ChatMessage]>();
    myMap.entries().toArray().map(func (friend, msgs) = { friend; messages = msgs });
  };
};
