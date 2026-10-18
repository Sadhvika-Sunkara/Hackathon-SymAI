"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

const AUSTRALIA = [[-43.8, 112.9], [-10.5, 153.8]];

// Real route (public transport by default) in Google Maps, from your location to the home
export const directionsUrl = (from, to) =>
  `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=transit`;

/* Australia-wide map (OpenStreetMap tiles via Leaflet). Every home is a dot; tap one for details. */
export default function RoomMap({ rooms, place, current, onOpen }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const Lref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let off = false;
    import("leaflet").then(mod => {
      if (off || map.current || !el.current) return;
      const L = mod.default || mod;
      Lref.current = L;
      map.current = L.map(el.current, { zoomControl: true, worldCopyJump: false }).fitBounds(AUSTRALIA);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      setReady(true);
    });
    return () => {
      off = true;
      if (map.current) map.current.remove();
      map.current = null;
    };
  }, []);

  // Redraw homes whenever the list or the highlighted home changes
  useEffect(() => {
    const L = Lref.current;
    if (!ready || !L) return;
    layer.current.clearLayers();
    rooms.forEach(r => {
      const on = current && current.id === r.id;
      const m = L.circleMarker([r.lat, r.lng], {
        radius: on ? 10 : 7,
        weight: 2,
        color: "#fff",
        fillColor: on ? "#d9569a" : "#6d4fd0",
        fillOpacity: 0.95,
      });
      const box = document.createElement("div");
      box.className = "map-pop";
      const title = document.createElement("b");
      title.textContent = r.title;
      const meta = document.createElement("span");
      meta.textContent = `${r.suburb} · $${r.rent}/wk${r.bedrooms ? ` · ${r.bedrooms} bed` : ""}`;
      const dist = document.createElement("span");
      if (place && r.campus_km !== undefined) dist.textContent = `${r.campus_km} km from ${place.name}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "View details";
      btn.onclick = () => onOpen(r);
      box.append(title, meta, dist, btn);
      if (place) {
        const dir = document.createElement("a");
        dir.href = directionsUrl(place, r);
        dir.target = "_blank";
        dir.rel = "noopener noreferrer";
        dir.textContent = "Get directions";
        box.append(dir);
      }
      m.bindPopup(box);
      m.addTo(layer.current);
    });
    if (place) {
      L.circleMarker([place.lat, place.lng], { radius: 9, weight: 3, color: "#0e9f9a", fillColor: "#fff", fillOpacity: 1 })
        .bindTooltip(place.name, { permanent: true, direction: "top", className: "map-place" })
        .addTo(layer.current);
      // Distance line from your location to the home on top of the deck
      if (current) {
        const line = L.polyline([[place.lat, place.lng], [current.lat, current.lng]], {
          color: "#d9569a", weight: 3, dashArray: "6 6", opacity: 0.9,
        }).addTo(layer.current);
        if (current.campus_km !== undefined) {
          line.bindTooltip(`${current.campus_km} km`, { permanent: true, direction: "center", className: "map-dist" });
        }
      }
    }
  }, [ready, rooms, current, place, onOpen]);

  // Frame your location and the current home together, or show all of Australia
  useEffect(() => {
    if (!ready) return;
    if (place && current) {
      map.current.flyToBounds([[place.lat, place.lng], [current.lat, current.lng]], { padding: [50, 50], maxZoom: 14, duration: 0.8 });
    } else if (place) {
      map.current.flyTo([place.lat, place.lng], place.group === "City" ? 11 : 13, { duration: 0.8 });
    } else {
      map.current.fitBounds(AUSTRALIA);
    }
  }, [ready, place, current?.id]);

  return <div ref={el} className="room-map" role="region" aria-label="Map of homes across Australia" />;
}
