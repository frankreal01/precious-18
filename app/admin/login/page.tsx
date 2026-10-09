"use client";

import { useState } from "react";

export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      if (response.ok) window.location.assign("/admin/dashboard");
      else setError((await response.json()).error ?? "Those details could not be verified.");
    } catch {
      setError("We couldn't connect just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="screen-shell">
      <form onSubmit={signIn} className="paper-card login-card">
        <div className="brand-mark" aria-hidden="true">♡</div>
        <p className="eyebrow">Private keepsake</p>
        <h1 className="display-heading" style={{ fontSize: 36 }}>Welcome back</h1>
        <p className="body-copy" style={{ marginTop: 12 }}>Sign in to care for this story.</p>
        <label htmlFor="admin-email" className="form-label">Email address</label>
        <input id="admin-email" name="email" type="email" autoComplete="username" required placeholder="you@example.com" className="text-input" />
        <label htmlFor="admin-password" className="form-label" style={{ marginTop: 18 }}>Password</label>
        <input id="admin-password" name="password" type="password" autoComplete="current-password" required placeholder="Your password" className="text-input" />
        <p role="alert" className="error-message">{error}</p>
        <button disabled={busy} className="primary-button">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
