import { CoachType, createActor } from "@/backend";
import type { ChatRequest, UserProfile } from "@/backend";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useProfile } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  CircleDot,
  Dumbbell,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trophy,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function useChat() {
  const { actor } = useActor(createActor);
  return useMutation({
    mutationFn: async (req: ChatRequest) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.chat(req);
    },
  });
}

interface CoachMeta {
  type: CoachType;
  label: string;
  tagline: string;
  icon: LucideIcon;
}

const COACHES: CoachMeta[] = [
  {
    type: CoachType.gym,
    label: "Gym Mentor",
    tagline: "Strength, form & conditioning",
    icon: Dumbbell,
  },
  {
    type: CoachType.cricket,
    label: "Cricket",
    tagline: "Batting, bowling & fielding",
    icon: Target,
  },
  {
    type: CoachType.football,
    label: "Football",
    tagline: "Soccer skills & fitness",
    icon: Trophy,
  },
  {
    type: CoachType.basketball,
    label: "Basketball",
    tagline: "Hoops, agility & conditioning",
    icon: CircleDot,
  },
  {
    type: CoachType.swimming,
    label: "Swimming",
    tagline: "Technique & endurance",
    icon: Waves,
  },
];

const SUGGESTED_PROMPTS: Record<CoachType, string[]> = {
  [CoachType.gym]: [
    "Build me a 4-day strength plan for my goal",
    "How do I fix my squat form?",
    "What should I do on rest days?",
  ],
  [CoachType.cricket]: [
    "Drills to improve my batting timing",
    "How do I bowl a consistent line and length?",
    "A fielding fitness routine for me",
  ],
  [CoachType.football]: [
    "Drills to improve my first touch",
    "A pre-match warm-up routine",
    "How do I build sprint endurance?",
  ],
  [CoachType.basketball]: [
    "Drills to improve my jump shot",
    "How do I get quicker on defense?",
    "A conditioning plan for game day",
  ],
  [CoachType.swimming]: [
    "How do I improve my freestyle technique?",
    "A plan to build swim endurance",
    "Drills to fix my breathing",
  ],
  [CoachType.diet]: [
    "What should I eat around training?",
    "Help me plan my daily macros",
    "Healthy snacks for athletes",
  ],
};

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

function MessageBubble({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry: (id: string, content: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div
      data-ocid={`chat_message_${isUser ? "user" : "assistant"}`}
      className={cn(
        "flex w-full animate-rise",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-card text-card-foreground",
        )}
      >
        <p>{message.content}</p>
        {message.error && (
          <div className="mt-2 flex items-center gap-2 border-t border-destructive/30 pt-2">
            <span className="text-xs text-destructive">
              Couldn&apos;t reach the coach.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-ocid="chat_retry_button"
              className="focus-ring press"
              onClick={() => onRetry(message.id, message.content)}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div
      className="flex w-full animate-rise justify-start"
      data-ocid="chat_loading_state"
    >
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3">
        <Loader2
          className="size-4 animate-spin text-primary"
          aria-hidden="true"
        />
        <span className="text-sm text-muted-foreground">
          Coach is thinking…
        </span>
      </div>
    </div>
  );
}

export default function GymMentor() {
  const [activeCoach, setActiveCoach] = useState<CoachType>(CoachType.gym);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pendingIdRef = useRef<string | null>(null);

  const { data: profile } = useProfile();
  const chat = useChat();

  const activeMeta = COACHES.find((c) => c.type === activeCoach) ?? COACHES[0];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const buildProfile = (): UserProfile => {
    if (profile) {
      return {
        age: profile.age,
        goal: profile.goal,
        weightKg: profile.weightKg,
        gender: profile.gender,
      };
    }
    return { age: 0n, goal: "maintain", weightKg: 0, gender: "other" };
  };

  const sendMessage = (raw: string) => {
    const content = raw.trim();
    if (!content || chat.isPending) return;
    const id = crypto.randomUUID();
    pendingIdRef.current = id;
    setChatError(null);
    setMessages((prev) => [...prev, { id, role: "user", content }]);
    setInput("");
    chat.mutate(
      { coach: activeCoach, message: content, profile: buildProfile() },
      {
        onSuccess: (res) => {
          pendingIdRef.current = null;
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: res.reply },
          ]);
        },
        onError: (err) => {
          pendingIdRef.current = null;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, error: true } : m)),
          );
          setChatError(
            err instanceof Error
              ? err.message
              : "The coach couldn't respond right now. Check your connection and try again.",
          );
        },
      },
    );
  };

  const retry = (id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, error: false } : m)),
    );
    pendingIdRef.current = id;
    setChatError(null);
    chat.mutate(
      { coach: activeCoach, message: content, profile: buildProfile() },
      {
        onSuccess: (res) => {
          pendingIdRef.current = null;
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "assistant", content: res.reply },
          ]);
        },
        onError: (err) => {
          pendingIdRef.current = null;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, error: true } : m)),
          );
          setChatError(
            err instanceof Error
              ? err.message
              : "The coach couldn't respond right now. Check your connection and try again.",
          );
        },
      },
    );
  };

  const ActiveIcon = activeMeta.icon;

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="flex animate-rise items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            AI Gym Mentor &amp; Sports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalized training and sport-specific coaching, built around your
            body and goals.
          </p>
        </div>
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {activeMeta.label}
        </span>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Choose a coach"
      >
        {COACHES.map((coach) => {
          const Icon = coach.icon;
          const active = coach.type === activeCoach;
          return (
            <button
              key={coach.type}
              type="button"
              role="tab"
              aria-selected={active}
              data-ocid={`coach_${coach.type}`}
              onClick={() => setActiveCoach(coach.type)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-fast focus-ring press",
                active
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-[0_6px_16px_-8px_oklch(0.66_0.2_240/0.4)]",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {coach.label}
            </button>
          );
        })}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto bg-background p-4"
          data-ocid="chat_message_list"
        >
          {messages.length === 0 && !chat.isPending ? (
            <div
              className="flex h-full flex-col items-center justify-center gap-4 text-center"
              data-ocid="chat_empty_state"
            >
              <span className="flex size-14 animate-scale-in items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ActiveIcon className="size-7" aria-hidden="true" />
              </span>
              <div className="animate-rise">
                <h2 className="font-display text-lg font-semibold">
                  {activeMeta.label}
                </h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {activeMeta.tagline}. Ask anything — I&apos;ll tailor every
                  answer to your weight, age, gender, and goals.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS[activeCoach].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    data-ocid="chat_suggestion"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-fast hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-[0_6px_16px_-8px_oklch(0.66_0.2_240/0.4)] focus-ring press"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} onRetry={retry} />
              ))}
              {chat.isPending && <TypingIndicator />}
            </>
          )}
        </div>

        <div className="border-t border-border bg-background/40 p-3">
          {chatError && (
            <div
              data-ocid="chat_error_state"
              className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              <span className="flex items-center gap-2">
                <AlertTriangle
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {chatError}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-ocid="chat_retry_button"
                className="focus-ring press"
                disabled={chat.isPending}
                onClick={() => {
                  const failed = messages.find((m) => m.error);
                  if (failed) retry(failed.id, failed.content);
                }}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Retry
              </Button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder={`Message ${activeMeta.label}…`}
              rows={1}
              className="min-h-[44px] flex-1 resize-none focus-ring"
              data-ocid="chat_input"
              aria-label={`Message ${activeMeta.label}`}
            />
            <Button
              type="submit"
              size="icon"
              data-ocid="chat_send_button"
              className="focus-ring press"
              disabled={!input.trim() || chat.isPending}
              aria-label="Send message"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
