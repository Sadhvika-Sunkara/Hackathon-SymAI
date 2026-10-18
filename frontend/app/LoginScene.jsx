"use client";
import { useEffect, useRef, useState } from "react";

/*
  A student in a hoodie walks to a glowing door when you log in.
  scene: idle | walk | wait | reach | open | flash | error  (styles live in login-scene.css)
*/
export default function LoginScene({ scene = "idle" }) {
  const door = useRef(null);
  const [origin, setOrigin] = useState({ x: "50%", y: "50%" });

  // The light flood starts from the door
  useEffect(() => {
    if (scene !== "flash" || !door.current) return;
    const r = door.current.getBoundingClientRect();
    setOrigin({ x: `${r.left + r.width / 2}px`, y: `${r.top + r.height / 2}px` });
  }, [scene]);

  // "flash" keeps the door open; the full-screen light is a separate layer
  const state = scene === "flash" ? "open" : scene;

  return (
    <>
      <div className={`ls-scene ls-${state}`} aria-hidden="true">
        <svg viewBox="0 -44 430 264">
          <defs>
            <linearGradient id="ls-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff7e0" />
              <stop offset="1" stopColor="#ffd166" />
            </linearGradient>
          </defs>

          <path className="ls-floor" d="M12 200H418" />

          {/* Door, further back and a real door's height (about 1.2x the boy).
              Hinge on the right edge (x = 412), knob on the left at hand height. */}
          <g className="ls-doorset" ref={door}>
            <rect className="ls-frame" x="334" y="-14" width="86" height="214" rx="5" />
            <rect className="ls-light" x="342" y="-6" width="70" height="206" fill="url(#ls-glow)" />
            <g className="ls-door">
              <rect className="ls-panel ls-o" x="342" y="-6" width="70" height="206" rx="3" />
              <rect className="ls-inset" x="352" y="8" width="50" height="76" rx="4" />
              <rect className="ls-inset" x="352" y="98" width="50" height="90" rx="4" />
              <circle className="ls-knob" cx="352" cy="120" r="5" />
            </g>
            <text className="ls-knocktext" x="377" y="-24" textAnchor="middle">knock knock!</text>
          </g>

          {/* Character, standing at x = 70, drawn 25% bigger (scaled from his feet) */}
          <g className="ls-man">
          <g transform="translate(70 200) scale(1.25) translate(-70 -200)">
            <ellipse className="ls-shadow" cx="70" cy="201" rx="24" ry="4" />

            <g className="ls-leg a">
              <rect className="ls-jean ls-o" x="60" y="158" width="10" height="34" rx="4" />
              <rect className="ls-shoe ls-o" x="58" y="189" width="16" height="9" rx="4" />
              <rect className="ls-sole" x="59" y="195" width="14" height="2.5" rx="1" />
            </g>
            <g className="ls-leg b">
              <rect className="ls-jean ls-o" x="72" y="158" width="10" height="34" rx="4" />
              <rect className="ls-shoe ls-o" x="70" y="189" width="16" height="9" rx="4" />
              <rect className="ls-sole" x="71" y="195" width="14" height="2.5" rx="1" />
            </g>

            <g className="ls-body">
              {/* Backpack behind */}
              <rect className="ls-pack ls-o" x="40" y="112" width="18" height="40" rx="6" />
              <rect className="ls-pack-pocket" x="43" y="132" width="12" height="14" rx="3" />

              {/* Back arm */}
              <rect className="ls-sleeve ls-o" x="56" y="116" width="9" height="30" rx="4.5" />

              {/* Hoodie */}
              <rect className="ls-hoodie ls-o" x="54" y="108" width="34" height="56" rx="12" />
              <path className="ls-collar" d="M60 110q11 9 22 0v4q-11 9-22 0z" />
              <path className="ls-strap" d="M58 112q4 18 2 36" />
              <path className="ls-pocket" d="M60 142h22v12q-11 4-22 0z" />
              <path className="ls-string" d="M68 116v10M75 116v10" />

              {/* Head */}
              <circle className="ls-skin ls-o" cx="72" cy="88" r="20" />
              <path className="ls-hair ls-o" d="M52 86c0-14 9-22 21-22s20 8 20 18c-6-5-14-6-22-4-7 2-13 5-19 8z" />
              <path className="ls-tuft" d="M70 66q-2-7 4-10" />
              <circle className="ls-eye" cx="81" cy="89" r="2.8" />
              <circle className="ls-glint" cx="82" cy="88" r=".9" />
              <circle className="ls-blush" cx="85" cy="96" r="3.4" />
              <path className="ls-mouth ls-smile" d="M76 98q5 5 10 0" />
              <path className="ls-mouth ls-frown" d="M76 102q5-5 10 0" />

              {/* Front arm: swings while walking, knocks, then reaches for the knob */}
              <g className="ls-arm">
                <rect className="ls-sleeve ls-o" x="78" y="114" width="10" height="32" rx="5" />
                <circle className="ls-skin ls-o" cx="83" cy="148" r="4.5" />
              </g>
            </g>
          </g>
          </g>
        </svg>
      </div>

      <div className={`ls-flash${scene === "flash" ? " on" : ""}`} style={{ "--fx": origin.x, "--fy": origin.y }} aria-hidden="true" />
    </>
  );
}
