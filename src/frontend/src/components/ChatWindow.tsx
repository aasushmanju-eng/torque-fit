import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bot,
  RotateCcw,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
}

interface ChatWindowProps {
  onSend: (message: string) => Promise<string>;
  suggestedPrompts: string[];
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  placeholder?: string;
}

function TypingIndicator() {
  return (
    <div
      data-ocid="chat_typing"
      className="flex items-center gap-1.5"
      aria-label="Coach is typing"
    >
      {["typing-0", "typing-1", "typing-2"].map((id) => (
        <span
          key={id}
          className="size-1.5 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: `${Number(id.slice(-1)) * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function ChatWindow({
  onSend,
  suggestedPrompts,
  title,
  subtitle,
  emptyTitle,
  emptyDescription,
  placeholder = "Ask your diet coach anything…",
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || pending) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, pending]);

  async function deliver(text: string) {
    setError(null);
    setPending(true);
    try {
      const reply = await onSend(text);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.content === text && m.role === "user" ? { ...m, failed: true } : m,
        ),
      );
      setError(
        err instanceof Error
          ? err.message
          : "The coach couldn't respond right now. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  function submit() {
    const text = input.trim();
    if (!text || pending) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);
    setInput("");
    void deliver(text);
  }

  function retry() {
    const failed = messages.find((m) => m.failed);
    if (!failed || pending) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === failed.id ? { ...m, failed: false } : m)),
    );
    void deliver(failed.content);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const showEmpty = messages.length === 0;

  return (
    <div
      data-ocid="chat_window"
      className="flex h-[calc(100vh-16rem)] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Bot className="size-5" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 className="font-display text-base font-semibold leading-tight">
            {title}
          </h2>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {showEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="size-7" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-lg font-semibold">
                {emptyTitle}
              </h3>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                {emptyDescription}
              </p>
            </div>
            <div className="mt-2 flex max-w-lg flex-wrap justify-center gap-2">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={prompt}
                  type="button"
                  data-ocid={`suggested_prompt.${i + 1}`}
                  onClick={() => {
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        role: "user",
                        content: prompt,
                      },
                    ]);
                    void deliver(prompt);
                  }}
                  className="rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-left text-xs font-medium text-primary transition-smooth hover:bg-primary/20"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-ocid={`chat_message.${msg.role}`}
                className={cn(
                  "flex w-full gap-3",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {msg.role === "assistant" && (
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Bot className="size-4" aria-hidden="true" />
                  </span>
                )}
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border border-border bg-background text-foreground",
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <User className="size-4" aria-hidden="true" />
                  </span>
                )}
              </div>
            ))}

            {pending && (
              <div className="flex w-full justify-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Bot className="size-4" aria-hidden="true" />
                </span>
                <div className="rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            )}

            {error && (
              <div
                data-ocid="chat_error"
                className="flex items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3"
              >
                <div className="flex items-center gap-2.5 text-sm text-destructive-foreground">
                  <AlertTriangle
                    className="size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
                <Button
                  data-ocid="chat_retry_button"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={retry}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-border px-5 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            data-ocid="chat_input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="min-h-11 max-h-40 resize-none"
            aria-label="Message your diet coach"
          />
          <Button
            data-ocid="chat_send_button"
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={!input.trim() || pending}
            aria-label="Send message"
          >
            <Send className="size-4" aria-hidden="true" />
          </Button>
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Press Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
