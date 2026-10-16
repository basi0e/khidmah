"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Icon } from "@/components/Icon";
import { Chip, Panel, inputCls, labelCls, primaryBtn, ghostBtn } from "@/components/ui";
import { ALL_SERVICES, DISTRICTS, PAY_METHODS, SLOTS, findService, type Service } from "@/lib/services";

type Provider = {
  user_id: string;
  provider_type: string;
  price_from: number | null;
  experience: string | null;
  about: string | null;
  districts: string[];
  status: string;
  profile: { name: string; city: string };
};

type Me = { id: string; role: string; city: string } | null;

function isoDate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function nextDays(count: number) {
  const out: { iso: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const label =
      i === 0 ? "Today" : i === 1 ? "Tomorrow" :
      d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    out.push({ iso: isoDate(d), label });
  }
  return out;
}

function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl font-bold">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sun text-lg text-ink">{n}</span>
      {children}
    </h2>
  );
}

export default function RequestPage() {
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const [service, setService] = useState<Service | undefined>();
  const [city, setCity] = useState("Riyadh");
  const [when, setWhen] = useState("today");

  const [sub, setSub] = useState("");
  const [district, setDistrict] = useState("");
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [providerId, setProviderId] = useState("");
  const [asap, setAsap] = useState(false);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState("Cash");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookedRef, setBookedRef] = useState("");

  const days = useMemo(() => nextDays(7), []);

  // Read the choices from the home page and who is logged in
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = findService(q.get("service"));
    setService(s);
    if (s) setSub(s.subs[0]);
    const w = q.get("when") ?? "flexible";
    setWhen(w);
    const qCity = q.get("city");

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      let profileCity: string | null = null;
      if (user) {
        const { data: p } = await supabase.from("profiles").select("role, city").eq("id", user.id).maybeSingle();
        if (p) {
          setMe({ id: user.id, role: p.role, city: p.city });
          profileCity = p.city;
        }
      }
      const c = qCity && DISTRICTS[qCity] ? qCity : profileCity ?? "Riyadh";
      setCity(c);
      setDistrict(DISTRICTS[c][0]);
      if (w === "today") setDay(days[0].iso);
      setReady(true);
    });
  }, [supabase, days]);

  // Load providers for this service and city
  useEffect(() => {
    if (!service || !ready) return;
    setProviders(null);
    setProviderId("");
    supabase
      .from("provider_profiles")
      .select("user_id, provider_type, price_from, experience, about, districts, status, profile:profiles!inner(name, city)")
      .contains("services", [service.slug])
      .eq("available", true)
      .eq("profile.city", city)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        setProviders((data as unknown as Provider[]) ?? []);
      });
  }, [service, city, ready, supabase]);

  function changeCity(c: string) {
    setCity(c);
    setDistrict(DISTRICTS[c][0]);
  }

  const isRoom = service?.slug === "rooms";
  const chosen = providers?.find((p) => p.user_id === providerId);
  const canSubmit =
    !!service && !!chosen && (asap || (day && slot)) && (isRoom || address.trim().length >= 3) && !busy;

  async function submit() {
    if (!service || !chosen || !me) return;
    setBusy(true);
    setError("");
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        category: service.slug,
        kind: isRoom ? "room" : "service",
        service: sub,
        customer_id: me.id,
        provider_id: chosen.user_id,
        city,
        district: isRoom ? chosen.districts[0] ?? DISTRICTS[city][0] : district,
        address: address.trim() || null,
        note: note.trim() || null,
        visit_date: asap ? days[0].iso : day,
        visit_slot: asap ? "As soon as possible" : slot,
        urgent: asap,
        pay_method: isRoom ? "Monthly rent" : pay,
        customer_phone: phone.trim() || null,
      })
      .select("ref")
      .single();
    setBusy(false);
    if (error) return setError(error.message);
    setBookedRef(data.ref);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const nextUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/request";

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-mist px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {!ready && <p className="text-muted">Loading…</p>}

          {/* No service chosen yet */}
          {ready && !service && (
            <Panel>
              <h1 className="font-display text-3xl font-bold">What do you need?</h1>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {ALL_SERVICES.map((s) => (
                  <Link key={s.slug} href={`/request?service=${s.slug}&city=${city}`}
                    className="flex items-center gap-3 rounded-xl border-2 border-line p-3 hover:border-ink"
                    onClick={() => { setService(s); setSub(s.subs[0]); }}>
                    <span className="text-palm"><Icon name={s.slug} /></span>
                    <span className="font-medium">{s.name}</span>
                  </Link>
                ))}
              </div>
            </Panel>
          )}

          {/* Booked */}
          {ready && service && bookedRef && (
            <Panel>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palm text-white">
                <Icon name={service.slug} className="h-8 w-8" />
              </span>
              <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">Request sent to {chosen?.profile.name}</h1>
              <p className="mt-3 text-lg text-muted">
                Your booking reference is <strong className="text-ink">{bookedRef}</strong>. You&apos;ll see the status change once{" "}
                {chosen?.profile.name} accepts.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/" className={primaryBtn}>Back to home</Link>
              </div>
            </Panel>
          )}

          {ready && service && !bookedRef && (
            <>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-paper text-palm">
                  <Icon name={service.slug} className="h-8 w-8" />
                </span>
                <div>
                  <h1 className="font-display text-3xl font-bold sm:text-4xl">Book {service.phrase}</h1>
                  <div className="mt-2 flex gap-2" role="radiogroup" aria-label="City">
                    {Object.keys(DISTRICTS).map((c) => (
                      <Chip key={c} selected={city === c} onClick={() => changeCity(c)}>{c}</Chip>
                    ))}
                  </div>
                </div>
              </div>

              {/* Must be a logged-in customer to book */}
              {!me && (
                <Panel>
                  <h2 className="font-display text-2xl font-bold">Log in to book</h2>
                  <p className="mt-2 text-muted">It takes a minute, and we&apos;ll bring you straight back here.</p>
                  <Link href={`/login?next=${encodeURIComponent(nextUrl)}`} className={`${primaryBtn} mt-5 inline-block`}>
                    Log in or sign up
                  </Link>
                </Panel>
              )}
              {me && me.role !== "customer" && (
                <Panel>
                  <h2 className="font-display text-2xl font-bold">Provider accounts can&apos;t book</h2>
                  <p className="mt-2 text-muted">Log out and use a customer account to make a booking.</p>
                </Panel>
              )}

              {me?.role === "customer" && (
                <>
                  <Panel>
                    <SectionTitle n={1}>What needs doing?</SectionTitle>
                    <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Job">
                      {service.subs.map((s) => (
                        <Chip key={s} selected={sub === s} onClick={() => setSub(s)}>{s}</Chip>
                      ))}
                    </div>
                    {!isRoom && (
                      <div className="mt-5">
                        <label className={labelCls} htmlFor="district">Your district</label>
                        <select id="district" className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                          {DISTRICTS[city].map((d) => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    )}
                  </Panel>

                  <Panel>
                    <SectionTitle n={2}>Choose a {isRoom ? "landlord" : "provider"}</SectionTitle>
                    {providers === null && <p className="mt-4 text-muted">Finding providers in {city}…</p>}
                    {providers?.length === 0 && (
                      <p className="mt-4 text-muted">
                        No one offers {service.name.toLowerCase()} in {city} yet. We&apos;re signing up providers now, so check back soon.
                      </p>
                    )}
                    <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Provider">
                      {providers?.map((p) => {
                        const covers = isRoom || p.districts.length === 0 || p.districts.includes(district);
                        const selected = providerId === p.user_id;
                        return (
                          <button key={p.user_id} type="button" role="radio" aria-checked={selected}
                            onClick={() => setProviderId(p.user_id)}
                            className={`flex items-start gap-4 rounded-2xl border-2 p-4 text-left ${
                              selected ? "border-palm bg-mist" : "border-line hover:border-ink"}`}>
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sun font-display text-lg font-bold">
                              {p.profile.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="flex-1">
                              <span className="block font-display text-xl font-bold">{p.profile.name}</span>
                              <span className="block text-sm text-muted">
                                {p.provider_type}{p.experience ? `, ${p.experience}` : ""}
                                {p.status === "Verified" ? ", verified" : ", verification pending"}
                              </span>
                              {!covers && <span className="mt-1 block text-sm text-red-700">Doesn&apos;t usually cover {district}</span>}
                              {p.about && <span className="mt-2 block text-[15px] text-ink">{p.about}</span>}
                            </span>
                            {p.price_from != null && (
                              <span className="text-right">
                                <span className="block text-sm text-muted">from</span>
                                <span className="font-display text-xl font-bold">SAR {p.price_from}</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Panel>

                  <Panel>
                    <SectionTitle n={3}>When?</SectionTitle>
                    {!isRoom && (
                      <div className="mt-5">
                        <Chip role="checkbox" selected={asap} onClick={() => setAsap(!asap)}>As soon as possible (urgent)</Chip>
                      </div>
                    )}
                    {!asap && (
                      <>
                        <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Day">
                          {days.map((d) => (
                            <Chip key={d.iso} selected={day === d.iso} onClick={() => setDay(d.iso)}>{d.label}</Chip>
                          ))}
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Time">
                          {SLOTS.map((s) => {
                            const value = `${s.name} (${s.hours})`;
                            return (
                              <Chip key={s.name} selected={slot === value} onClick={() => setSlot(value)}>
                                <span className="block">{s.name}</span>
                                <span className="block text-sm opacity-80">{s.hours}</span>
                              </Chip>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {when === "week" && !day && !asap && <p className="mt-3 text-sm text-muted">Pick a day this week.</p>}
                  </Panel>

                  <Panel>
                    <SectionTitle n={4}>Your details</SectionTitle>
                    {!isRoom && (
                      <>
                        <label className={`${labelCls} mt-5`} htmlFor="address">Address</label>
                        <input id="address" className={inputCls} placeholder="Building, street, apartment number"
                          value={address} onChange={(e) => setAddress(e.target.value)} />
                      </>
                    )}
                    <label className={`${labelCls} mt-5`} htmlFor="phone">Phone (shared with your provider)</label>
                    <input id="phone" className={inputCls} inputMode="tel" placeholder="05XXXXXXXX"
                      value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <label className={`${labelCls} mt-5`} htmlFor="note">Anything they should know? (optional)</label>
                    <textarea id="note" className={inputCls} rows={3} maxLength={1000}
                      placeholder={isRoom ? "e.g. moving in from 1 November" : "e.g. the AC in the bedroom is leaking water"}
                      value={note} onChange={(e) => setNote(e.target.value)} />
                    {!isRoom && (
                      <>
                        <p className={`${labelCls} mt-5`}>Pay after the job by</p>
                        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment">
                          {PAY_METHODS.map((m) => (
                            <Chip key={m} selected={pay === m} onClick={() => setPay(m)}>{m}</Chip>
                          ))}
                        </div>
                      </>
                    )}
                  </Panel>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button className={primaryBtn} disabled={!canSubmit} onClick={submit}>
                      {busy ? "Sending…" : "Send booking request"}
                    </button>
                    <Link href="/" className={ghostBtn}>Cancel</Link>
                    {!canSubmit && !busy && (
                      <p className="text-sm text-muted">
                        {!chosen ? "Choose a provider to continue." : !asap && (!day || !slot) ? "Pick a day and time." : !isRoom && address.trim().length < 3 ? "Add your address." : ""}
                      </p>
                    )}
                  </div>
                  {error && <p className="font-medium text-red-700">{error}</p>}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
