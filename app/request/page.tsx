"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Icon } from "@/components/Icon";
import { Illustration } from "@/components/Illustration";
import { Chip, inputCls, labelCls, primaryBtn, ghostBtn } from "@/components/ui";
import { UiIcon } from "@/components/NavIcons";
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
  const [wanted, setWanted] = useState<string | null>(null);
  const [asap, setAsap] = useState(false);
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState("Cash");
  const [saved, setSaved] = useState<{ id: string; label: string; district: string; detail: string }[]>([]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [bookedRef, setBookedRef] = useState("");
  const [step, setStep] = useState(1);

  const [days, setDays] = useState<{ iso: string; label: string }[]>([]);

  // Read the choices from the home page and who is logged in
  useEffect(() => {
    const week = nextDays(7);
    setDays(week);
    const q = new URLSearchParams(window.location.search);
    const s = findService(q.get("service"));
    setService(s);
    if (s) setSub(s.subs[0]);
    const w = q.get("when") ?? "flexible";
    setWhen(w);
    const qCity = q.get("city");
    const qProvider = q.get("provider");
    if (qProvider) setWanted(qProvider);

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      let profileCity: string | null = null;
      if (user) {
        const { data: p } = await supabase.from("profiles").select("role, city").eq("id", user.id).maybeSingle();
        if (p) {
          setMe({ id: user.id, role: p.role, city: p.city });
          const { data: addr } = await supabase.from("addresses").select("id, label, district, detail").eq("user_id", user.id).order("created_at");
          setSaved(addr ?? []);
          profileCity = p.city;
        }
      }
      const c = qCity && DISTRICTS[qCity] ? qCity : profileCity ?? "Riyadh";
      setCity(c);
      setDistrict(DISTRICTS[c][0]);
      if (w === "today") setDay(week[0].iso);
      setReady(true);
    });
  }, [supabase]);

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
        const list = (data as unknown as Provider[]) ?? [];
        setProviders(list);
        if (wanted && list.some((p) => p.user_id === wanted)) setProviderId(wanted);
      });
  }, [service, city, ready, supabase, wanted]);

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

  const STEP_TITLES = ["What needs doing?", isRoom ? "Choose a landlord" : "Choose a provider", "When should they come?", "Your details"];
  const stepOk = [
    !!sub,
    !!chosen,
    asap || (!!day && !!slot),
    isRoom || address.trim().length >= 3,
  ];
  const dayText = asap ? "As soon as possible" : day ? days.find((d) => d.iso === day)?.label ?? "" : "";
  const slotShort = slot.replace(/\s*\(.*\)/, "");
  const when2 = asap ? "As soon as possible" : [dayText, slotShort].filter(Boolean).join(", ");
  const summary =
    step === 1 ? sub :
    step === 2 ? (chosen ? `${sub} with ${chosen.profile.name}` : sub) :
    step === 3 ? when2 || chosen?.profile.name || "" :
    `${chosen?.profile.name ?? ""}, ${when2}`;

  function next() {
    if (step < 4) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
    } else {
      submit();
    }
  }

  function back() {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0 });
    } else {
      window.history.length > 1 ? window.history.back() : (window.location.href = "/browse");
    }
  }

  const canBook = ready && !!service && !bookedRef && me?.role === "customer";

  return (
    <>
      {!canBook && <SiteHeader />}
      <main className={`mx-auto w-full max-w-2xl flex-1 px-4 sm:px-6 ${canBook ? "pb-36 pt-0" : "py-6 sm:py-10"}`}>
        {!ready && <p className="py-10 text-muted">Loading…</p>}

        {ready && !service && (
          <>
            <h1 className="text-[26px] font-bold tracking-tight">What do you need?</h1>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {ALL_SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link href={`/request?service=${s.slug}&city=${city}`} onClick={() => { setService(s); setSub(s.subs[0]); }}
                    className="flex min-h-16 items-center gap-3 rounded-2xl bg-paper p-3 shadow-card hover:shadow-lift">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-palm-50 text-palm"><Icon name={s.slug} className="h-5 w-5" /></span>
                    <span className="font-semibold">{s.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {ready && service && bookedRef && (
          <div className="rounded-2xl bg-paper p-6 text-center shadow-card sm:p-10">
            <Illustration name="step-bill" className="mx-auto h-36 w-52" />
            <h1 className="mt-3 text-2xl font-bold">Request sent to {chosen?.profile.name}</h1>
            <p className="mt-2 text-muted">
              Reference <strong className="text-ink">{bookedRef}</strong>. We&apos;ll notify you as soon as {chosen?.profile.name.split(" ")[0]} accepts.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/account" className={primaryBtn}>See my bookings</Link>
              <Link href="/" className={ghostBtn}>Back to home</Link>
            </div>
          </div>
        )}

        {ready && service && !bookedRef && !me && (
          <div className="rounded-2xl bg-paper p-6 text-center shadow-card sm:p-10">
            <Illustration name={service.slug} className="mx-auto h-32 w-48" />
            <h1 className="mt-3 text-2xl font-bold">Book {service.phrase}</h1>
            <p className="mt-2 text-muted">Log in or create an account to book. We&apos;ll bring you straight back here.</p>
            <Link href={`/login?next=${encodeURIComponent(nextUrl)}`} className={`${primaryBtn} mt-6 w-full sm:w-auto`}>Log in or sign up</Link>
          </div>
        )}
        {ready && service && !bookedRef && me && me.role !== "customer" && (
          <div className="rounded-2xl bg-paper p-6 shadow-card">
            <h1 className="text-xl font-bold">Provider accounts can&apos;t book</h1>
            <p className="mt-2 text-muted">Use a customer account to make a booking.</p>
          </div>
        )}

        {canBook && service && (
          <>
            {/* Wizard header */}
            <div className="sticky top-0 z-30 -mx-4 border-b border-line bg-paper px-2 pb-3 pt-3 sm:-mx-6 sm:px-4">
              <div className="flex items-center gap-1">
                <button type="button" onClick={back} aria-label={step > 1 ? "Previous step" : "Leave booking"}
                  className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-soft">
                  <UiIcon name="back" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-muted">Step {step} of 4, {service.name}</p>
                  <h1 className="truncate text-[19px] font-bold">{STEP_TITLES[step - 1]}</h1>
                </div>
              </div>
              <ol className="mt-3 flex gap-1.5 px-2" aria-hidden="true">
                {[1, 2, 3, 4].map((n) => <li key={n} className={`h-1 flex-1 rounded-full ${n <= step ? "bg-palm" : "bg-line"}`} />)}
              </ol>
            </div>

            <div className="mt-5 space-y-6">
              {step === 1 && (
                <>
                  <section>
                    <h2 className="mb-3 font-semibold">Choose the job</h2>
                    <div className="grid gap-2" role="radiogroup" aria-label="Job">
                      {service.subs.map((s) => (
                        <OptionRow key={s} selected={sub === s} onClick={() => setSub(s)} title={s} />
                      ))}
                    </div>
                  </section>
                  <section>
                    <h2 className="mb-3 font-semibold">City</h2>
                    <div className="flex gap-2" role="radiogroup" aria-label="City">
                      {Object.keys(DISTRICTS).map((c) => <Chip key={c} selected={city === c} onClick={() => changeCity(c)}>{c}</Chip>)}
                    </div>
                  </section>
                  {!isRoom && (
                    <section>
                      <label className={labelCls} htmlFor="district">Your district</label>
                      <select id="district" className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                        {DISTRICTS[city].map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </section>
                  )}
                </>
              )}

              {step === 2 && (
                <section>
                  {providers === null && <p className="text-muted">Finding providers in {city}…</p>}
                  {providers?.length === 0 && (
                    <div className="rounded-2xl bg-paper p-6 text-center shadow-card">
                      <Illustration name="step-pro" className="mx-auto h-28 w-44" />
                      <p className="mt-2 font-bold">No one offers {service.name} in {city} yet</p>
                      <p className="mt-1 text-muted">We&apos;re signing up providers now. Check back soon.</p>
                    </div>
                  )}
                  <div className="grid gap-3" role="radiogroup" aria-label="Provider">
                    {providers?.map((p) => {
                      const covers = isRoom || p.districts.length === 0 || p.districts.includes(district);
                      const selected = providerId === p.user_id;
                      return (
                        <button key={p.user_id} type="button" role="radio" aria-checked={selected} onClick={() => setProviderId(p.user_id)}
                          className={`flex items-center gap-3 rounded-2xl border-2 bg-paper p-4 text-left transition-colors ${selected ? "border-palm" : "border-transparent shadow-card hover:border-line-strong"}`}>
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sun-50 font-bold text-sun-ink">
                            {p.profile.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold">{p.profile.name}</span>
                            <span className="block text-[14px] text-muted">
                              {p.status === "Verified" ? "Verified" : "Verification pending"}{p.experience ? `, ${p.experience}` : ""}
                            </span>
                            {!covers && <span className="block text-[13px] text-[#9b1c13]">Doesn&apos;t usually cover {district}</span>}
                          </span>
                          <span className="text-right">
                            {p.price_from != null && <span className="block font-bold">SAR {p.price_from}</span>}
                            <span className={`ml-auto mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${selected ? "border-palm bg-palm text-white" : "border-line-strong"}`}>
                              {selected && <UiIcon name="check" className="h-4 w-4" />}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {step === 3 && (
                <>
                  {!isRoom && (
                    <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl bg-sun-50 p-4">
                      <span className="flex-1">
                        <span className="block font-bold">As soon as possible</span>
                        <span className="block text-[14px] text-sun-ink">Marked urgent for the technician</span>
                      </span>
                      <input type="checkbox" checked={asap} onChange={(e) => setAsap(e.target.checked)} className="h-6 w-6 accent-[#0e6b57]" />
                    </label>
                  )}
                  {!asap && (
                    <>
                      <section>
                        <h2 className="mb-3 font-semibold">Day</h2>
                        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Day">
                          {days.map((d) => {
                            const on = day === d.iso;
                            const [top, ...rest] = d.label.split(" ");
                            return (
                              <button key={d.iso} type="button" role="radio" aria-checked={on} onClick={() => setDay(d.iso)}
                                className={`flex min-h-[4.5rem] min-w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-2xl border px-2 transition-colors ${on ? "border-palm bg-palm text-white" : "border-line-strong bg-paper hover:border-muted"}`}>
                                <span className={`text-[13px] ${on ? "text-white/85" : "text-muted"}`}>{rest.length ? top : d.label}</span>
                                {rest.length > 0 && <span className="text-[17px] font-bold">{rest.join(" ")}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                      <section>
                        <h2 className="mb-3 font-semibold">Time</h2>
                        <div className="grid gap-2" role="radiogroup" aria-label="Time">
                          {SLOTS.map((s) => {
                            const value = `${s.name} (${s.hours})`;
                            return <OptionRow key={s.name} selected={slot === value} onClick={() => setSlot(value)} title={s.name} detail={s.hours} />;
                          })}
                        </div>
                      </section>
                    </>
                  )}
                </>
              )}

              {step === 4 && (
                <>
                  {!isRoom && saved.filter((a) => DISTRICTS[city].includes(a.district)).length > 0 && (
                    <section>
                      <h2 className="mb-3 font-semibold">Saved addresses</h2>
                      <div className="flex flex-wrap gap-2">
                        {saved.filter((a) => DISTRICTS[city].includes(a.district)).map((a) => (
                          <Chip key={a.id} selected={address === a.detail && district === a.district} onClick={() => { setAddress(a.detail); setDistrict(a.district); }}>
                            {a.label}, {a.district}
                          </Chip>
                        ))}
                      </div>
                    </section>
                  )}
                  {!isRoom && (
                    <section>
                      <label className={labelCls} htmlFor="address">Address in {district}</label>
                      <input id="address" className={inputCls} autoComplete="street-address" placeholder="Building, street, apartment number"
                        value={address} onChange={(e) => setAddress(e.target.value)} />
                    </section>
                  )}
                  <section>
                    <label className={labelCls} htmlFor="phone">Phone number</label>
                    <input id="phone" className={inputCls} inputMode="tel" autoComplete="tel" placeholder="05XXXXXXXX"
                      value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <p className="mt-1.5 text-[13px] text-muted">Shared with your provider only after they accept.</p>
                  </section>
                  <section>
                    <label className={labelCls} htmlFor="note">Note for the {isRoom ? "landlord" : "technician"} (optional)</label>
                    <textarea id="note" className={inputCls} rows={3} maxLength={1000}
                      placeholder={isRoom ? "e.g. moving in from 1 November" : "e.g. the bedroom AC is leaking water"}
                      value={note} onChange={(e) => setNote(e.target.value)} />
                  </section>
                  {!isRoom && (
                    <section>
                      <h2 className="mb-3 font-semibold">Pay after the job by</h2>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Payment">
                        {PAY_METHODS.map((m) => <Chip key={m} selected={pay === m} onClick={() => setPay(m)}>{m}</Chip>)}
                      </div>
                    </section>
                  )}
                  <section className="rounded-2xl bg-paper p-4 shadow-card">
                    <h2 className="font-semibold">Summary</h2>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[15px]">
                      <dt className="text-muted">Job</dt><dd>{sub}</dd>
                      <dt className="text-muted">{isRoom ? "Landlord" : "Provider"}</dt><dd>{chosen?.profile.name}</dd>
                      <dt className="text-muted">When</dt><dd>{asap ? "As soon as possible" : `${dayText}, ${slot}`}</dd>
                      {!isRoom && <><dt className="text-muted">Where</dt><dd>{district}, {city}</dd></>}
                      {chosen?.price_from != null && <><dt className="text-muted">Starts from</dt><dd>SAR {chosen.price_from}</dd></>}
                    </dl>
                  </section>
                </>
              )}
              {error && <p className="font-medium text-[#9b1c13]">{error}</p>}
            </div>

            {/* Fixed action bar */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgb(20_32_43/0.06)]">
              <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
                <p className="min-w-0 flex-1 truncate text-[14px] text-muted">{summary || service.name}</p>
                <button type="button" className={`${primaryBtn} shrink-0 !min-h-[3.25rem] !px-7`} disabled={!stepOk[step - 1] || busy} onClick={next}>
                  {busy ? "Sending…" : step < 4 ? "Continue" : "Send request"}
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function OptionRow({ selected, onClick, title, detail }: { selected: boolean; onClick: () => void; title: string; detail?: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onClick}
      className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 text-left transition-colors ${selected ? "border-palm bg-palm-50" : "border-line-strong bg-paper hover:border-muted"}`}>
      <span className={selected ? "font-semibold text-palm-deep" : "font-medium"}>{title}</span>
      <span className="flex items-center gap-2 text-[14px] text-muted">
        {detail}
        <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${selected ? "border-palm bg-palm text-white" : "border-line-strong"}`}>
          {selected && <UiIcon name="check" className="h-4 w-4" />}
        </span>
      </span>
    </button>
  );
}
