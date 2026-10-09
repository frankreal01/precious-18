"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AdminRow = { id: string; title?: string; body?: string; description?: string; status?: string; action?: string; message?: string; createdAt?: string };
type Dashboard = {
  recipient?: { fullName: string };
  state: string;
  counts: Record<string, number>;
  responses: AdminRow[];
  logs: AdminRow[];
};

const fields: Record<string, { name: string; area?: boolean }[]> = {
  memories: [{ name: "title" }, { name: "body", area: true }],
  wishes: [{ name: "body", area: true }],
  reasons: [{ name: "body", area: true }],
  gifts: [{ name: "title" }, { name: "description", area: true }],
  chapters: [{ name: "title" }],
  messages: [{ name: "body", area: true }, { name: "signature" }],
};
const navItems = ["dashboard", "messages", "memories", "wishes", "reasons", "gifts", "chapters"];

async function api(path: string, method = "GET", body?: object) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Something went wrong. Please try again.");
  return result;
}

export default function AdminSection() {
  const { section } = useParams<{ section: string }>();
  const [rows, setRows] = useState<AdminRow[] | Dashboard | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try { setRows(await api(section)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load this section."); }
  }, [section]);
  useEffect(() => { setRows(null); void load(); }, [load]);

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const currentRows = Array.isArray(rows) ? rows : [];
    const body: Record<string, unknown> = { position: currentRows.length };
    fields[section]?.forEach(({ name }) => { body[name] = form.get(name); });
    if (section === "chapters") { body.number = currentRows.length + 1; body.kind = "custom"; }
    try {
      await api(section, "POST", body);
      event.currentTarget.reset();
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save this item."); }
    finally { setSaving(false); }
  }

  async function updateStatus(id: string, status: string) {
    try { await api(`${section}?id=${encodeURIComponent(id)}`, "PATCH", { status }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update this item."); }
  }

  async function remove(id: string) {
    try { await api(`${section}?id=${encodeURIComponent(id)}`, "DELETE"); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete this item."); }
  }

  const dashboard = section === "dashboard" && rows && !Array.isArray(rows) ? rows as Dashboard : null;
  const contentRows = Array.isArray(rows) ? rows : [];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand"><span className="brand-mark" aria-hidden="true">♡</span><span>Precious, with love</span></div>
          <p className="eyebrow" style={{ margin: 0 }}>Keepsake studio</p>
        </div>
      </header>
      <nav className="admin-nav" aria-label="Admin sections">
        {navItems.map((item) => <a key={item} href={`/admin/${item}`} className={item === section ? "is-active" : ""} aria-current={item === section ? "page" : undefined}>{item}</a>)}
      </nav>

      <div className="admin-main">
        {error && <p role="alert" className="error-message" style={{ margin: "0 0 18px" }}>{error}</p>}
        {section === "dashboard" && dashboard && <div style={{ display: "grid", gap: 20 }}>
          <section className="admin-panel">
            <p className="eyebrow">Your celebration</p>
            <h1>{dashboard.recipient?.fullName ?? "Birthday experience"}</h1>
            <p className="body-copy" style={{ margin: "8px 0 20px" }}>Review your story, prepare its chapters, and publish when everything feels just right.</p>
            <span className="status-pill"><span className="status-dot" />{dashboard.state.toLowerCase()}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
              {[{ state: "DRAFT", label: "Set to draft" }, { state: "PUBLISHED", label: "Publish experience" }, { state: "UNPUBLISHED", label: "Unpublish" }, { state: "MAINTENANCE", label: "Pause experience" }].map(({ state, label }) => <button key={state} onClick={async () => { try { await api("state", "POST", { state }); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update status."); } }} className={state === "PUBLISHED" ? "primary-button" : "secondary-button"}>{label}</button>)}
            </div>
          </section>

          <section className="admin-panel">
            <p className="eyebrow">At a glance</p>
            <h2 style={{ marginBottom: 18 }}>Your story so far</h2>
            <div className="stat-grid">{Object.entries(dashboard.counts).map(([name, count]) => <div className="stat-card" key={name}><strong>{count}</strong><span>{name}</span></div>)}</div>
          </section>

          <section className="admin-panel">
            <p className="eyebrow">From the recipient</p>
            <h2 style={{ marginBottom: 8 }}>Responses</h2>
            {!dashboard.responses.length && <p className="body-copy" style={{ margin: "6px 0" }}>Notes and reactions will appear here.</p>}
            {dashboard.responses.map((response) => <div className="admin-list-row" key={response.id}><p>{response.message || "A reaction was shared."}</p><span className="fine-print">{response.createdAt ? new Date(response.createdAt).toLocaleString() : ""}</span></div>)}
          </section>

          <section className="admin-panel">
            <p className="eyebrow">Recent changes</p>
            <h2 style={{ marginBottom: 8 }}>Activity</h2>
            {!dashboard.logs.length && <p className="body-copy" style={{ margin: "6px 0" }}>Your recent updates will appear here.</p>}
            {dashboard.logs.map((log) => <div className="admin-list-row" key={log.id}><p>{log.action}</p><span className="fine-print">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</span></div>)}
          </section>
        </div>}

        {fields[section] && <div style={{ display: "grid", gap: 20 }}>
          <section className="admin-panel">
            <p className="eyebrow">Add to the story</p>
            <h1>{section === "messages" ? "Your letter" : `Your ${section}`}</h1>
            <p className="body-copy" style={{ margin: "8px 0 24px" }}>Add a thoughtful detail. New items start as drafts so you can review them first.</p>
            <form onSubmit={add} style={{ display: "grid", gap: 12 }}>
              {fields[section].map(({ name, area }) => area
                ? <textarea key={name} name={name} required={name === "body" || name === "description"} placeholder={name === "body" ? "Write your message…" : name === "description" ? "Add a few details…" : name} rows={5} className="text-area" />
                : <input key={name} name={name} required={name === "title"} placeholder={name === "title" ? "Give it a title" : "Signature"} className="text-input" />)}
              <div><button disabled={saving} className="primary-button">{saving ? "Saving…" : "Save as draft"}</button></div>
            </form>
          </section>
          <section className="admin-panel">
            <p className="eyebrow">Your collection</p>
            <h2 style={{ marginBottom: 10 }}>Saved items <span className="fine-print">({contentRows.length})</span></h2>
            {!contentRows.length && <p className="body-copy" style={{ margin: "6px 0" }}>Nothing here yet. Your first entry can make this story feel wonderfully personal.</p>}
            {contentRows.map((row) => <div className="admin-list-row" key={row.id}>
              <div style={{ minWidth: 0 }}><p style={{ fontWeight: 650 }}>{row.title ?? row.body ?? row.description ?? "Untitled"}</p><p className="fine-print" style={{ marginTop: 5 }}>{row.status?.toLowerCase() ?? "draft"}</p></div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button className="secondary-button" onClick={() => void updateStatus(row.id, row.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}>{row.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                <button className="text-button" onClick={() => void remove(row.id)}>Delete</button>
              </div>
            </div>)}
          </section>
        </div>}
      </div>
    </main>
  );
}
