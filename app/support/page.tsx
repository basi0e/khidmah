"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel, inputCls, labelCls, primaryBtn } from "@/components/ui";
import { useMe } from "@/lib/useMe";

type Ticket = {
  id: string;
  ref: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  replies: { id: number; body: string; created_at: string }[];
};

export default function SupportPage() {
  const { supabase, me } = useMe();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [bookings, setBookings] = useState<{ id: string; ref: string; service: string }[]>([]);
  const [subject, setSubject] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!me) return;
    const [t, b] = await Promise.all([
      supabase.from("tickets").select("id, ref, subject, body, status, created_at, replies:ticket_replies(id, body, created_at)")
        .eq("user_id", me.id).order("created_at", { ascending: false }),
      supabase.from("bookings").select("id, ref, service").or(`customer_id.eq.${me.id},provider_id.eq.${me.id}`)
        .order("created_at", { ascending: false }).limit(30),
    ]);
    setTickets((t.data as unknown as Ticket[]) ?? []);
    setBookings((b.data as { id: string; ref: string; service: string }[]) ?? []);
  }, [me, supabase]);

  useEffect(() => { if (me) load(); }, [me, load]);

  async function submit() {
    if (!me) return;
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("tickets").insert({
      user_id: me.id, subject: subject.trim(), body: body.trim(), booking_id: bookingId || null, status: "Open",
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    setSubject("");
    setBody("");
    setBookingId("");
    setMsg("✓ Sent. We'll reply here, usually within a day.");
    load();
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-mist px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Contact support</h1>
            <p className="mt-2 text-muted">
              A problem with a booking, a provider or your account? Tell us here. Quick answers are on the <Link href="/faq" className="text-palm underline">FAQ page</Link>.
            </p>
          </div>

          {me === null && (
            <Panel>
              <p>Log in so we can see your bookings and reply to you.</p>
              <Link href="/login?next=/support" className={`${primaryBtn} mt-4 inline-block`}>Log in</Link>
              <p className="mt-5 text-[15px] text-muted">Can&apos;t log in? Email <a className="text-palm underline" href="mailto:aykhidmah@gmail.com">aykhidmah@gmail.com</a>.</p>
            </Panel>
          )}

          {me && me.role !== "admin" && (
            <Panel>
              <label className={labelCls} htmlFor="subject">What&apos;s it about?</label>
              <input id="subject" className={inputCls} maxLength={120} placeholder="e.g. Technician didn't arrive" value={subject} onChange={(e) => setSubject(e.target.value)} />
              {bookings.length > 0 && (
                <>
                  <label className={`${labelCls} mt-4`} htmlFor="bk">Related booking (optional)</label>
                  <select id="bk" className={inputCls} value={bookingId} onChange={(e) => setBookingId(e.target.value)}>
                    <option value="">None</option>
                    {bookings.map((b) => <option key={b.id} value={b.id}>{b.ref}, {b.service}</option>)}
                  </select>
                </>
              )}
              <label className={`${labelCls} mt-4`} htmlFor="body">Details</label>
              <textarea id="body" className={inputCls} rows={5} maxLength={3000} value={body} onChange={(e) => setBody(e.target.value)} />
              <button className={`${primaryBtn} mt-5`} disabled={busy || subject.trim().length < 3 || body.trim().length < 5} onClick={submit}>
                {busy ? "Sending…" : "Send to support"}
              </button>
              {msg && <p className={`mt-3 text-sm font-medium ${msg.startsWith("✓") ? "text-palm" : "text-red-700"}`}>{msg}</p>}
            </Panel>
          )}
          {me?.role === "admin" && (
            <Panel>
              <p>You&apos;re the admin. Answer tickets from the <Link href="/admin" className="text-palm underline">admin page</Link>.</p>
            </Panel>
          )}

          {tickets && tickets.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Your requests</h2>
              <ul className="mt-4 space-y-3">
                {tickets.map((t) => (
                  <li key={t.id} className="rounded-3xl bg-paper p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-lg font-bold">{t.subject}</p>
                        <p className="text-sm text-muted">{t.ref}, {new Date(t.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${t.status === "Open" ? "bg-sun/30" : "bg-palm text-white"}`}>{t.status}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-[15px]">{t.body}</p>
                    {[...t.replies].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((r) => (
                      <p key={r.id} className="mt-3 border-l-4 border-palm pl-3 text-[15px]"><span className="text-muted">Khidmah: </span>{r.body}</p>
                    ))}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
