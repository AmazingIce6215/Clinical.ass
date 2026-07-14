"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { Button, Notice, Surface } from "@/components/ui/primitives";

export function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Your message could not be sent right now.");
      setMessage("");
      setSent(true);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Your message could not be sent right now.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Surface className="p-5 sm:p-6">
      <div>
        <p className="section-label">Feedback</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-foreground">Report a problem or suggest an improvement</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Messages are sent to the project maintainer through Resend. Do not include patient-identifiable or sensitive clinical information.</p>
      </div>
      {sent ? (
        <div className="mt-5 flex items-start gap-3 rounded-[10px] border border-success/25 bg-success-soft p-4" role="status">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div className="flex-1"><p className="text-sm font-semibold text-foreground">Message received</p><p className="mt-1 text-sm text-muted">Thank you. The feedback has been sent to the maintainer.</p></div>
          <button type="button" onClick={() => setSent(false)} className="text-xs font-semibold text-success hover:underline">Send another</button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">Your message</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={4000} placeholder="Describe what happened, what you expected, or what would make Wardly more useful." className="mt-1.5 w-full resize-y rounded-[10px] border border-border bg-surface px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-muted/65 focus:border-accent focus:ring-2 focus:ring-accent/15" />
          </label>
          {error ? <Notice title="Message not sent" tone="danger">{error}</Notice> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">{message.length.toLocaleString()} / 4,000 characters</p>
            <Button type="submit" disabled={!message.trim() || sending}>
              <Send aria-hidden="true" className="h-4 w-4" /> {sending ? "Sending…" : "Send feedback"}
            </Button>
          </div>
        </form>
      )}
    </Surface>
  );
}
