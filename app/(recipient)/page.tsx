"use client";

import { useState } from "react";

const lines = ["18 chapters. One beautiful story.", "18 years of becoming.", "And this is where Chapter 18 begins."];

export default function Landing() {
  const [stage, setStage] = useState<"mystery" | "ask" | "unlock">("mystery");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/recipient/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthday: value.trim() }),
      });
      const result = await response.json();
      if (result.ok) {
        setStage("unlock");
        window.setTimeout(() => window.location.assign("/journey"), 6500);
      } else {
        setError(result.error ?? "Please check the date and try again.");
      }
    } catch {
      setError("We couldn't connect just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen-shell">
      <section className="paper-card" aria-live="polite">
        <div className="brand-mark" aria-hidden="true">♡</div>
        <p className="eyebrow">A little celebration of you</p>

        {stage === "mystery" && (
          <>
            <h1 className="display-heading">A story made just for you.</h1>
            <div className="soft-rule" />
            <p className="body-copy">Eighteen years, countless little moments, and one very special person. There is something lovely waiting inside.</p>
            <button onClick={() => setStage("ask")} className="primary-button" style={{ marginTop: 30 }}>
              Open your surprise <span aria-hidden="true">→</span>
            </button>
            <p className="fine-print" style={{ marginTop: 20 }}>A keepsake for your eighteenth birthday</p>
          </>
        )}

        {stage === "ask" && (
          <form onSubmit={submit}>
            <h1 className="display-heading">One little question…</h1>
            <p className="body-copy">When is your birthday? Enter the date to open your story.</p>
            <label htmlFor="birthday" className="form-label">Your date of birth</label>
            <input
              id="birthday"
              name="birthday"
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="DD/MM/YYYY"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="text-input"
              aria-describedby="birthday-help birthday-error"
              required
            />
            <p id="birthday-help" className="fine-print" style={{ margin: "9px 0 0", textAlign: "left" }}>Please use day / month / year.</p>
            <p id="birthday-error" className="error-message" role="alert">{error}</p>
            <button disabled={busy} className="primary-button" style={{ width: "100%", marginTop: 6 }}>
              {busy ? "Checking…" : "Unlock your story"}
            </button>
            <button type="button" onClick={() => { setError(""); setStage("mystery"); }} className="text-button" style={{ marginTop: 18 }}>Go back</button>
          </form>
        )}

        {stage === "unlock" && (
          <div className="unlock-copy">
            {lines.map((line, index) => <p key={line} style={{ animationDelay: `${index * 1.8}s` }}>{line}</p>)}
            <style>{`.unlock-copy p { opacity: 0; animation: unlock-fade 1.5s ease forwards; color: var(--wine-dark); font-family: var(--font-display); font-size: clamp(21px, 4vw, 29px); line-height: 1.55; } @keyframes unlock-fade { to { opacity: 1; } }`}</style>
          </div>
        )}
      </section>
      <p className="fine-print" style={{ position: "absolute", bottom: 16, zIndex: 1, textAlign: "center" }}>Made with love, for a once-in-a-lifetime chapter</p>
    </main>
  );
}
