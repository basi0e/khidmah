"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import { UiIcon } from "./NavIcons";

export type LatLng = { lat: number; lng: number };

const CITY_CENTER: Record<string, LatLng> = {
  Riyadh: { lat: 24.7136, lng: 46.6753 },
  Dammam: { lat: 26.4207, lng: 50.0888 },
};

export function mapsLink(p: LatLng) {
  return `https://www.google.com/maps/search/?api=1&query=${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
}

/**
 * Map with a fixed centre pin: people drag the map (or tap "Use my current location")
 * until the pin sits on their building. Uses free OpenStreetMap tiles, no API key.
 */
export function LocationPicker({
  value,
  onChange,
  city,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  city: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;
  const [locating, setLocating] = useState(false);
  const [msg, setMsg] = useState("");

  // Create the map once (Leaflet needs the browser, so it loads here)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !box.current || map.current) return;
      const start = value ?? CITY_CENTER[city] ?? CITY_CENTER.Riyadh;
      const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView([start.lat, start.lng], value ? 17 : 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      // Only count it as chosen once the person moves the map or uses their location
      m.on("dragend zoomend", () => {
        if (!m.getContainer().dataset.touched && m.getContainer().dataset.ready !== "1") return;
        const c = m.getCenter();
        changeRef.current({ lat: c.lat, lng: c.lng });
      });
      m.on("dragstart", () => { m.getContainer().dataset.touched = "1"; m.getContainer().dataset.ready = "1"; });
      map.current = m;
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow a location chosen elsewhere (e.g. a saved address)
  useEffect(() => {
    const m = map.current;
    if (!m || !value) return;
    const c = m.getCenter();
    if (Math.abs(c.lat - value.lat) > 0.0002 || Math.abs(c.lng - value.lng) > 0.0002) {
      m.getContainer().dataset.ready = "1";
      m.setView([value.lat, value.lng], Math.max(m.getZoom(), 16));
    }
  }, [value]);

  // Recentre when the city changes and nothing has been picked yet
  useEffect(() => {
    if (map.current && !value) {
      const c = CITY_CENTER[city] ?? CITY_CENTER.Riyadh;
      map.current.setView([c.lat, c.lng], 12);
    }
  }, [city, value]);

  function locate() {
    if (!navigator.geolocation) return setMsg("Your browser can't share location. Drag the map instead.");
    setLocating(true);
    setMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (map.current) {
          map.current.getContainer().dataset.ready = "1";
          map.current.setView([p.lat, p.lng], 17);
        }
        onChange(p);
        if (pos.coords.accuracy > 100) setMsg("Location is approximate. Drag the map to put the pin exactly on your building.");
      },
      (err) => {
        setLocating(false);
        setMsg(err.code === 1 ? "Location permission was blocked. Allow it in your browser, or drag the map." : "Couldn't get your location. Drag the map instead.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-line-strong">
        <div ref={box} className="h-64 w-full bg-soft sm:h-72" role="application" aria-label="Map. Drag to place the pin on your location." />
        {/* Fixed centre pin */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] -translate-x-1/2 -translate-y-full" aria-hidden="true">
          <svg viewBox="0 0 32 44" className="h-11 w-8 drop-shadow-md">
            <path d="M16 43C16 43 2 26.5 2 16a14 14 0 1 1 28 0c0 10.5-14 27-14 27z" fill={value ? "#0e6b57" : "#5b6872"} stroke="#fff" strokeWidth="2" />
            <circle cx="16" cy="16" r="5.5" fill="#fff" />
          </svg>
        </div>
        <button type="button" onClick={locate} disabled={locating}
          className="absolute bottom-3 left-1/2 z-[500] inline-flex min-h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-paper px-4 text-[15px] font-semibold text-palm-deep shadow-lift disabled:opacity-60">
          <UiIcon name="pin" className="h-5 w-5" />
          {locating ? "Finding you…" : "Use my current location"}
        </button>
      </div>
      <p className={`mt-2 text-[13px] ${value ? "text-palm-deep" : "text-muted"}`}>
        {value ? "Pin set. Drag the map to adjust." : "Drag the map so the pin sits on your building, or use your current location."}
      </p>
      {msg && <p className="mt-1 text-[13px] text-sun-ink">{msg}</p>}
    </div>
  );
}
