"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API;

const HOUSE = {
  female_only: "Female only household",
  female_preferred: "Female preferred",
  male_preferred: "Male preferred",
  any: "Open to everyone",
};

/* Bedrooms, bathrooms, furnishing and bills as small chips. Used on cards and in the details view. */
export function Specs({ l }) {
  if (!l.bedrooms) return null;
  return (
    <div className="specs">
      <span>🛏 {l.bedrooms} {l.bedrooms === 1 ? "bedroom" : "bedrooms"}</span>
      <span>🛁 {l.bathrooms || 1} {l.bathrooms === 1 ? "bathroom" : "bathrooms"}</span>
      <span>{l.furnished ? "🛋 Furnished" : "📦 Unfurnished"}</span>
      <span className={l.bills_included ? "yes" : ""}>{l.bills_included ? "⚡ Bills included" : "⚡ Bills extra"}</span>
    </div>
  );
}

export function Amenities({ l, max }) {
  const list = l.amenities || [];
  if (!list.length) return null;
  const shown = max ? list.slice(0, max) : list;
  return (
    <div className="amen">
      {shown.map(a => <span key={a}>✓ {a}</span>)}
      {max && list.length > max && <span className="more">+{list.length - max} more</span>}
    </div>
  );
}

/* Full details of one home, with a form to message the lease owner. */
export function Details({ l, placeName, onClose }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    body: `Hi, is "${l.title}" still available? I'd like to arrange an inspection.`,
  });
  const [state, setState] = useState({ busy: false, sent: false, error: "" });
  const month = Math.round((l.rent * 52) / 12);

  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function send(e) {
    e.preventDefault();
    setState({ busy: true, sent: false, error: "" });
    const r = await fetch(`${API}/listings/${l.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    if (r && r.ok) return setState({ busy: false, sent: true, error: "" });
    const msg = r && r.status === 422 ? "Check your email address and message." : "Couldn't send. Please try again.";
    setState({ busy: false, sent: false, error: msg });
  }

  return (
    <div className="modal-back" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="home-title">
        <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>
        <p className="modal-sub">{l.suburb}</p>
        <h2 id="home-title">{l.title}</h2>
        <p className="modal-rent">${l.rent} <span>/ week, about ${month.toLocaleString()} a month</span></p>

        <Specs l={l} />

        <div className="modal-grid">
          <div><p className="k">Who lives there</p><p className="v">{HOUSE[l.household] || l.household}</p></div>
          <div><p className="k">Nearest station</p><p className="v">{l.station}, {l.walk_min} min walk</p></div>
          {l.campus_km !== undefined && (
            <div><p className="k">Distance</p><p className="v">{l.campus_km} km from {placeName || "your location"}</p></div>
          )}
        </div>

        <p className="k">Amenities</p>
        <Amenities l={l} />

        <form className="msg-form" onSubmit={send}>
          <h3>Message the lease owner</h3>
          {state.sent ? (
            <p className="sent">Sent! The lease owner will reply to {form.email}.</p>
          ) : (
            <>
              <div className="msg-row">
                <label><span>Your name</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={80} /></label>
                <label><span>Your email</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required maxLength={120} /></label>
              </div>
              <label><span>Message</span><textarea rows={3} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} required maxLength={1000} /></label>
              {state.error && <p className="error">{state.error}</p>}
              <button className="primary" disabled={state.busy}>{state.busy ? "Sending..." : "Send message"}</button>
              <p className="hint">Never pay a bond or rent before you've inspected the home.</p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
