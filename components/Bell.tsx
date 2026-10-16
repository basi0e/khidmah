"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Note = { id: number; body: string; booking_id: string | null; is_read: boolean; created_at: string };

function ago(ts: string) {
  const s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export function Bell({ userId }: { userId: string }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("id, body, booking_id, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotes((data as Note[]) ?? []);
  }, [supabase, userId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`notes-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase, userId]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = notes.filter((n) => !n.is_read).length;

  async function openNote(n: Note) {
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setNotes((cur) => cur.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    setOpen(false);
    if (n.booking_id) router.push(`/booking?id=${n.booking_id}`);
  }

  async function readAll() {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotes((cur) => cur.map((x) => ({ ...x, is_read: true })));
  }

  return (
    <div className="relative" ref={box}>
      <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open}
        onClick={() => setOpen(!open)} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-2 border-ink bg-paper shadow-[4px_4px_0_0_var(--color-ink)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold text-ink">Notifications</p>
            {unread > 0 && <button className="text-sm text-muted underline hover:text-ink" onClick={readAll}>Mark all read</button>}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notes.length === 0 && <li className="px-4 py-6 text-center text-muted">Nothing yet.</li>}
            {notes.map((n) => (
              <li key={n.id}>
                <button onClick={() => openNote(n)} className="flex w-full gap-3 px-4 py-3 text-left hover:bg-mist">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_read ? "bg-transparent" : "bg-sun"}`} />
                  <span>
                    <span className={`block text-[15px] ${n.is_read ? "text-muted" : "font-medium text-ink"}`}>{n.body}</span>
                    <span className="block text-xs text-muted">{ago(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
