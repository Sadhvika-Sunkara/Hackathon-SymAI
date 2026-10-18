"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoginScene from "../LoginScene";
import "../login-scene.css";

const API = process.env.NEXT_PUBLIC_API;
const GID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [google, setGoogle] = useState(null); // null = still checking
  const [demo, setDemo] = useState({ name: "", email: "" });
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scene, setScene] = useState("idle"); // idle | walk | wait | reach | open | flash | error
  const btn = useRef(null);

  useEffect(() => {
    fetch(`${API}/subleaser/config`).then(r => r.json()).then(c => setGoogle(c.google && !!GID)).catch(() => setGoogle(false));
  }, []);

  const post = (path, body) =>
    fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Pressing the button starts the walk. Resolves once he is standing at the door.
  function start() {
    if (reduced()) return Promise.resolve();
    setScene("walk");
    return sleep(1000).then(() => setScene(s => (s === "walk" ? "wait" : s)));
  }

  // Success: reach for the knob, open the door, flood the screen with light, go to the app
  async function enter(dest, arrived) {
    await arrived;
    if (reduced()) return router.push(dest);
    setScene("reach"); await sleep(1000); // knock, knock
    setScene("open"); await sleep(600);
    setScene("flash"); await sleep(650);
    router.push(dest);
  }

  // Failure: show the message now, he turns around and walks back
  async function fail(message, arrived) {
    setBusy(false);
    setError(message);
    await arrived;
    setScene("error");
    await sleep(1100);
    setScene(s => (s === "error" ? "idle" : s));
  }

  async function studentLogin(body) {
    setError("");
    setBusy(true);
    const arrived = start();
    const r = await post("/subleaser/login", body);
    if (!r) return fail("Can't reach the backend. Please try again in a moment.", arrived);
    if (!r.ok) return fail((await r.json()).detail || "Sign-in failed", arrived);
    const data = await r.json();
    localStorage.setItem("sl_token", data.token);
    localStorage.setItem("sl_name", data.name);
    enter("/", arrived);
  }

  async function ownerLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const arrived = start();
    const r = await post("/owner/login", creds);
    if (!r) return fail("Can't reach the backend. Please try again in a moment.", arrived);
    if (!r.ok) return fail("Wrong username or password.", arrived);
    localStorage.setItem("owner_pw", (await r.json()).token); // signed session token, not the password
    enter("/owner", arrived);
  }

  // Draw the Google button whenever the student tab is showing
  useEffect(() => {
    if (!google || role !== "student" || !btn.current) return;
    const init = () => {
      window.google.accounts.id.initialize({ client_id: GID, callback: res => studentLogin({ credential: res.credential }) });
      window.google.accounts.id.renderButton(btn.current, { theme: "outline", size: "large", width: 320, text: "continue_with" });
    };
    if (window.google?.accounts) return init();
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [google, role]);

  const pick = r => { setRole(r); setError(""); };

  return (
    <div className="login">
      <aside className="login-side">
        <video className="login-video" poster="/login-bg.jpg" autoPlay muted loop playsInline aria-hidden="true"
          onEnded={e => { e.currentTarget.currentTime = 0; e.currentTarget.play().catch(() => {}); }}>
          <source src="/login-bg.webm" type="video/webm" />
          <source src="/login-bg.mp4" type="video/mp4" />
        </video>
        <Link href="/" className="brand">Nivasya</Link>
        <div>
          <h1>Your one stop for rentals.</h1>
          <ul>
            <li>Renters: see your room, bills and requests</li>
            <li>Owners: manage listings, subleasers and leases</li>
            <li>Everyone: one place, one login</li>
          </ul>
        </div>
        <LoginScene scene={scene} />
        <p className="login-foot">Log in to continue</p>
      </aside>

      <main className="login-main">
        <div className="login-card">
          <h2>Log in</h2>
          <div className="role-tabs" role="tablist">
            <button role="tab" aria-selected={role === "student"} className={role === "student" ? "on" : ""} onClick={() => pick("student")}>Renter / subleaser</button>
            <button role="tab" aria-selected={role === "owner"} className={role === "owner" ? "on" : ""} onClick={() => pick("owner")}>Lease owner</button>
          </div>

          {role === "student" && (
            <>
              <p className="hint">{google ? "Sign in with Google to see your room, bills and complaints." : "Sign in with your name and email to see your room, bills and complaints."}</p>
              {google === true && <div ref={btn} className="gbtn" />}
              {google === false && (
                <form onSubmit={e => { e.preventDefault(); studentLogin({ demo_name: demo.name, demo_email: demo.email }); }}>
                  <label className="field"><span>Name</span><input value={demo.name} onChange={e => setDemo({ ...demo, name: e.target.value })} required /></label>
                  <label className="field"><span>Email</span><input type="email" value={demo.email} onChange={e => setDemo({ ...demo, email: e.target.value })} required /></label>
                  <button className="primary" disabled={busy}>{busy ? "Signing in..." : "Continue"}</button>
                </form>
              )}
            </>
          )}

          {role === "owner" && (
            <form onSubmit={ownerLogin}>
              <p className="hint">Sign in to manage your listings and subleasers.</p>
              <label className="field"><span>Username</span><input value={creds.username} onChange={e => setCreds({ ...creds, username: e.target.value })} autoComplete="username" required /></label>
              <label className="field"><span>Password</span>
                <div className="pwrow">
                  <input type={show ? "text" : "password"} value={creds.password} onChange={e => setCreds({ ...creds, password: e.target.value })} autoComplete="current-password" required />
                  <button type="button" onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>
                </div>
              </label>
              <button className="primary" disabled={busy}>{busy ? "Signing in..." : "Log in"}</button>
            </form>
          )}

          {error && <p className="error" role="alert">{error}</p>}
          <Link href="/" className="back">Back to room search</Link>
        </div>
      </main>
    </div>
  );
}