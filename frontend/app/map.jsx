"use client";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

const AUSTRALIA = [[-43.8, 112.9], [-10.5, 153.8]];

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
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "View details";
      btn.onclick = () => onOpen(r);
      box.append(title, meta, btn);
      m.bindPopup(box);
      m.addTo(layer.current);
    });
    if (place) {
      L.circleMarker([place.lat, place.lng], { radius: 9, weight: 3, color: "#0e9f9a", fillColor: "#fff", fillOpacity: 1 })
        .bindTooltip(place.name, { permanent: false })
        .addTo(layer.current);
    }
  }, [ready, rooms, current, place, onOpen]);

  // Fly to the chosen location, or show all of Australia
  useEffect(() => {
    if (!ready) return;
    if (place) map.current.flyTo([place.lat, place.lng], place.group === "City" ? 11 : 13, { duration: 0.8 });
    else map.current.fitBounds(AUSTRALIA);
  }, [ready, place]);

  return <div ref={el} className="room-map" role="region" aria-label="Map of homes across Australia" />;
}
