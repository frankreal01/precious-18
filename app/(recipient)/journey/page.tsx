"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";

type Item = { id: string; number?: number; title?: string; body?: string; description?: string; selectable?: boolean; selected?: boolean; mimeType?: string; kind?: string; caption?: string | null; url?: string };
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

const sparks = [
  { x: "8%", y: "14%", d: "0s" }, { x: "90%", y: "10%", d: "1.1s" }, { x: "16%", y: "78%", d: "2.2s" },
  { x: "86%", y: "70%", d: "0.6s" }, { x: "50%", y: "3%", d: "1.7s" }, { x: "70%", y: "92%", d: "2.8s" },
];

export default function Journey() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [gift, setGift] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [giftError, setGiftError] = useState("");
  const [noteError, setNoteError] = useState("");

  useEffect(() => {
    fetch("/api/recipient/content")
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign("/");
          return;
        }
        // A server error returns a JSON error object, which previously crashed the page on data.recipient.
        if (!response.ok) throw new Error("load failed");
        const json = (await response.json()) as JourneyData;
        setGift(json.gifts?.find((item) => item.selected)?.id ?? null);
        setData(json);
      })
      .catch(() => setLoadError("We couldn't load your story. Please refresh to try again."));
  }, []);

  if (!data) return (
    <main className="screen-shell">
      <section className="paper-card" role="status"><BrandMark /><p className="eyebrow">Your keepsake</p><p className="body-copy" style={{ marginTop: 0 }}>{loadError || "Gathering your story…"}</p></section>
    </main>
  );

  if (data.maintenance) return (
    <main className="screen-shell">
      <section className="paper-card"><BrandMark /><p className="eyebrow">A note for you</p><h1 className="display-heading">Your story is being prepared.</h1><p className="body-copy">Something special is on its way. Please check back soon.</p></section>
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
  const back = () => {
    if (subIndex > 0) { setSubIndex((current) => current - 1); return; }
    setSubIndex(0);
    setIndex((current) => Math.max(current - 1, 0));
  };
  // A plain function (not a component defined inside render) so the button isn't remounted on every state change.
  const renderNext = (label = "Continue") => <button onClick={next} className="primary-button">{label}</button>;
  const stepper = (items: Item[], render: (item: Item) => React.ReactNode, label: string, nextLabel: string) => {
    const current = items[Math.min(subIndex, items.length - 1)];
    return (
      <div>
        <div className="journey-prose stepper-item" key={`${step}-${subIndex}`}>{render(current)}</div>
        <div className="pager" role="img" aria-label={`${label} ${subIndex + 1} of ${items.length}`}>
          {items.map((entry, position) => <span key={entry.id} className={`pager-dot${position === subIndex ? " is-active" : position < subIndex ? " is-done" : ""}`} />)}
        </div>
        {subIndex < items.length - 1
          ? <button onClick={() => setSubIndex((value) => value + 1)} className="secondary-button">{nextLabel}</button>
          : renderNext()}
      </div>
    );
  };

  async function chooseGift(id: string) {
    setGiftError("");
    try {
      const response = await post({ giftId: id });
      if (response.ok) setGift(id);
      else setGiftError("That choice could not be saved. Please try again.");
    } catch {
      setGiftError("That choice could not be saved. Please try again.");
    }
  }

  async function saveNote() {
    setSending(true);
    setNoteError("");
    try {
      const response = await post({ message });
      if (response.ok) setSent(true);
      else setNoteError("Your note could not be saved. Please try again.");
    } catch {
      setNoteError("Your note could not be saved. Please try again.");
    } finally {
      setSending(false);
    }
  }

  // The seed script leaves a placeholder closing message; never show that to her.
  const closing = data.settings?.closingMessage?.trim();
  const showClosing = Boolean(closing) && !closing!.startsWith("Edit this closing message");

  return (
    <main className="screen-shell journey-page">
      <div className="journey-wrap">
        <header className="journey-topbar">
          <div className="journey-brand"><BrandMark /><span>Precious, with love</span></div>
          <span className="journey-counter">Chapter {index + 1} of {steps.length}</span>
        </header>
        <div className="progress-track" role="progressbar" aria-label="Story progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <section className="paper-card paper-card--wide journey-card" aria-live="polite">
          <div className={`journey-content${step === "finale" ? " journey-content--finale" : ""}`} key={step}>
            {step === "finale" && sparks.map((spark) => <i key={spark.x + spark.y} className="spark" aria-hidden="true" style={{ "--x": spark.x, "--y": spark.y, "--d": spark.d } as React.CSSProperties} />)}
            <p className="eyebrow">{stepNames[step] ?? "A chapter for you"}</p>
            {step === "welcome" && <>
              <h1 className="welcome-name">{data.recipient.fullName}</h1>
              <div className="soft-rule" />
              <p className="body-copy">Eighteen years of becoming, remembered in little moments. This story was made just for you.</p>
              {renderNext("Begin your story")}
            </>}
            {step === "letter" && <>
              <p className="journey-prose letter">{data.message?.body}</p>
              {data.message?.signature && <p className="journey-signature">{data.message.signature}</p>}
              {renderNext()}
            </>}
            {step === "chapters" && stepper(list("chapters"), (chapter) => <><p className="eyebrow">Chapter {chapter.number}</p><h2>{chapter.title}</h2></>, "Chapter", "Next chapter")}
            {step === "gallery" && <>
              <h2>A few moments to keep</h2>
              <div className="recipient-gallery">{list("media").map((item) => <figure key={item.id} className="gallery-item">
                {item.kind === "image" && <img src={item.url} alt={item.caption || "A shared memory"} loading="lazy" />}
                {item.kind === "video" && <video src={item.url} controls playsInline preload="metadata" aria-label={item.caption || "A shared memory video"} />}
                {item.kind === "audio" && <div className="audio-memory"><BrandMark icon="note" /><audio src={item.url} controls preload="metadata" aria-label={item.caption || "A shared memory recording"} /></div>}
                {item.caption && <figcaption>{item.caption}</figcaption>}
              </figure>)}</div>
              {renderNext()}
            </>}
            {step === "memories" && stepper(list("memories"), (memory) => <><h2>{memory.title}</h2><p>{memory.body}</p></>, "Memory", "Next memory")}
            {step === "wishes" && stepper(list("wishes"), (wish) => <p>{wish.body}</p>, "Wish", "Next wish")}
            {step === "reasons" && <>
              <h2 style={{ marginBottom: 24 }}>{data.settings?.reasonsTitle || "18 little things that make you, you"}</h2>
              {stepper(list("reasons"), (reason) => <p>{reason.body}</p>, "Little thing", "Next one")}
            </>}
            {step === "gift" && <>
              <h2>A little something for you</h2>
              <p className="body-copy">Choose the one that makes you smile.</p>
              <div className="gift-list">{list("gifts").map((item) => <button
                key={item.id}
                disabled={!item.selectable}
                onClick={() => void chooseGift(item.id)}
                className={`gift-option${gift === item.id ? " is-selected" : ""}`}
                aria-pressed={gift === item.id}
              >
                <span className="gift-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                <span className="gift-text"><strong>{item.title}</strong><small>{item.description}</small></span>
              </button>)}</div>
              {giftError && <p className="error-message" role="alert">{giftError}</p>}
              {renderNext()}
            </>}
            {step === "respond" && <>
              <h2>We would love to hear from you.</h2>
              <p className="body-copy">Leave a little note to keep with this memory.</p>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} readOnly={sent} maxLength={2000} rows={5} aria-label="Your message" placeholder="Write whatever is in your heart…" className="text-area" style={{ marginTop: 24 }} />
              {sent
                ? <p className="journey-signature" role="status" style={{ fontSize: 30 }}>Your note has been saved with love.</p>
                : <button disabled={sending || !message.trim()} onClick={() => void saveNote()} className="secondary-button" style={{ marginTop: 16 }}>{sending ? "Saving…" : "Save my note"}</button>}
              {noteError && <p className="error-message" role="alert">{noteError}</p>}
              <div>{renderNext("Finish the story")}</div>
            </>}
            {step === "finale" && <>
              <p className="journey-prose">Not the end of the story. Just the beginning of a new one.</p>
              <div className="soft-rule" />
              <h1><span className="finale-greeting">Happy 18th birthday,</span>{" "}<span className="finale-name">{data.recipient.fullName}</span></h1>
              {showClosing && <p className="body-copy" style={{ whiteSpace: "pre-wrap" }}>{closing}</p>}
              <p className="journey-signature" aria-label="With love">With all my love <svg className="inline-heart" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.3-9.6C1.5 7.9 3.6 4.5 7 4.5c2 0 3.6 1 5 3 1.4-2 3-3 5-3 3.4 0 5.5 3.4 4.3 6.9C19.5 16.4 12 21 12 21z" /></svg></p>
            </>}
            {index > 0 && step !== "finale" && <button className="text-button back-link" onClick={back}>Back</button>}
          </div>
        </section>
        <footer className="journey-footer"><span>Made with love</span><i className="orn" aria-hidden="true" /><span>Always yours</span></footer>
      </div>
    </main>
  );
}
