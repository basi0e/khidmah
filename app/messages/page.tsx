"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Illustration } from "@/components/Illustration";
import { UiIcon } from "@/components/NavIcons";
import { StatusBadge, primaryBtn } from "@/components/ui";
import { statusTone } from "@/components/Booking";
import { useMe } from "@/lib/useMe";

type Thread = {
  id: string;
  ref: string;
  service: string;
  status: string;
  other: string;
  last: { body: string; created_at: string; mine: boolean; system: boolean } | null;
  sortAt: string;
};

function short(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const { supabase, me } = useMe();
  const [threads, setThreads] = useState<Thread[] | null>(null);

  useEffect(() => {
    if (!me) return;
    (async () => {
      const { data: bk } = await supabase
        .from("bookings")
        .select("id, ref, service, status, created_at, customer_id, customer:profiles!bookings_customer_id_fkey(name), provider:profiles!bookings_provider_id_fkey(name)")
        .or(`customer_id.eq.${me.id},provider_id.eq.${me.id}`)
        .order("created_at", { ascending: false })
        .limit(60);
      const rows = (bk ?? []) as unknown as {
        id: string; ref: string; service: string; status: string; created_at: string; customer_id: string | null;
        customer: { name: string } | null; provider: { name: string } | null;
      }[];
      const ids = rows.map((r) => r.id);
      const { data: msgs } = ids.length
        ? await supabase.from("messages").select("booking_id, sender_id, body, created_at").in("booking_id", ids).order("created_at", { ascending: false }).limit(500)
        : { data: [] };
      const latest = new Map<string, { sender_id: string | null; body: string; created_at: string }>();
      for (const m of (msgs ?? []) as { booking_id: string; sender_id: string | null; body: string; created_at: string }[]) {
        if (!latest.has(m.booking_id)) latest.set(m.booking_id, m);
      }
      const list: Thread[] = rows.map((r) => {
        const m = latest.get(r.id);
        const isCustomer = r.customer_id === me.id;
        return {
          id: r.id, ref: r.ref, service: r.service, status: r.status,
          other: (isCustomer ? r.provider?.name : r.customer?.name) ?? "Deleted account",
          last: m ? { body: m.body, created_at: m.created_at, mine: m.sender_id === me.id, system: !m.sender_id } : null,
          sortAt: m?.created_at ?? r.created_at,
        };
      });
      list.sort((a, b) => b.sortAt.localeCompare(a.sortAt));
      setThreads(list);
    })();
  }, [me, supabase]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-[26px] font-bold tracking-tight">Messages</h1>
        {me === null && (
          <div className="mt-6 rounded-2xl bg-paper p-6 shadow-card">
            <p>Log in to see your conversations.</p>
            <Link href="/login?next=/messages" className={`${primaryBtn} mt-4`}>Log in</Link>
          </div>
        )}
        {me && threads === null && <p className="mt-6 text-muted">Loading…</p>}
        {threads && threads.length === 0 && (
          <div className="mt-6 rounded-2xl bg-paper p-8 text-center shadow-card">
            <Illustration name="step-request" className="mx-auto h-32 w-48" />
            <p className="mt-2 text-lg font-bold">No conversations yet</p>
            <p className="mt-1 text-muted">Each booking gets its own chat with the {me?.role === "provider" ? "customer" : "provider"}.</p>
          </div>
        )}
        {threads && threads.length > 0 && (
          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-2xl bg-paper shadow-card">
            {threads.map((t) => (
              <li key={t.id}>
                <Link href={`/booking?id=${t.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-soft">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-palm-50 text-lg font-bold text-palm-deep">
                    {t.other.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold">{t.other}</span>
                      {t.last && <span className="shrink-0 text-[13px] text-muted">{short(t.last.created_at)}</span>}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-[14px] text-muted">
                        {t.last ? `${t.last.mine ? "You: " : ""}${t.last.body}` : "No messages yet"}
                      </span>
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge>
                      <span className="truncate text-[13px] text-muted">{t.service}</span>
                    </span>
                  </span>
                  <UiIcon name="chevron" className="h-5 w-5 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
