"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export type Idea = {
  id: string;
  title: string;
  description: string;
  author_nickname: string;
  created_at: string;
  vote_count: number;
};

type ApiError = { error?: string };

async function postJson(path: string, body: unknown): Promise<void> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as ApiError;
    throw new Error(result.error ?? "Something went wrong. Please try again.");
  }
}

export function IdeaBoard({ ideas, loadError }: { ideas: Idea[]; loadError: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [pendingVote, setPendingVote] = useState<string | null>(null);
  const [voted, setVoted] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [voteError, setVoteError] = useState<{ id: string; message: string } | null>(null);

  const totalVotes = ideas.reduce((sum, idea) => sum + idea.vote_count, 0);

  async function submitIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setFormError("");
    setNotice("");
    setSubmitting(true);
    try {
      await postJson("/api/ideas", {
        title: data.get("title"),
        description: data.get("description"),
        author_nickname: data.get("author_nickname"),
      });
      form.reset();
      setNotice("Your idea is on the board.");
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save the idea.");
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(ideaId: string) {
    setVoteError(null);
    setPendingVote(ideaId);
    try {
      await postJson("/api/votes", { ideaId });
      setVoted((current) => [...current, ideaId]);
      router.refresh();
    } catch (error) {
      setVoteError({ id: ideaId, message: error instanceof Error ? error.message : "Could not save the vote." });
    } finally {
      setPendingVote(null);
    }
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>idea<span className="brand-light">board</span></span>
        </div>
        <span className="header-note"><span className="live-dot" />A space for what comes next</span>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div className="eyebrow"><span className="eyebrow-line" /> THE COMMUNITY BOARD</div>
        <div className="intro-row">
          <div>
            <h1 id="page-title">Good ideas start<br />somewhere<span className="period">.</span></h1>
            <p className="intro-copy">Share what’s on your mind. See what others are thinking. Give the ideas you love a little momentum.</p>
          </div>
          <div className="intro-stats" aria-label="Board statistics">
            <div><strong>{ideas.length.toString().padStart(2, "0")}</strong><span>IDEAS SHARED</span></div>
            <div><strong>{totalVotes.toString().padStart(2, "0")}</strong><span>VOTES CAST</span></div>
          </div>
        </div>
      </section>

      <div className="board-layout">
        <section className="composer" aria-labelledby="composer-title">
          <div className="section-kicker">01 / ADD TO THE BOARD</div>
          <h2 id="composer-title">What’s your idea?</h2>
          <p className="section-copy">Big, small, or just beginning. Put it out there.</p>
          <form onSubmit={submitIdea}>
            <label htmlFor="title">Idea title</label>
            <input id="title" name="title" type="text" minLength={3} maxLength={120} required placeholder="Give it a short name" />

            <label htmlFor="description">The details</label>
            <textarea id="description" name="description" minLength={10} maxLength={1000} required rows={5} placeholder="What would you like to see happen?" />

            <label htmlFor="author_nickname">Your nickname</label>
            <input id="author_nickname" name="author_nickname" type="text" minLength={2} maxLength={40} required placeholder="How should we credit you?" />

            <button className="submit-button" type="submit" disabled={submitting || loadError}>
              {submitting ? "Posting…" : "Post idea"}
              <span aria-hidden="true">↗</span>
            </button>
            <p className="form-hint">No account needed. Your nickname appears with your idea.</p>
            {formError && <p className="feedback error" role="alert">{formError}</p>}
            {notice && <p className="feedback success" role="status">{notice}</p>}
          </form>
        </section>

        <section className="ideas-section" aria-labelledby="ideas-title">
          <div className="ideas-heading">
            <div>
              <div className="section-kicker">02 / EXPLORE IDEAS</div>
              <h2 id="ideas-title">On the board <span className="count-badge">{ideas.length}</span></h2>
            </div>
            <span className="sort-note">Newest first</span>
          </div>

          {loadError ? (
            <div className="empty-state" role="alert">
              <span className="empty-symbol" aria-hidden="true">!</span>
              <h3>Board unavailable</h3>
              <p>Check the Supabase environment variables and run the SQL schema, then refresh.</p>
            </div>
          ) : ideas.length === 0 ? (
            <div className="empty-state">
              <span className="empty-symbol" aria-hidden="true">✳</span>
              <h3>It starts with one idea.</h3>
              <p>The board is quiet for now. Share the first thought and get things moving.</p>
            </div>
          ) : (
            <div className="idea-list">
              {ideas.map((idea) => {
                const hasVoted = voted.includes(idea.id);
                return (
                  <article className="idea-card" key={idea.id}>
                    <div className="card-top">
                      <span className="author-avatar" aria-hidden="true">{idea.author_nickname.charAt(0).toUpperCase()}</span>
                      <span className="author-name">{idea.author_nickname}</span>
                      <time dateTime={idea.created_at}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(idea.created_at))}</time>
                    </div>
                    <h3>{idea.title}</h3>
                    <p className="idea-description">{idea.description}</p>
                    <div className="card-bottom">
                      <button
                        className={`vote-button${hasVoted ? " voted" : ""}`}
                        type="button"
                        onClick={() => vote(idea.id)}
                        disabled={pendingVote === idea.id || hasVoted}
                        aria-label={`${hasVoted ? "Voted for" : "Vote for"} ${idea.title}. ${idea.vote_count} votes`}
                      >
                        <span aria-hidden="true">↑</span>
                        {pendingVote === idea.id ? "Voting…" : hasVoted ? "Voted" : "Vote"}
                        <strong>{idea.vote_count}</strong>
                      </button>
                      {voteError?.id === idea.id && <p className="vote-error" role="alert">{voteError.message}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <footer className="site-footer"><span>IDEA BOARD © {new Date().getUTCFullYear()}</span><span>Small ideas can make a big difference.</span></footer>
    </main>
  );
}
