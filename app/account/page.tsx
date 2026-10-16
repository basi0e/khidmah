"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Illustration } from "@/components/Illustration";
import { Panel, primaryBtn, inputCls } from "@/components/ui";
import { ACTIVE, BillView, BookingHeader, Progress, type Bill, type BookingRow } from "@/components/Booking";
import { one, useMe } from "@/lib/useMe";
import { createClient } from "@/lib/supabase/client";

type Row = BookingRow & {
  provider: { name: string } | null;
  bill: Bill | Bill[] | null;
  review: { stars: number } | { stars: number }[] | null;
};

export default function AccountPage() {
  const { supabase, me } = useMe();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, provider:profiles!bookings_provider_id_fkey(name), bill:bills(*), review:reviews(stars)")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setRows((data as unknown as Row[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    if (me?.role === "customer") load();
  }, [me, load]);

  const active = rows?.filter((r) => ACTIVE.includes(r.status)) ?? [];
  const past = rows?.filter((r) => !ACTIVE.includes(r.status)) ?? [];
  const list = tab === "active" ? active : past;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-mist px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {me === undefined && <p className="text-muted">Loading…</p>}
          {me === null && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">Log in to see your bookings</h1>
              <Link href="/login?next=/account" className={`${primaryBtn} mt-5 inline-block`}>Log in</Link>
            </Panel>
          )}
          {me && me.role === "admin" && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">This is the admin account</h1>
              <Link href="/admin" className={`${primaryBtn} mt-5 inline-block`}>Open admin</Link>
            </Panel>
          )}
          {me && me.role === "provider" && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">This is a provider account</h1>
              <Link href="/provider" className={`${primaryBtn} mt-5 inline-block`}>Go to your jobs</Link>
            </Panel>
          )}

          {me?.role === "customer" && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-4xl font-bold tracking-tight">My bookings</h1>
                  <p className="mt-1 text-muted">Hello {me.name}. Track your requests and past jobs here.</p>
                </div>
                <Link href="/#services" className={primaryBtn}>Book a service</Link>
              </div>

              <div className="mt-8 flex gap-2" role="tablist">
                {(["active", "past"] as const).map((t) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                    className={`rounded-full px-5 py-2 font-semibold ${tab === t ? "bg-ink text-white" : "bg-paper text-ink"}`}>
                    {t === "active" ? `Active (${active.length})` : `Past (${past.length})`}
                  </button>
                ))}
              </div>

              <div className="mt-5 space-y-4">
                {rows === null && <p className="text-muted">Loading your bookings…</p>}
                {rows && list.length === 0 && (
                  <div className="rounded-3xl bg-paper p-8 text-center">
                    <Illustration name="step-request" className="mx-auto h-32 w-48" />
                    <p className="mt-2 font-display text-xl font-bold">
                      {tab === "active" ? "No active bookings" : "No past bookings yet"}
                    </p>
                    <p className="mt-1 text-muted">When you book a service it will show up here.</p>
                  </div>
                )}
                {list.map((b) => (
                  <CustomerBooking key={b.id} b={b} onChange={load} />
                ))}
              </div>
              {error && <p className="mt-4 font-medium text-red-700">{error}</p>}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function CustomerBooking({ b, onChange }: { b: Row; onChange: () => void }) {
  const [supabase] = useState(() => createClient());
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const bill = one(b.bill);
  const review = one(b.review);
  const providerName = b.provider?.name ?? "Provider";

  useEffect(() => {
    if (["Accepted", "On the way", "In progress", "Completed"].includes(b.status)) {
      supabase.rpc("get_contact_phone", { p_booking: b.id }).then(({ data }) => setPhone(data as string | null));
    }
  }, [b.id, b.status, supabase]);

  async function cancel() {
    if (!window.confirm(`Cancel booking ${b.ref}?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("set_booking_status", { p_booking: b.id, p_status: "Cancelled", p_reason: "Cancelled by customer" });
    setBusy(false);
    if (error) return setMsg(error.message);
    onChange();
  }

  async function rate() {
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: b.id, provider_id: b.provider_id, stars, body: text.trim() || null, customer_name: "",
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    onChange();
  }

  return (
    <article className="rounded-3xl bg-paper p-5 sm:p-6">
      <Link href={`/booking?id=${b.id}`} className="block rounded-2xl hover:bg-mist/60">
        <BookingHeader b={b} who={providerName} />
      </Link>
      <Progress status={b.status} kind={b.kind} />
      <Link href={`/booking?id=${b.id}`} className="mt-3 inline-block text-[15px] font-semibold text-palm underline">Messages and details</Link>

      {b.status_reason && ["Declined", "Cancelled"].includes(b.status) && (
        <p className="mt-4 text-[15px] text-red-800">Reason: {b.status_reason}</p>
      )}
      {b.status === "Requested" && (
        <p className="mt-4 text-[15px] text-muted">Waiting for {providerName} to accept.</p>
      )}
      {phone && ACTIVE.includes(b.status) && (
        <p className="mt-4 text-[15px]">
          Call {providerName}: <a className="font-semibold text-palm underline" href={`tel:${phone}`}>{phone}</a>
        </p>
      )}
      {bill && <BillView bill={bill} />}

      {b.status === "Completed" && b.kind !== "room" && !review && (
        <div className="mt-5 rounded-2xl border-2 border-line p-4">
          <p className="font-semibold">How was {providerName}?</p>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} stars`}
                onClick={() => setStars(n)} className={`text-3xl ${n <= stars ? "text-sun" : "text-line"}`}>★</button>
            ))}
          </div>
          <textarea className={`${inputCls} mt-3`} rows={2} maxLength={1000} placeholder="Tell others about the job (optional)"
            value={text} onChange={(e) => setText(e.target.value)} />
          <button className={`${primaryBtn} mt-3`} disabled={busy} onClick={rate}>Post review</button>
        </div>
      )}
      {review && <p className="mt-4 text-[15px] text-muted">You rated this job {review.stars} out of 5.</p>}

      {["Requested", "Accepted"].includes(b.status) && (
        <button className="mt-5 font-semibold text-red-700 underline" disabled={busy} onClick={cancel}>
          Cancel booking
        </button>
      )}
      {msg && <p className="mt-3 text-sm font-medium text-red-700">{msg}</p>}
    </article>
  );
}
