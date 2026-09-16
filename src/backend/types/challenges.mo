module {
  // A photo proof submitted for a challenge, referencing a stored file via
  // the platform's file storage.
  public type ChallengeProof = {
    id : Nat;
    challengeId : Nat;
    proofRef : Text;  // reference to the stored proof file
    submittedAtNs : Int;
  };
};
