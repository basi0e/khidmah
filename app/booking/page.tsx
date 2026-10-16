"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel, inputCls, primaryBtn } from "@/components/ui";
import { BillView, BookingHeader, Progress, type Bill, type BookingRow } from "@/components/Booking";
import { one, useMe } from "@/lib/useMe";

type Detail = BookingRow & {
  customer: { name: string } | null;
  provider: { name: string } | null;
  bill: Bill | Bill[] | null;
};
type Msg = { id: number; sender_id: string | null; body: string; created_at: string };
type Event = { id: number; status: string; note: string | null; created_at: string };

function time(ts: string) {
  return new Date(ts).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function BookingDetailPage() {
  const { supabase, me } = useMe();
  const [id, setId] = useState<string | null>(null);
  const [b, setB] = useState<Detail | null | undefined>(undefined);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [phone, setPhone] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    const [bk, m, ev] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, customer:profiles!bookings_customer_id_fkey(name), provider:profiles!bookings_provider_id_fkey(name), bill:bills(*)")
        .eq("id", id)
        .maybeSingle(),
      supabase.from("messages").select("id, sender_id, body, created_at").eq("booking_id", id).order("created_at"),
      supabase.from("booking_events").select("id, status, note, created_at").eq("booking_id", id).order("created_at"),
    ]);
    setB((bk.data as unknown as Detail) ?? null);
    setMsgs((m.data as Msg[]) ?? []);
    setEvents((ev.data as Event[]) ?? []);
    const { data: ph } = await supabase.rpc("get_contact_phone", { p_booking: id });
    setPhone((ph as string | null) ?? null);
  }, [id, supabase]);

  useEffect(() => {
    if (me) load();
  }, [me, load]);

  // Live updates: new messages and status changes appear without refreshing
  useEffect(() => {
    if (!id || !me) return;
    const channel = supabase
      .channel(`booking-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `booking_id=eq.${id}` },
        (payload) => setMsgs((cur) => (cur.some((x) => x.id === (payload.new as Msg).id) ? cur : [...cur, payload.new as Msg])))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, me, supabase, load]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [msgs.length]);

  async function send() {
    if (!me || !id || !text.trim()) return;
    setBusy(true);
    setError("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ booking_id: id, sender_id: me.id, body: text.trim() })
      .select("id, sender_id, body, created_at")
      .single();
    setBusy(false);
    if (error) return setError(error.message);
    setMsgs((cur) => (cur.some((x) => x.id === data.id) ? cur : [...cur, data as Msg]));
    setText("");
  }

  const isCustomer = b && me?.id === b.customer_id;
  const other = b ? (isCustomer ? b.provider?.name : b.customer?.name) ?? "Deleted account" : "";
  const canChat = b && !["Cancelled", "Declined"].includes(b.status) && me?.role !== "admin";
  const backHref = me?.role === "provider" ? "/provider" : me?.role === "admin" ? "/admin" : "/account";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-mist px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {me === null && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">Log in to see this booking</h1>
              <Link href={`/login?next=${encodeURIComponent(`/booking?id=${id ?? ""}`)}`} className={`${primaryBtn} mt-5 inline-block`}>Log in</Link>
            </Panel>
          )}
          {me && b === undefined && <p className="text-muted">Loading…</p>}
          {me && b === null && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">Booking not found</h1>
              <p className="mt-2 text-muted">It may belong to another account.</p>
              <Link href={backHref} className={`${primaryBtn} mt-5 inline-block`}>Back</Link>
            </Panel>
          )}

          {me && b && (
            <>
              <Link href={backHref} className="text-[15px] font-semibold text-muted underline hover:text-ink">← Back</Link>
              <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_22rem]">
                <section className="flex flex-col rounded-3xl bg-paper" aria-label="Messages">
                  <div className="border-b border-line p-5">
                    <h1 className="font-display text-2xl font-bold">Messages with {other}</h1>
                    {phone && <p className="text-[15px]">Phone: <a className="font-semibold text-palm underline" href={`tel:${phone}`}>{phone}</a></p>}
                  </div>
                  <ol className="flex max-h-[60vh] min-h-[18rem] flex-1 flex-col gap-3 overflow-y-auto p-5">
                    {msgs.length === 0 && <li className="m-auto text-muted">No messages yet.</li>}
                    {msgs.map((m) => {
                      if (!m.sender_id) {
                        return (
                          <li key={m.id} className="self-center rounded-full bg-mist px-3 py-1 text-sm text-muted">
                            {m.body}, {time(m.created_at)}
                          </li>
                        );
                      }
                      const mine = m.sender_id === me.id;
                      return (
                        <li key={m.id} className={`max-w-[80%] ${mine ? "self-end" : "self-start"}`}>
                          <p className={`whitespace-pre-line rounded-2xl px-4 py-2.5 ${mine ? "rounded-br-sm bg-palm text-white" : "rounded-bl-sm bg-mist"}`}>{m.body}</p>
                          <p className={`mt-1 text-xs text-muted ${mine ? "text-right" : ""}`}>{time(m.created_at)}</p>
                        </li>
                      );
                    })}
                    <div ref={bottom} />
                  </ol>
                  {canChat ? (
                    <div className="flex gap-2 border-t border-line p-4">
                      <label htmlFor="msg" className="sr-only">Message</label>
                      <textarea id="msg" className={`${inputCls} resize-none`} rows={1} maxLength={2000} placeholder="Write a message"
                        value={text} onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                      <button className={primaryBtn} disabled={busy || !text.trim()} onClick={send}>Send</button>
                    </div>
                  ) : (
                    <p className="border-t border-line p-4 text-sm text-muted">
                      {me.role === "admin" ? "Admins can read messages but not reply here." : "Messaging is closed for this booking."}
                    </p>
                  )}
                  {error && <p className="px-4 pb-4 text-sm font-medium text-red-700">{error}</p>}
                </section>

                <aside className="space-y-6">
                  <div className="rounded-3xl bg-paper p-5">
                    <BookingHeader b={b} who={other} />
                    <Progress status={b.status} kind={b.kind} />
                    {b.address && <p className="mt-4 text-[15px]"><span className="text-muted">Address: </span>{b.address}</p>}
                    {b.note && <p className="mt-2 text-[15px]"><span className="text-muted">Note: </span>{b.note}</p>}
                    {one(b.bill) && <BillView bill={one(b.bill)!} />}
                  </div>
                  <div className="rounded-3xl bg-paper p-5">
                    <h2 className="font-semibold">History</h2>
                    <ol className="mt-3 space-y-2 border-l-2 border-line pl-4 text-[15px]">
                      {events.map((e) => (
                        <li key={e.id}>
                          <span className="font-medium">{e.status}</span> <span className="text-sm text-muted">{time(e.created_at)}</span>
                          {e.note && <p className="text-sm text-muted">{e.note}</p>}
                        </li>
                      ))}
                    </ol>
                  </div>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
