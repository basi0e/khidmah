"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Illustration } from "@/components/Illustration";
import { Panel, Segmented, primaryBtn, inputCls } from "@/components/ui";
import { UiIcon } from "@/components/NavIcons";
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
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          {me === undefined && <p className="text-muted">Loading…</p>}
          {me === null && (
            <Panel>
              <h1 className="text-2xl font-bold">Log in to see your bookings</h1>
              <Link href="/login?next=/account" className={`${primaryBtn} mt-5 inline-block`}>Log in</Link>
            </Panel>
          )}
          {me && me.role === "admin" && (
            <Panel>
              <h1 className="text-2xl font-bold">This is the admin account</h1>
              <Link href="/admin" className={`${primaryBtn} mt-5 inline-block`}>Open admin</Link>
            </Panel>
          )}
          {me && me.role === "provider" && (
            <Panel>
              <h1 className="text-2xl font-bold">This is a provider account</h1>
              <Link href="/provider" className={`${primaryBtn} mt-5 inline-block`}>Go to your jobs</Link>
            </Panel>
          )}

          {me?.role === "customer" && (
            <>
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-[26px] font-bold tracking-tight sm:text-4xl">Bookings</h1>
                <Link href="/browse" className={`${primaryBtn} !min-h-11 !px-5`}>Book a service</Link>
              </div>

              <div className="mt-4">
                <Segmented label="Bookings" value={tab} onChange={setTab}
                  options={[["active", `Active (${active.length})`], ["past", `Past (${past.length})`]]} />
              </div>

              <div className="mt-4 space-y-3">
                {rows === null && <p className="text-muted">Loading your bookings…</p>}
                {rows && list.length === 0 && (
                  <div className="rounded-2xl bg-paper shadow-card p-8 text-center">
                    <Illustration name="step-request" className="mx-auto h-32 w-48" />
                    <p className="mt-2 text-lg font-bold">
                      {tab === "active" ? "No active bookings" : "No past bookings yet"}
                    </p>
                    <p className="mt-1 text-muted">When you book a service it will show up here.</p>
                    {tab === "active" && <Link href="/browse" className={`${primaryBtn} mt-5`}>Find a service</Link>}
                  </div>
                )}
                {list.map((b) => (
                  <CustomerBooking key={b.id} b={b} onChange={load} />
                ))}
              </div>
              {error && <p className="mt-4 font-medium text-[#b42318]">{error}</p>}
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
    <article className="rounded-2xl bg-paper p-4 shadow-card sm:p-5">
      <Link href={`/booking?id=${b.id}`} className="block">
        <BookingHeader b={b} who={providerName} />
      </Link>
      {ACTIVE.includes(b.status) && <Progress status={b.status} kind={b.kind} />}

      {b.status_reason && ["Declined", "Cancelled"].includes(b.status) && (
        <p className="mt-3 text-[14px] text-[#9b1c13]">Reason: {b.status_reason}</p>
      )}
      {b.status === "Requested" && (
        <p className="mt-3 text-[14px] text-muted">Waiting for {providerName.split(" ")[0]} to accept.</p>
      )}
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
        <Link href={`/booking?id=${b.id}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-palm-50 font-semibold text-palm-deep hover:bg-[#d8ebe1]">
          <UiIcon name="chat" className="h-5 w-5" /> Message
        </Link>
        {phone && ACTIVE.includes(b.status) && (
          <a href={`tel:${phone}`} aria-label={`Call ${providerName}`} className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-palm hover:bg-soft">
            <UiIcon name="phone" className="h-5 w-5" />
          </a>
        )}
        {["Requested", "Accepted"].includes(b.status) && (
          <button className="min-h-11 px-3 text-[15px] font-semibold text-[#b42318]" disabled={busy} onClick={cancel}>Cancel</button>
        )}
      </div>
      {bill && <BillView bill={bill} />}

      {b.status === "Completed" && b.kind !== "room" && !review && (
        <div className="mt-4 rounded-xl bg-sun-50 p-4">
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

      {msg && <p className="mt-3 text-sm font-medium text-[#b42318]">{msg}</p>}
    </article>
  );
}
