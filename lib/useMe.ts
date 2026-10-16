"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Me = { id: string; name: string; role: string; city: string };

/** Who is logged in: undefined while loading, null when logged out. */
export function useMe() {
  const [supabase] = useState(() => createClient());
  const [me, setMe] = useState<Me | null | undefined>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        setMe(null);
        return;
      }
      setTimeout(async () => {
        const { data: p } = await supabase
          .from("profiles")
          .select("name, role, city")
          .eq("id", user.id)
          .maybeSingle();
        setMe(p ? { id: user.id, ...p } : null);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return { supabase, me };
}

export function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

export function dayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const diff = Math.round((date.getTime() - t0) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
