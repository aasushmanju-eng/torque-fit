import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/challenges";

mixin (
  proofs : Map.Map<Principal, [Types.ChallengeProof]>,
  state : { var nextId : Nat },
) {
  func requireUserChallenge(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
  };

  // Submit a photo proof for a challenge, storing a reference to the proof file.
  public shared ({ caller }) func submitChallengeProof(challengeId : Nat, proofRef : Text) : async Result.Result<(), Text> {
    requireUserChallenge(caller);
    // The 7-day streak challenge (id 1) is tracked automatically from food/workout
    // logs — it does not accept photo proofs.
    if (challengeId == 1) {
      return #err("The 7-day streak challenge is tracked automatically — no photo proof needed.");
    };
    let proof : Types.ChallengeProof = {
      id = state.nextId;
      challengeId;
      proofRef;
      submittedAtNs = Time.now();
    };
    state.nextId += 1;
    let current = proofs.get(caller) ?? [];
    proofs.add(caller, current.concat([proof]));
    #ok;
  };

  // Return the caller's photo proofs for a challenge.
  public query ({ caller }) func getChallengeProofs(challengeId : Nat) : async [Types.ChallengeProof] {
    requireUserChallenge(caller);
    let current = proofs.get(caller) ?? [];
    current.filter(func p = p.challengeId == challengeId);
  };
};
