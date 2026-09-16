import Principal "mo:core/Principal";

module {
  // A single message sent between two friends.
  public type ChatMessage = {
    id : Nat;
    from : Principal;
    to : Principal;
    text : Text;
    sentAtNs : Int;
  };

  // The full message history between the caller and one friend.
  public type Conversation = {
    friend : Principal;
    messages : [ChatMessage];
  };
};
