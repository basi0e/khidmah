"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Illustration } from "@/components/Illustration";
import { Chip, Panel, inputCls, labelCls, primaryBtn, ghostBtn } from "@/components/ui";
import { ACTIVE, BillView, BookingHeader, Progress, type Bill, type BookingRow } from "@/components/Booking";
import { createClient } from "@/lib/supabase/client";
import { one, useMe } from "@/lib/useMe";
import { ALL_SERVICES, DISTRICTS, PAY_METHODS } from "@/lib/services";

type Row = BookingRow & {
  customer: { name: string } | null;
  bill: Bill | Bill[] | null;
  review: { stars: number; body: string | null } | { stars: number; body: string | null }[] | null;
};

type PP = {
  provider_type: string;
  services: string[];
  price_from: number;
  experience: string | null;
  about: string | null;
  districts: string[];
  available: boolean;
  status: string;
  reject_reason: string | null;
  contact_phone: string | null;
  vat_registered: boolean;
};

type Tab = "new" | "active" | "past" | "profile";

export default function ProviderPage() {
  const { supabase, me } = useMe();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pp, setPP] = useState<PP | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("new");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!me) return;
    const [b, p] = await Promise.all([
      supabase
        .from("bookings")
        .select("*, customer:profiles!bookings_customer_id_fkey(name), bill:bills(*), review:reviews(stars, body)")
        .eq("provider_id", me.id)
        .order("visit_date", { ascending: true }),
      supabase.from("provider_profiles").select("*").eq("user_id", me.id).maybeSingle(),
    ]);
    if (b.error) setError(b.error.message);
    setRows((b.data as unknown as Row[]) ?? []);
    setPP((p.data as PP) ?? null);
  }, [me, supabase]);

  useEffect(() => {
    if (me?.role === "provider") load();
  }, [me, load]);

  const fresh = rows?.filter((r) => r.status === "Requested") ?? [];
  const active = rows?.filter((r) => ACTIVE.includes(r.status) && r.status !== "Requested") ?? [];
  const past = (rows?.filter((r) => !ACTIVE.includes(r.status)) ?? []).reverse();
  const list = tab === "new" ? fresh : tab === "active" ? active : past;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-mist px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {me === undefined && <p className="text-muted">Loading…</p>}
          {me === null && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">Log in to see your jobs</h1>
              <Link href="/login?next=/provider" className={`${primaryBtn} mt-5 inline-block`}>Log in</Link>
            </Panel>
          )}
          {me && me.role !== "provider" && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">This page is for service providers</h1>
              <p className="mt-2 text-muted">Your account is set up for booking services.</p>
              <Link href="/account" className={`${primaryBtn} mt-5 inline-block`}>Go to my bookings</Link>
            </Panel>
          )}

          {me?.role === "provider" && pp === null && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">Finish your provider profile</h1>
              <p className="mt-2 text-muted">Add your services and districts so customers can find you.</p>
              <Link href="/login?next=/provider" className={`${primaryBtn} mt-5 inline-block`}>Set up profile</Link>
            </Panel>
          )}

          {me?.role === "provider" && pp && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-4xl font-bold tracking-tight">Your jobs</h1>
                  <p className="mt-1 text-muted">{me.name}, {pp.provider_type.toLowerCase()} in {me.city}</p>
                </div>
                <AvailabilitySwitch available={pp.available} onChange={load} />
              </div>

              <VerificationBanner status={pp.status} reason={pp.reject_reason} />

              <div className="mt-6 flex flex-wrap gap-2" role="tablist">
                {([
                  ["new", `New requests (${fresh.length})`],
                  ["active", `In progress (${active.length})`],
                  ["past", `Past (${past.length})`],
                  ["profile", "My profile"],
                ] as [Tab, string][]).map(([t, label]) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                    className={`rounded-full px-5 py-2 font-semibold ${tab === t ? "bg-ink text-white" : "bg-paper text-ink"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === "profile" ? (
                <ProfileEditor pp={pp} city={me.city} onSaved={load} />
              ) : (
                <div className="mt-5 space-y-4">
                  {rows === null && <p className="text-muted">Loading jobs…</p>}
                  {rows && list.length === 0 && (
                    <div className="rounded-3xl bg-paper p-8 text-center">
                      <Illustration name="step-pro" className="mx-auto h-32 w-48" />
                    <p className="mt-2 font-display text-xl font-bold">
                        {tab === "new" ? "No new requests right now" : tab === "active" ? "No jobs in progress" : "No past jobs yet"}
                      </p>
                      <p className="mt-1 text-muted">
                        {tab === "new" ? "Keep your status set to available so customers can book you." : "Jobs you accept will show up here."}
                      </p>
                    </div>
                  )}
                  {list.map((b) => (
                    <ProviderJob key={b.id} b={b} vat={pp.vat_registered} onChange={load} />
                  ))}
                </div>
              )}
              {error && <p className="mt-4 font-medium text-red-700">{error}</p>}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function VerificationBanner({ status, reason }: { status: string; reason: string | null }) {
  if (status === "Verified") return null;
  const text =
    status === "Rejected"
      ? `Your profile was not approved${reason ? `: ${reason}` : ""}. Update your details and contact support.`
      : status === "Under review"
      ? "We're reviewing your documents. You can still receive requests meanwhile."
      : "Your profile shows as verification pending until we check your documents.";
  return (
    <p className={`mt-5 rounded-2xl px-4 py-3 text-[15px] ${status === "Rejected" ? "bg-red-100 text-red-900" : "bg-sun/25 text-ink"}`}>
      {text}
    </p>
  );
}

function AvailabilitySwitch({ available, onChange }: { available: boolean; onChange: () => void }) {
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from("provider_profiles").update({ available: !available }).eq("user_id", data.user.id);
    setBusy(false);
    onChange();
  }
  return (
    <button type="button" role="switch" aria-checked={available} disabled={busy} onClick={toggle}
      className={`flex items-center gap-3 rounded-full px-4 py-2 font-semibold ${available ? "bg-palm text-white" : "bg-paper text-muted"}`}>
      <span className={`h-3 w-3 rounded-full ${available ? "bg-sun" : "bg-line"}`} />
      {available ? "Available for jobs" : "Not taking jobs"}
    </button>
  );
}

const NEXT_STEP: Record<string, { to: string; label: string }> = {
  Accepted: { to: "On the way", label: "I'm on the way" },
  "On the way": { to: "In progress", label: "Start the job" },
};

function ProviderJob({ b, vat, onChange }: { b: Row; vat: boolean; onChange: () => void }) {
  const [supabase] = useState(() => createClient());
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [finishing, setFinishing] = useState(false);
  const [labour, setLabour] = useState(String(b.price_from ?? ""));
  const [parts, setParts] = useState("0");
  const [partsNote, setPartsNote] = useState("");
  const [paid, setPaid] = useState(b.pay_method === "Monthly rent" ? "Cash" : b.pay_method);
  const bill = one(b.bill);
  const review = one(b.review);
  const customer = b.customer?.name ?? "Customer";

  useEffect(() => {
    if (["Accepted", "On the way", "In progress", "Completed"].includes(b.status)) {
      supabase.rpc("get_contact_phone", { p_booking: b.id }).then(({ data }) => setPhone(data as string | null));
    }
  }, [b.id, b.status, supabase]);

  async function move(to: string, ask?: string) {
    let reason: string | null = null;
    if (ask) {
      reason = window.prompt(ask);
      if (reason === null) return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase.rpc("set_booking_status", { p_booking: b.id, p_status: to, p_reason: reason || null });
    setBusy(false);
    if (error) return setMsg(error.message);
    onChange();
  }

  async function finish() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.rpc("complete_job", {
      p_booking: b.id,
      p_labour: Number(labour),
      p_parts: Number(parts) || 0,
      p_parts_note: partsNote.trim() || null,
      p_vat: vat,
      p_paid: paid,
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    onChange();
  }

  const step = NEXT_STEP[b.status];

  return (
    <article className="rounded-3xl bg-paper p-5 sm:p-6">
      <Link href={`/booking?id=${b.id}`} className="block rounded-2xl hover:bg-mist/60">
        <BookingHeader b={b} who={customer} />
      </Link>
      <Progress status={b.status} kind={b.kind} />
      <Link href={`/booking?id=${b.id}`} className="mt-3 inline-block text-[15px] font-semibold text-palm underline">Messages and details</Link>

      {b.address && <p className="mt-4 text-[15px]"><span className="text-muted">Address: </span>{b.address}</p>}
      {b.note && <p className="mt-2 text-[15px]"><span className="text-muted">Note: </span>{b.note}</p>}
      {b.kind !== "room" && b.status !== "Completed" && (
        <p className="mt-2 text-[15px] text-muted">Customer will pay by {b.pay_method}.</p>
      )}
      {phone && ACTIVE.includes(b.status) && (
        <p className="mt-2 text-[15px]">
          Call {customer}: <a className="font-semibold text-palm underline" href={`tel:${phone}`}>{phone}</a>
        </p>
      )}
      {b.status_reason && ["Declined", "Cancelled"].includes(b.status) && (
        <p className="mt-3 text-[15px] text-red-800">Reason: {b.status_reason}</p>
      )}
      {bill && <BillView bill={bill} vatRegistered={vat} />}
      {review && (
        <p className="mt-4 text-[15px]">
          <span className="text-sun">{"★".repeat(review.stars)}</span> {review.body ?? ""}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {b.status === "Requested" && (
          <>
            <button className={primaryBtn} disabled={busy} onClick={() => move("Accepted")}>Accept</button>
            <button className={ghostBtn} disabled={busy} onClick={() => move("Declined", "Why are you declining? (the customer will see this)")}>Decline</button>
          </>
        )}
        {b.kind !== "room" && step && (
          <button className={primaryBtn} disabled={busy} onClick={() => move(step.to)}>{step.label}</button>
        )}
        {b.kind === "room" && b.status === "Accepted" && (
          <button className={primaryBtn} disabled={busy} onClick={() => move("Completed")}>Viewing done</button>
        )}
        {b.kind !== "room" && b.status === "In progress" && !finishing && (
          <button className={primaryBtn} onClick={() => setFinishing(true)}>Finish job and add bill</button>
        )}
        {["Accepted", "On the way"].includes(b.status) && (
          <button className="font-semibold text-red-700 underline" disabled={busy}
            onClick={() => move("Cancelled", "Why are you cancelling? (the customer will see this)")}>
            Cancel job
          </button>
        )}
      </div>

      {finishing && b.status === "In progress" && (
        <div className="mt-5 rounded-2xl border-2 border-line p-4">
          <p className="font-semibold">Bill for {customer}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor={`l-${b.id}`}>Labour (SAR)</label>
              <input id={`l-${b.id}`} className={inputCls} type="number" min={0} value={labour} onChange={(e) => setLabour(e.target.value)} />
            </div>
            <div>
              <label className={labelCls} htmlFor={`p-${b.id}`}>Parts (SAR)</label>
              <input id={`p-${b.id}`} className={inputCls} type="number" min={0} value={parts} onChange={(e) => setParts(e.target.value)} />
            </div>
          </div>
          <label className={`${labelCls} mt-4`} htmlFor={`pn-${b.id}`}>Parts used (optional)</label>
          <input id={`pn-${b.id}`} className={inputCls} placeholder="e.g. capacitor, 1 m copper pipe" value={partsNote} onChange={(e) => setPartsNote(e.target.value)} />
          <p className={`${labelCls} mt-4`}>Paid by</p>
          <div className="flex flex-wrap gap-2">
            {PAY_METHODS.map((m) => <Chip key={m} selected={paid === m} onClick={() => setPaid(m)}>{m}</Chip>)}
          </div>
          {vat && <p className="mt-3 text-sm text-muted">15% VAT will be added because you&apos;re VAT registered.</p>}
          <div className="mt-4 flex gap-3">
            <button className={primaryBtn} disabled={busy || !(Number(labour) >= 0) || labour === ""} onClick={finish}>Complete job</button>
            <button className={ghostBtn} onClick={() => setFinishing(false)}>Back</button>
          </div>
        </div>
      )}
      {msg && <p className="mt-3 text-sm font-medium text-red-700">{msg}</p>}
    </article>
  );
}

function ProfileEditor({ pp, city, onSaved }: { pp: PP; city: string; onSaved: () => void }) {
  const [supabase] = useState(() => createClient());
  const [services, setServices] = useState(pp.services);
  const [districts, setDistricts] = useState(pp.districts);
  const [price, setPrice] = useState(String(pp.price_from));
  const [experience, setExperience] = useState(pp.experience ?? "");
  const [phone, setPhone] = useState(pp.contact_phone ?? "");
  const [about, setAbout] = useState(pp.about ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isLandlord = pp.provider_type === "Landlord / room owner";
  const offerable = ALL_SERVICES.filter((s) => (isLandlord ? s.slug === "rooms" : s.slug !== "rooms"));

  function toggle(list: string[], v: string, set: (x: string[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function save() {
    setBusy(true);
    setMsg("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const { error } = await supabase
      .from("provider_profiles")
      .update({
        services, districts, price_from: Number(price),
        experience: experience.trim() || null, contact_phone: phone.trim() || null, about: about.trim() || null,
      })
      .eq("user_id", data.user.id);
    setBusy(false);
    if (error) return setMsg(error.message);
    setMsg("Saved");
    onSaved();
  }

  return (
    <div className="mt-5">
      <Panel>
        <p className={labelCls}>Services you offer</p>
        <div className="flex flex-wrap gap-2">
          {offerable.map((s) => (
            <Chip key={s.slug} role="checkbox" selected={services.includes(s.slug)} onClick={() => toggle(services, s.slug, setServices)}>{s.name}</Chip>
          ))}
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="price">{isLandlord ? "Monthly rent from (SAR)" : "Starting price (SAR)"}</label>
            <input id="price" className={inputCls} type="number" min={10} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="exp">Experience</label>
            <input id="exp" className={inputCls} value={experience} onChange={(e) => setExperience(e.target.value)} />
          </div>
        </div>
        <p className={`${labelCls} mt-6`}>Districts you cover in {city}</p>
        <div className="flex flex-wrap gap-2">
          {(DISTRICTS[city] ?? []).map((d) => (
            <Chip key={d} role="checkbox" selected={districts.includes(d)} onClick={() => toggle(districts, d, setDistricts)}>{d}</Chip>
          ))}
        </div>
        <label className={`${labelCls} mt-6`} htmlFor="phone">Contact phone</label>
        <input id="phone" className={inputCls} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <label className={`${labelCls} mt-5`} htmlFor="about">About you</label>
        <textarea id="about" className={inputCls} rows={3} maxLength={600} value={about} onChange={(e) => setAbout(e.target.value)} />
        <button className={`${primaryBtn} mt-6`} disabled={busy || services.length === 0 || districts.length === 0 || Number(price) < 10} onClick={save}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        {msg && <p className={`mt-3 text-sm font-medium ${msg === "Saved" ? "text-palm" : "text-red-700"}`}>{msg}</p>}
      </Panel>
    </div>
  );
}
