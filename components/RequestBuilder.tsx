"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SERVICES } from "@/lib/services";

const CITIES = ["Riyadh", "Dammam"];
const TIMES = [
  { value: "today", label: "today" },
  { value: "week", label: "this week" },
  { value: "flexible", label: "any time" },
];

function Choice({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <span role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1.5 align-middle">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3.5 py-1 text-xl font-semibold transition-colors sm:text-2xl ${
            value === o.value
              ? "bg-palm text-white"
              : "bg-mist text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

export function RequestBuilder() {
  const router = useRouter();
  const [service, setService] = useState("ac");
  const [city, setCity] = useState("Riyadh");
  const [when, setWhen] = useState("today");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams({ service, city, when });
    router.push(`/request?${q.toString()}`);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-3xl border-2 border-ink bg-paper p-5 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-7"
    >
      <p className="font-display text-2xl font-bold leading-[1.6] text-ink sm:text-3xl sm:leading-[1.7]">
        I need{" "}
        <label className="sr-only" htmlFor="service">Service</label>
        <select
          id="service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="cursor-pointer rounded-none border-b-4 border-sun bg-transparent pr-1 font-display font-bold text-palm outline-none"
        >
          {SERVICES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.phrase}
            </option>
          ))}
        </select>{" "}
        in{" "}
        <Choice
          label="City"
          value={city}
          onChange={setCity}
          options={CITIES.map((c) => ({ value: c, label: c }))}
        />{" "}
        <Choice label="When" value={when} onChange={setWhen} options={TIMES} />
      </p>
      <button
        type="submit"
        className="mt-6 w-full rounded-full bg-ink px-6 py-3.5 text-lg font-semibold text-white hover:bg-palm-deep sm:w-auto"
      >
        Find a technician
      </button>
    </form>
  );
}
