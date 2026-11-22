"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

const lines = ["18 chapters. One beautiful story.", "18 years of becoming.", "And this is where Chapter 18 begins."];

export default function Landing() {
  const [stage, setStage] = useState<"mystery" | "ask" | "unlock">("mystery");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Move on to the story once the unlock lines have played. Cleared if she leaves the page first.
  useEffect(() => {
    if (stage !== "unlock") return;
    const timer = window.setTimeout(() => window.location.assign("/journey"), 6500);
    return () => window.clearTimeout(timer);
  }, [stage]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/recipient/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthday: value.trim() }),
      });
      const result = await response.json();
      if (result.ok) setStage("unlock");
      else setError(result.error ?? "Please check the date and try again.");
    } catch {
      setError("We couldn't connect just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen-shell">
      <section className={`paper-card${stage === "unlock" ? " is-unlocking" : ""}`} aria-live="polite">
        <BrandMark />
        <p className="eyebrow">A little celebration of you</p>

        {stage === "mystery" && (
          <>
            <h1 className="display-heading">A story made just for you.</h1>
            <div className="soft-rule" />
            <p className="body-copy">Eighteen years, countless little moments, and one very special person. There is something lovely waiting inside.</p>
            <button onClick={() => setStage("ask")} className="primary-button" style={{ marginTop: 32 }}>Open your surprise</button>
            <p className="fine-print" style={{ marginTop: 22 }}>A keepsake for your eighteenth birthday</p>
          </>
        )}

        {stage === "ask" && (
          <form onSubmit={submit}>
            <h1 className="display-heading">One little question…</h1>
            <p className="body-copy">When is your birthday? Enter the date to open your story.</p>
            <label htmlFor="birthday" className="form-label" style={{ textAlign: "center" }}>Your date of birth</label>
            <input
              id="birthday"
              name="birthday"
              type="text"
              inputMode="numeric"
              autoComplete="bday"
              placeholder="DD/MM/YYYY"
              maxLength={10}
              value={value}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                setValue([digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join("/"));
              }}
              className="text-input text-input--date"
              aria-describedby="birthday-help birthday-error"
              required
            />
            <p id="birthday-help" className="fine-print" style={{ margin: "10px 0 0" }}>Please use day / month / year.</p>
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
          </div>
        )}
      </section>
      <p className="page-foot">Made with love, for a once-in-a-lifetime chapter</p>
    </main>
  );
}
