"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicProvider = {
  user_id: string;
  provider_type: string;
  services: string[];
  price_from: number | null;
  experience: string | null;
  about: string | null;
  districts: string[];
  languages: string[];
  work_days: number[];
  work_from: string;
  work_to: string;
  available: boolean;
  status: string;
  profile: { name: string; city: string };
};

export type Rating = { avg: number; count: number };

export const PROVIDER_FIELDS =
  "user_id, provider_type, services, price_from, experience, about, districts, languages, work_days, work_from, work_to, available, status, profile:profiles!inner(name, city)";

/** Average star rating for each provider id. */
export async function ratingsFor(supabase: SupabaseClient, ids: string[]) {
  const out: Record<string, Rating> = {};
  if (ids.length === 0) return out;
  const { data } = await supabase.from("reviews").select("provider_id, stars").in("provider_id", ids);
  for (const r of (data ?? []) as { provider_id: string; stars: number }[]) {
    const cur = out[r.provider_id] ?? { avg: 0, count: 0 };
    cur.avg = (cur.avg * cur.count + r.stars) / (cur.count + 1);
    cur.count += 1;
    out[r.provider_id] = cur;
  }
  return out;
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function hoursText(p: Pick<PublicProvider, "work_days" | "work_from" | "work_to">) {
  const days = [...p.work_days].sort((a, b) => ((a + 1) % 7) - ((b + 1) % 7)).map((d) => DAY_NAMES[d]).join(", ");
  const t = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
  };
  return `${days}, ${t(p.work_from)} to ${t(p.work_to)}`;
}
