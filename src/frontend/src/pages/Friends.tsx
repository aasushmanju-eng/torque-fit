import type {
  Challenge,
  ChatMessage,
  FriendView,
  RankTier,
  SearchResult,
} from "@/backend";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useConversation,
  useFriendRequests,
  useFriends,
  useRespondToFriendRequest,
  useSearchUsers,
  useSendFriendRequest,
  useSendMessage,
} from "@/hooks/useQueries";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Check,
  MessageCircle,
  Search,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const TIER_LABEL: Record<RankTier, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  diamond: "Diamond",
};

function shortPrincipal(principal: string): string {
  if (principal.length <= 14) return principal;
  return `${principal.slice(0, 8)}…${principal.slice(-4)}`;
}

function rankProgress(rank: FriendView["rank"]): number {
  const total = rank.xp + rank.xpToNextLevel;
  if (total <= 0n) return 0;
  return Math.min(100, Number((rank.xp * 100n) / total));
}

function challengeProgress(challenge: Challenge): number {
  if (challenge.target <= 0n) return 0;
  return Math.min(100, Number((challenge.progress * 100n) / challenge.target));
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(sentAtNs: bigint): string {
  const date = new Date(Number(sentAtNs / 1_000_000n));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function SearchResults({ results }: { results: SearchResult[] }) {
  const sendRequest = useSendFriendRequest();
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <div
        data-ocid="friends.search.empty_state"
        className="flex flex-col items-center gap-2 py-10 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Search className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium">No athletes found</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Try a different name to find training partners.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          data-ocid="friends.search.error"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-3" data-ocid="friends.search.list">
        {results.map((result, index) => {
          const profile = result.profile;
          const principal = result.principal.toString();
          const isSent = sent.has(principal);
          return (
            <li
              key={principal}
              data-ocid={`friends.search.item.${index}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-fast hover:border-primary/30"
            >
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/15 text-primary">
                  {initials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{profile.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.goal} · {profile.age.toString()} yrs
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {profile.targetSport || "General"}
              </Badge>
              {isSent ? (
                <span
                  data-ocid={`friends.search.sent.${index}`}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  Request sent
                </span>
              ) : (
                <Button
                  data-ocid={`friends.search.send_button.${index}`}
                  type="button"
                  size="sm"
                  className="focus-ring press"
                  disabled={sendRequest.isPending}
                  onClick={() => {
                    setError(null);
                    sendRequest.mutate(result.principal, {
                      onSuccess: (res) => {
                        if (res.__kind__ === "ok") {
                          setSent((current) => {
                            const next = new Set(current);
                            next.add(principal);
                            return next;
                          });
                        } else {
                          setError(res.err);
                        }
                      },
                      onError: (err) =>
                        setError(
                          err instanceof Error
                            ? err.message
                            : "Failed to send request",
                        ),
                    });
                  }}
                >
                  <UserPlus className="size-4" aria-hidden="true" />
                  Add friend
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IncomingRequests() {
  const { data: requests, isLoading } = useFriendRequests();
  const respond = useRespondToFriendRequest();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, i) => `req-skeleton-${i}`).map((id) => (
          <Skeleton key={id} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div
        data-ocid="friends.requests.empty_state"
        className="flex flex-col items-center gap-2 py-8 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UserPlus className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium">No pending requests</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          When someone sends you a friend request, it will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p
          data-ocid="friends.requests.error"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-3" data-ocid="friends.requests.list">
        {requests.map((request, index) => {
          const from = request.from.toString();
          return (
            <li
              key={from}
              data-ocid={`friends.requests.item.${index}`}
              className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-fast hover:border-primary/30"
            >
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary/15 text-primary">
                  {shortPrincipal(from).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {shortPrincipal(from)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Wants to train with you
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  data-ocid={`friends.requests.accept_button.${index}`}
                  type="button"
                  size="sm"
                  className="focus-ring press"
                  disabled={respond.isPending}
                  onClick={() => {
                    setError(null);
                    respond.mutate(
                      { from: request.from, accept: true },
                      {
                        onError: (err) =>
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Failed to accept",
                          ),
                      },
                    );
                  }}
                >
                  <Check className="size-4" aria-hidden="true" />
                  Accept
                </Button>
                <Button
                  data-ocid={`friends.requests.decline_button.${index}`}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="focus-ring press"
                  disabled={respond.isPending}
                  onClick={() => {
                    setError(null);
                    respond.mutate(
                      { from: request.from, accept: false },
                      {
                        onError: (err) =>
                          setError(
                            err instanceof Error
                              ? err.message
                              : "Failed to decline",
                          ),
                      },
                    );
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                  Decline
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  return (
    <div
      data-ocid={isOwn ? "chat.message.own" : "chat.message.friend"}
      className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-subtle ${
          isOwn
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-card text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={`mt-1 text-right text-[10px] leading-none ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatTime(message.sentAtNs)}
        </p>
      </div>
    </div>
  );
}

function ChatView({
  friend,
  open,
  onOpenChange,
}: {
  friend: FriendView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal();
  const { data: messages, isLoading } = useConversation(
    open ? friend.principal : null,
  );
  const sendMessage = useSendMessage();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setDraft("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (isLoading || !messages) return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setError(null);
    sendMessage.mutate(
      { to: friend.principal, text },
      {
        onError: (err) =>
          setError(
            err instanceof Error ? err.message : "Failed to send message",
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="chat.dialog"
        className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg"
      >
        <DialogHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/15 text-primary">
                {initials(friend.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate font-display text-base">
                {friend.name}
              </DialogTitle>
              <DialogDescription className="truncate text-xs">
                {TIER_LABEL[friend.rank.tier]} · Level{" "}
                {friend.rank.level.toString()}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="h-[46vh] flex-1 overflow-y-auto bg-background px-5 py-4"
        >
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, i) => `msg-skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-10 w-2/3" />
                ),
              )}
            </div>
          ) : !messages || messages.length === 0 ? (
            <div
              data-ocid="chat.empty_state"
              className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircle className="size-6" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Say hi to {friend.name.split(" ")[0]} and start your training
                conversation.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id.toString()}
                  message={message}
                  isOwn={myPrincipal?.toString() === message.from.toString()}
                />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card px-4 py-3">
          {error && (
            <p
              data-ocid="chat.error"
              className="mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </p>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <Textarea
              data-ocid="chat.input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${friend.name.split(" ")[0]}…`}
              rows={1}
              className="max-h-32 min-h-[44px] flex-1 resize-none focus-ring"
              aria-label={`Message ${friend.name}`}
            />
            <Button
              data-ocid="chat.send_button"
              type="submit"
              size="icon"
              className="size-11 shrink-0 focus-ring press"
              disabled={draft.trim().length === 0 || sendMessage.isPending}
              aria-label="Send message"
            >
              <Send className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FriendCard({ friend }: { friend: FriendView }) {
  const activeChallenges = friend.challengeProgress.filter(
    (challenge) => challenge.status === "active",
  );
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <li
      data-ocid="friends.list.item"
      className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 transition-fast hover:border-primary/30"
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarFallback className="bg-primary/15 text-primary">
            {initials(friend.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{friend.name}</p>
          <p className="text-xs text-muted-foreground">
            {TIER_LABEL[friend.rank.tier]} · Level{" "}
            {friend.rank.level.toString()}
          </p>
        </div>
        <Badge className="shrink-0">{TIER_LABEL[friend.rank.tier]}</Badge>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Rank progress</span>
          <span className="font-medium text-primary">
            {friend.rank.xp.toString()} XP
          </span>
        </div>
        <Progress value={rankProgress(friend.rank)} />
      </div>

      {activeChallenges.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Active challenges
          </p>
          {activeChallenges.map((challenge) => (
            <div
              key={challenge.id.toString()}
              className="flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="truncate">{challenge.title}</span>
                <span className="shrink-0 text-muted-foreground">
                  {challenge.progress.toString()}/{challenge.target.toString()}
                </span>
              </div>
              <Progress value={challengeProgress(challenge)} />
            </div>
          ))}
        </div>
      )}

      <Button
        data-ocid="friends.list.chat_button"
        type="button"
        variant="outline"
        className="mt-auto w-full focus-ring press"
        onClick={() => setChatOpen(true)}
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        Message
      </Button>

      <ChatView friend={friend} open={chatOpen} onOpenChange={setChatOpen} />
    </li>
  );
}

function FriendsList() {
  const { data: friends, isLoading } = useFriends();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => `friend-skeleton-${i}`).map(
          (id) => (
            <Skeleton key={id} className="h-40 w-full" />
          ),
        )}
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <div
        data-ocid="friends.list.empty_state"
        className="flex flex-col items-center gap-2 py-10 text-center"
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Users className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-medium">No friends yet</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Search for athletes above and send a friend request to get started.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2" data-ocid="friends.list">
      {friends.map((friend) => (
        <FriendCard key={friend.principal.toString()} friend={friend} />
      ))}
    </ul>
  );
}

export default function Friends() {
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: results, isLoading: searching } = useSearchUsers(submitted);

  const handleSearch = () => {
    setSubmitted(term.trim());
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 animate-rise">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Users className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Friends
          </h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Connect with training partners, compare ranks, and keep each other
          accountable.
        </p>
      </div>

      <Card
        data-ocid="friends.search.card"
        className="bg-glow-primary animate-rise"
      >
        <CardHeader>
          <CardTitle className="font-display">Find athletes</CardTitle>
          <CardDescription>
            Search by name to discover other Torque Fit members.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearch();
            }}
          >
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                data-ocid="friends.search_input"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search by name…"
                className="pl-9 focus-ring"
                aria-label="Search athletes by name"
              />
            </div>
            <Button
              data-ocid="friends.search_button"
              type="submit"
              className="focus-ring press"
              disabled={term.trim().length === 0}
            >
              Search
            </Button>
          </form>

          {searching && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }, (_, i) => `search-skeleton-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-16 w-full" />
                ),
              )}
            </div>
          )}

          {!searching && submitted && results && (
            <SearchResults results={results} />
          )}
        </CardContent>
      </Card>

      <Card data-ocid="friends.requests.card" className="animate-rise">
        <CardHeader>
          <CardTitle className="font-display">Incoming requests</CardTitle>
          <CardDescription>
            Accept to start training together, or decline to dismiss.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IncomingRequests />
        </CardContent>
      </Card>

      <Card data-ocid="friends.list.card" className="animate-rise">
        <CardHeader>
          <CardTitle className="font-display">Your friends</CardTitle>
          <CardDescription>
            Rank tier, level, and active challenge progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FriendsList />
        </CardContent>
      </Card>
    </div>
  );
}
