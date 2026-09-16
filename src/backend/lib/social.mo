import Principal "mo:core/Principal";
import Types "../types/social";

module {
  // Append a message to a friend-pair's message history.
  public func appendMessage(history : [Types.ChatMessage], msg : Types.ChatMessage) : [Types.ChatMessage] {
    history.concat([msg]);
  };

  // Build a conversation view for a friend from their message history.
  public func toConversation(friend : Principal, history : [Types.ChatMessage]) : Types.Conversation {
    { friend; messages = history };
  };
};
