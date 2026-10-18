"use client";

// Illustrated sample face, generated from a name. Stands in for the verified photo in this demo,
// so no real face images are ever stored or shown.
const SKIN = ["#f6d1b1", "#e8b48f", "#c98e64", "#a26a45", "#7a4b2f", "#ffd9c0"];
const HAIR = ["#2b1d14", "#4a2f1d", "#7b4a24", "#c08a3e", "#1c1c2e", "#8b2f3c"];
const BG = ["#e9e2ff", "#d8f3ee", "#fde4ef", "#e3ecfa", "#fff1d6", "#e6f6e0"];

const hash = s => [...(s || "?")].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);

export function Avatar({ name, size = 56 }) {
  const h = hash(name);
  const skin = SKIN[h % SKIN.length], hair = HAIR[(h >> 3) % HAIR.length], bg = BG[(h >> 6) % BG.length];
  const long = (h >> 9) % 2 === 0;
  return (
    <svg className="avatar-face" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Sample photo of ${name}`}>
      <rect width="64" height="64" rx="32" fill={bg} />
      {long && <path d="M14 34c0-14 8-22 18-22s18 8 18 22v16H14z" fill={hair} />}
      <path d="M12 64c2-11 10-16 20-16s18 5 20 16z" fill="#6d4fd0" />
      <rect x="27" y="40" width="10" height="9" rx="3" fill={skin} />
      <ellipse cx="32" cy="30" rx="13" ry="14" fill={skin} />
      <path d={long ? "M19 28c0-9 6-15 13-15s13 6 13 15c-4-5-9-7-13-7s-9 2-13 7z" : "M19 27c1-9 6-14 13-14s12 5 13 14c-3-4-8-6-13-6s-10 2-13 6z"} fill={hair} />
      <circle cx="27" cy="31" r="1.6" fill="#1c1738" />
      <circle cx="37" cy="31" r="1.6" fill="#1c1738" />
      <path d="M28 37q4 3 8 0" stroke="#1c1738" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const ID_LABEL = { driver_licence: "Driver licence", passport: "Passport", photo_card: "Photo card" };

// "ID verified ✓  Face matched ✓" chips
export function VerifyBadges({ s }) {
  const id = s.id_status === "verified", face = s.face_status === "verified";
  return (
    <span className="vbadges">
      <span className={id ? "vb ok" : "vb"}>{id ? `✓ ID verified (${ID_LABEL[s.id_type] || "ID"})` : "ID not verified"}</span>
      <span className={face ? "vb ok" : "vb"}>{face ? "✓ Face matched" : "Face not checked"}</span>
    </span>
  );
}

export { ID_LABEL };

// ---------- Sample housemates for a home (fictional people, generated per listing) ----------
const NAMES = {
  F: ["Aisha", "Mei", "Sophie", "Priya", "Chloe", "Zara", "Hana", "Olivia", "Ananya", "Lucia", "Grace", "Nadia"],
  M: ["Arjun", "Liam", "Kenji", "Omar", "Lucas", "Ethan", "Ravi", "Noah", "Diego", "Sam", "Wei", "Jack"],
};
const AGES = ["19–22", "22–25", "25–30", "30–35"];
const WHAT = ["Student", "Student", "Works full time", "Nurse", "Student", "Works part time", "Engineer"];

export function housematesFor(l) {
  const n = Math.max(1, Math.min(5, (l.bedrooms || 2) - 1));
  const pick = i => {
    const h = (l.id * 37 + i * 101) >>> 0;
    let g;
    if (l.household === "female_only") g = "F";
    else if (l.household === "female_preferred") g = h % 5 === 0 ? "M" : "F";
    else if (l.household === "male_preferred") g = h % 5 === 0 ? "F" : "M";
    else g = h % 2 ? "F" : "M";
    const list = NAMES[g];
    return {
      name: list[(h >> 2) % list.length],
      gender: g === "F" ? "Female" : "Male",
      age: AGES[(h >> 4) % AGES.length],
      what: WHAT[(h >> 5) % WHAT.length],
      verified: (h >> 7) % 6 !== 0,
    };
  };
  return Array.from({ length: n }, (_, i) => pick(i));
}

// Small stacked faces for the card
export function HousemateStack({ l }) {
  const people = housematesFor(l);
  const f = people.filter(p => p.gender === "Female").length;
  return (
    <div className="hm-stack" title="Sample housemates">
      <div className="hm-faces">{people.map((p, i) => <Avatar key={i} name={p.name + l.id} size={30} />)}</div>
      <span className="hm-count">
        <b>{people.length} {people.length === 1 ? "person lives" : "people live"} here</b>
        <span className="hm-g f">👩 {f} female</span>
        <span className="hm-g m">👨 {people.length - f} male</span>
      </span>
    </div>
  );
}

// Full list for the details view
export function HousemateList({ l }) {
  const people = housematesFor(l);
  const f = people.filter(p => p.gender === "Female").length;
  return (
    <div className="hm-list">
      <div className="hm-count big">
        <b>{people.length} {people.length === 1 ? "person lives" : "people live"} here</b>
        <span className="hm-g f">👩 {f} female</span>
        <span className="hm-g m">👨 {people.length - f} male</span>
      </div>
      {people.map((p, i) => (
        <div key={i} className="hm">
          <Avatar name={p.name + l.id} size={46} />
          <div>
            <b>{p.name}</b>
            <span>{p.gender}, {p.age} · {p.what}</span>
          </div>
          <span className={p.verified ? "vb ok" : "vb"}>{p.verified ? "✓ Verified" : "Verifying"}</span>
        </div>
      ))}
      <p className="demo-tag">Sample housemates: fictional people for this demo.</p>
    </div>
  );
}
