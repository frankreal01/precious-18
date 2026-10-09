"use client";

import { useEffect, useState } from "react";

type Item = { id: string; number?: number; title?: string; body?: string; description?: string; selectable?: boolean; mimeType?: string; kind?: string; caption?: string | null; url?: string };
type JourneyData = {
  maintenance?: boolean;
  recipient: { fullName: string };
  settings?: { reasonsTitle?: string; closingMessage?: string };
  message?: { body: string; signature?: string | null };
  chapters?: Item[];
  media?: Item[];
  memories?: Item[];
  wishes?: Item[];
  reasons?: Item[];
  gifts?: Item[];
};

const post = (body: object) => fetch("/api/recipient/respond", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export default function Journey() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [gift, setGift] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/recipient/content")
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign("/");
          return;
        }
        setData(await response.json());
      })
      .catch(() => setError("We couldn't load your story. Please refresh to try again."));
  }, []);

  if (!data) return (
    <main className="screen-shell">
      <section className="paper-card" role="status"><div className="brand-mark" aria-hidden="true">♡</div><p className="eyebrow">Your keepsake</p><p className="body-copy">{error || "Gathering your story…"}</p></section>
    </main>
  );

  if (data.maintenance) return (
    <main className="screen-shell">
      <section className="paper-card"><div className="brand-mark" aria-hidden="true">♡</div><p className="eyebrow">A note for you</p><h1 className="display-heading">Your story is being prepared.</h1><p className="body-copy">Something special is on its way. Please check back soon.</p></section>
    </main>
  );

  const list = (key: "chapters" | "memories" | "wishes" | "reasons" | "gifts" | "media"): Item[] => data[key] ?? [];
  const steps = [
    "welcome",
    ...(data.message ? ["letter"] : []),
    ...(list("chapters").length ? ["chapters"] : []),
    ...(list("media").length ? ["gallery"] : []),
    ...(list("memories").length ? ["memories"] : []),
    ...(list("wishes").length ? ["wishes"] : []),
    ...(list("reasons").length ? ["reasons"] : []),
    ...(list("gifts").length ? ["gift"] : []),
    "respond",
    "finale",
  ];
  const step = steps[index];
  const stepNames: Record<string, string> = { welcome: "A beginning", letter: "A letter", chapters: "Your chapters", gallery: "Little moments", memories: "Memories", wishes: "Birthday wishes", reasons: "All the little things", gift: "A little gift", respond: "A note from you", finale: "The next chapter" };
  const progress = Math.round(((index + 1) / steps.length) * 100);
  const next = () => { setSubIndex(0); setIndex((current) => Math.min(current + 1, steps.length - 1)); };
  const NextButton = ({ label = "Continue" }: { label?: string }) => <button onClick={next} className="primary-button" style={{ marginTop: 32 }}>{label}<span aria-hidden="true">→</span></button>;
  const stepper = (items: Item[], render: (item: Item) => React.ReactNode, label: string) => (
    <div key={step}>
      <div className="journey-prose">{render(items[subIndex])}</div>
      <p className="item-count">{label} · {subIndex + 1} of {items.length}</p>
      {subIndex < items.length - 1
        ? <button onClick={() => setSubIndex((current) => current + 1)} className="secondary-button" style={{ marginTop: 26 }}>Next memory <span aria-hidden="true">→</span></button>
        : <NextButton />}
    </div>
  );

  return (
    <main className="screen-shell journey-page">
      <div className="journey-wrap">
        <header className="journey-topbar">
          <div className="journey-brand"><span className="brand-mark" aria-hidden="true">♡</span><span>Precious, with love</span></div>
          <span className="journey-counter">Chapter {index + 1} of {steps.length}</span>
        </header>
        <div className="progress-track" role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <section className="paper-card paper-card--wide journey-card" aria-live="polite">
          <div className="journey-content" key={step}>
            <p className="eyebrow">{stepNames[step] ?? "A chapter for you"}</p>
            {step === "welcome" && <>
              <h1>{data.recipient.fullName}</h1>
              <div className="soft-rule" />
              <p className="body-copy">Eighteen years of becoming, remembered in little moments. This story was made just for you.</p>
              <NextButton label="Begin your story" />
            </>}
            {step === "letter" && <>
              <p className="journey-prose">{data.message?.body}</p>
              {data.message?.signature && <p className="journey-signature">{data.message.signature}</p>}
              <NextButton />
            </>}
            {step === "chapters" && stepper(list("chapters"), (chapter) => <><p className="eyebrow" style={{ marginBottom: 8 }}>Chapter {chapter.number}</p><h2>{chapter.title}</h2></>, "Chapter")}
            {step === "gallery" && <>
              <h2>A few moments to keep</h2>
              <div className="recipient-gallery">{list("media").map((item) => <figure key={item.id} className="gallery-item">
                {item.kind === "image" && <img src={item.url} alt={item.caption || "A shared memory"} loading="lazy" />}
                {item.kind === "video" && <video src={item.url} controls preload="metadata" aria-label={item.caption || "A shared memory video"} />}
                {item.kind === "audio" && <div className="audio-memory"><span className="brand-mark" aria-hidden="true">♫</span><audio src={item.url} controls preload="metadata" aria-label={item.caption || "A shared memory recording"} /></div>}
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>)}</div>
              <NextButton />
            </>}
            {step === "memories" && stepper(list("memories"), (memory) => <><h2>{memory.title}</h2><p>{memory.body}</p></>, "Memory")}
            {step === "wishes" && stepper(list("wishes"), (wish) => <p>{wish.body}</p>, "Wish")}
            {step === "reasons" && <>
              <h2 style={{ marginBottom: 24 }}>{data.settings?.reasonsTitle || "18 little things that make you, you"}</h2>
              {stepper(list("reasons"), (reason) => <p>{reason.body}</p>, "Little thing")}
            </>}
            {step === "gift" && <>
              <h2>A little something for you</h2>
              <p className="body-copy">Choose the one that makes you smile.</p>
              <div className="gift-list">{list("gifts").map((item) => <button
                key={item.id}
                disabled={!item.selectable}
                onClick={async () => {
                  const response = await post({ giftId: item.id });
                  if (response.ok) { setGift(item.id); setError(""); }
                  else setError("That choice could not be saved. Please try again.");
                }}
                className={`gift-option${gift === item.id ? " is-selected" : ""}`}
                aria-pressed={gift === item.id}
              ><strong>{item.title}</strong><span>{item.description}</span></button>)}</div>
              {error && <p className="error-message" role="alert">{error}</p>}
              <NextButton />
            </>}
            {step === "respond" && <>
              <h2>We would love to hear from you.</h2>
              <p className="body-copy">Leave a little note to keep with this memory.</p>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={5} aria-label="Your message" placeholder="Write whatever is in your heart…" className="text-area" style={{ marginTop: 24 }} />
              {sent ? <p className="journey-signature" role="status">Your note has been saved with love.</p> : <button disabled={sending || !message.trim()} onClick={async () => {
                setSending(true);
                try { const response = await post({ message }); if (response.ok) setSent(true); else setError("Your note could not be saved. Please try again."); }
                catch { setError("Your note could not be saved. Please try again."); }
                finally { setSending(false); }
              }} className="secondary-button" style={{ marginTop: 14 }}>{sending ? "Saving…" : "Save my note"}</button>}
              {error && <p className="error-message" role="alert">{error}</p>}
              <div><NextButton label="Finish the story" /></div>
            </>}
            {step === "finale" && <>
              <p className="journey-prose">Not the end of the story. Just the beginning of a new one.</p>
              <div className="soft-rule" />
              <h1>Happy 18th birthday, {data.recipient.fullName}</h1>
              <p className="body-copy" style={{ whiteSpace: "pre-wrap" }}>{data.settings?.closingMessage}</p>
              <p className="journey-signature" aria-label="With love">With all my love <span aria-hidden="true">♡</span></p>
            </>}
          </div>
        </section>
        <footer className="journey-footer">MADE WITH LOVE · ALWAYS YOURS</footer>
      </div>
    </main>
  );
}
