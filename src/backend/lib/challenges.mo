import Types "../types/challenges";

module {
  // Construct a challenge proof record.
  public func newProof(id : Nat, challengeId : Nat, proofRef : Text, submittedAtNs : Int) : Types.ChallengeProof {
    { id; challengeId; proofRef; submittedAtNs };
  };
};
