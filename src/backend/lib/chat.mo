import { fromEnv } "mo:caffeineai-inference-client/Config";
import ChatApi "mo:caffeineai-inference-client/Apis/ChatApi";
import ChatCompletionRequest "mo:caffeineai-inference-client/Models/ChatCompletionRequest";
import ChatCompletionRequestMessageOneOf "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf";
import ChatCompletionRequestMessageOneOf2 "mo:caffeineai-inference-client/Models/ChatCompletionRequestMessageOneOf2";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Types "../types/chat";

module {
  // A rough daily calorie target and macro split derived from the profile.
  // Used to give the diet coach concrete numbers to work with.
  func computeTargets(profile : Types.UserProfile) : { calories : Nat; proteinG : Nat; carbsG : Nat; fatG : Nat } {
    let goal = profile.goal.toLower();
    // Base maintenance estimate: ~30 kcal per kg of body weight.
    var calories = profile.weightKg * 30.0;
    if (goal.contains(#text "lose") or goal.contains(#text "cut") or goal.contains(#text "fat")) {
      calories -= 500.0;
    } else if (goal.contains(#text "gain") or goal.contains(#text "bulk") or goal.contains(#text "muscle")) {
      calories += 300.0;
    };
    if (calories < 1200.0) { calories := 1200.0 };
    let proteinG = profile.weightKg * 2.0;
    let fatG = profile.weightKg * 0.8;
    let proteinCal = proteinG * 4.0;
    let fatCal = fatG * 9.0;
    var carbsCal = calories - proteinCal - fatCal;
    if (carbsCal < 0.0) { carbsCal := 0.0 };
    let carbsG = carbsCal / 4.0;
    {
      calories = calories.toInt().toNat();
      proteinG = proteinG.toInt().toNat();
      carbsG = carbsG.toInt().toNat();
      fatG = fatG.toInt().toNat();
    };
  };

  func profileLine(profile : Types.UserProfile) : Text {
    "The user's profile: weight " # profile.weightKg.toText() # " kg, age " # profile.age.toText() # ", gender " # profile.gender # ", goal: " # profile.goal # ".";
  };

  func coachName(coach : Types.CoachType) : Text {
    switch (coach) {
      case (#diet) "diet coach";
      case (#gym) "gym mentor";
      case (#cricket) "cricket coach";
      case (#football) "football coach";
      case (#basketball) "basketball coach";
      case (#swimming) "swimming coach";
    };
  };

  func dietPrompt(profile : Types.UserProfile) : Text {
    let t = computeTargets(profile);
    "Your daily targets for this user are approximately " # t.calories.toText()
    # " kcal, with " # t.proteinG.toText() # " g protein, " # t.carbsG.toText()
    # " g carbs, and " # t.fatG.toText() # " g fat. Give meal suggestions that fit "
    # "these targets, and when the user logs food or reports progress, adjust your "
    # "recommendations accordingly. Keep advice practical, encouraging, and tailored to their goal.";
  };

  func gymPrompt() : Text {
    "As the AI gym mentor, generate personalized workout plans and exercise guidance "
    # "based on the user's profile and goal. Suggest appropriate exercises, sets, reps, "
    # "and progression, and adapt to what the user says about their training, soreness, "
    # "or schedule. Prioritize safety and steady, sustainable progress.";
  };

  func cricketPrompt() : Text {
    "As the AI cricket coach, give sport-specific training and tips for cricket: batting, "
    # "bowling, fielding, fitness, and match strategy. Tailor drills and advice to the "
    # "user's profile and goal, and respond to their actual question or situation.";
  };

  func footballPrompt() : Text {
    "As the AI football coach, give sport-specific training and tips for football: "
    # "dribbling, passing, shooting, defending, fitness, and tactics. Tailor drills and "
    # "advice to the user's profile and goal, and respond to their actual question or situation.";
  };

  func basketballPrompt() : Text {
    "As the AI basketball coach, give sport-specific training and tips for basketball: "
    # "shooting, ball handling, passing, defense, conditioning, and game IQ. Tailor drills "
    # "and advice to the user's profile and goal, and respond to their actual question or situation.";
  };

  func swimmingPrompt() : Text {
    "As the AI swimming coach, give sport-specific training and tips for swimming: stroke "
    # "technique, breathing, endurance, drills, and race strategy. Tailor advice to the "
    # "user's profile and goal, and respond to their actual question or situation.";
  };

  public func buildSystemPrompt(coach : Types.CoachType, profile : Types.UserProfile) : Text {
    let base = "You are Torque Fit's AI " # coachName(coach) # ". "
      # "You are a warm, attentive coach who genuinely listens to the user's actual message — "
      # "whether it is a greeting, a specific question, or feedback on a meal or workout — and "
      # "responds to what they actually said rather than always forcing a plan. Personalize every "
      # "piece of advice to the user's weight, age, gender, and goal. " # profileLine(profile) # " ";
    switch (coach) {
      case (#diet) { base # dietPrompt(profile) };
      case (#gym) { base # gymPrompt() };
      case (#cricket) { base # cricketPrompt() };
      case (#football) { base # footballPrompt() };
      case (#basketball) { base # basketballPrompt() };
      case (#swimming) { base # swimmingPrompt() };
    };
  };

  public func runChat<system>(req : Types.ChatRequest) : async* Types.ChatResponse {
    let config = fromEnv<system>();
    let systemMessage = ChatCompletionRequestMessageOneOf.JSON.init({
      content = #string(buildSystemPrompt(req.coach, req.profile));
      role = #system_;
    });
    let userMessage = ChatCompletionRequestMessageOneOf2.JSON.init({
      content = #string(req.message);
      role = #user;
    });
    let chatReq = ChatCompletionRequest.JSON.init({
      messages = [#system_(systemMessage), #user(userMessage)];
      model = "router";
    });
    let resp = await* ChatApi.createChatCompletion(config, chatReq);
    if (resp.choices.size() == 0) {
      Runtime.trap("Inference returned no choices");
    };
    let reply = resp.choices[0].message.content
      ?? Runtime.trap("Inference returned no text content");
    { reply };
  };
};
