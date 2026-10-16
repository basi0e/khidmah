"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Illustration } from "@/components/Illustration";
import { UiIcon } from "@/components/NavIcons";
import { primaryBtn, ghostBtn } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { ALL_SERVICES, DISTRICTS, findService, type Service } from "@/lib/services";
import { PROVIDER_FIELDS, ratingsFor, type PublicProvider, type Rating } from "@/lib/providers";

type Sort = "rating" | "price";

const TINTS = ["bg-sun-50 text-sun-ink", "bg-palm-50 text-palm-deep", "bg-[#e8eef8] text-[#1e3a5f]", "bg-[#f3e8f5] text-[#5b2a63]"];

function ToggleChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`min-h-10 shrink-0 rounded-full border px-4 text-[14px] font-medium transition-colors ${on ? "border-ink bg-ink text-white" : "border-line-strong bg-paper text-ink hover:border-muted"}`}>
      {children}
    </button>
  );
}

export default function BrowsePage() {
  const [supabase] = useState(() => createClient());
  const [service, setService] = useState<Service | undefined>();
  const [city, setCity] = useState("Riyadh");
  const [district, setDistrict] = useState("all");
  const [sort, setSort] = useState<Sort>("rating");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [rows, setRows] = useState<PublicProvider[] | null>(null);
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setService(findService(q.get("service")));
    const c = q.get("city");
    if (c && DISTRICTS[c]) setCity(c);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !service) return;
    setRows(null);
    supabase
      .from("provider_profiles")
      .select(PROVIDER_FIELDS)
      .contains("services", [service.slug])
      .eq("profile.city", city)
      .then(async ({ data }) => {
        const list = (data as unknown as PublicProvider[]) ?? [];
        setRatings(await ratingsFor(supabase, list.map((p) => p.user_id)));
        setRows(list);
      });
    window.history.replaceState(null, "", `/browse?${new URLSearchParams({ service: service.slug, city })}`);
  }, [ready, service, city, supabase]);

  const shown = (rows ?? [])
    .filter((p) => district === "all" || p.districts.length === 0 || p.districts.includes(district))
    .filter((p) => !verifiedOnly || p.status === "Verified")
    .sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if (sort === "price") return (a.price_from ?? 0) - (b.price_from ?? 0);
      return (ratings[b.user_id]?.avg ?? 0) - (ratings[a.user_id]?.avg ?? 0) || (a.status === "Verified" ? -1 : 1);
    });

  const isRooms = service?.slug === "rooms";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-10 pt-4 sm:px-6 sm:pt-8">
        {ready && !service && (
          <>
            <h1 className="text-[26px] font-bold tracking-tight sm:text-4xl">All services</h1>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ALL_SERVICES.map((s) => (
                <li key={s.slug}>
                  <button onClick={() => setService(s)} className="flex h-full w-full flex-col rounded-2xl bg-paper p-4 text-left shadow-card transition-shadow hover:shadow-lift">
                    <Illustration name={s.slug} className="h-24 w-full sm:h-32" />
                    <span className="mt-2 font-bold">{s.name}</span>
                    <span className="mt-0.5 hidden text-[14px] text-muted sm:block">{s.jobs}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {service && (
          <>
            <div className="flex items-center gap-2">
              <Link href="/browse" onClick={() => setService(undefined)} aria-label="All services"
                className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-soft">
                <UiIcon name="back" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[22px] font-bold sm:text-3xl">{service.name}</h1>
                <p className="text-[14px] text-muted">
                  {city}{rows ? `, ${shown.length} ${isRooms ? "landlord" : "provider"}${shown.length === 1 ? "" : "s"}` : ""}
                </p>
              </div>
              <Illustration name={service.slug} className="hidden h-24 w-36 sm:block" />
            </div>

            <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              {Object.keys(DISTRICTS).map((c) => (
                <ToggleChip key={c} on={city === c} onClick={() => { setCity(c); setDistrict("all"); }}>{c}</ToggleChip>
              ))}
              <label className="sr-only" htmlFor="district">District</label>
              <select id="district" value={district} onChange={(e) => setDistrict(e.target.value)}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-[14px] font-medium ${district !== "all" ? "border-ink bg-ink text-white" : "border-line-strong bg-paper"}`}>
                <option value="all">All districts</option>
                {DISTRICTS[city].map((d) => <option key={d}>{d}</option>)}
              </select>
              <ToggleChip on={sort === "rating"} onClick={() => setSort("rating")}>Best rated</ToggleChip>
              <ToggleChip on={sort === "price"} onClick={() => setSort("price")}>Lowest price</ToggleChip>
              <ToggleChip on={verifiedOnly} onClick={() => setVerifiedOnly(!verifiedOnly)}>Verified only</ToggleChip>
            </div>

            <ul className="mt-4 space-y-3">
              {rows === null && [0, 1].map((i) => <li key={i} className="h-44 animate-pulse rounded-2xl bg-paper shadow-card" />)}
              {rows && shown.length === 0 && (
                <li className="rounded-2xl bg-paper p-8 text-center shadow-card">
                  <Illustration name="step-pro" className="mx-auto h-32 w-48" />
                  <p className="mt-2 text-lg font-bold">No {isRooms ? "landlords" : "providers"} here yet</p>
                  <p className="mt-1 text-muted">We&apos;re signing up providers for {service.name} in {city}. Check back soon.</p>
                  <Link href="/login" className={`${ghostBtn} mt-4`}>Offer this service on Khidmah</Link>
                </li>
              )}
              {shown.map((p, i) => {
                const r = ratings[p.user_id];
                return (
                  <li key={p.user_id} className={`rounded-2xl bg-paper p-4 shadow-card sm:p-5 ${p.available ? "" : "opacity-60"}`}>
                    <Link href={`/pro?id=${p.user_id}`} className="flex gap-3">
                      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${TINTS[i % TINTS.length]}`}>
                        {p.profile.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[17px] font-bold">{p.profile.name}</span>
                          {p.status === "Verified" && (
                            <span className="text-palm" title="Verified by Khidmah"><svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" role="img" aria-label="Verified"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                          )}
                        </span>
                        <span className="block text-[14px] text-muted">{p.provider_type}{p.experience ? `, ${p.experience}` : ""}</span>
                        <span className="mt-1 flex items-center gap-1 text-[14px]">
                          {r ? (
                            <>
                              <UiIcon name="star" className="h-4 w-4 text-sun" />
                              <span className="font-semibold">{r.avg.toFixed(1)}</span>
                              <span className="text-muted">({r.count} review{r.count === 1 ? "" : "s"})</span>
                            </>
                          ) : <span className="text-muted">New on Khidmah</span>}
                          {!p.available && <span className="ml-2 text-muted">Not taking jobs</span>}
                        </span>
                      </span>
                    </Link>
                    {p.languages.length > 0 && (
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Languages">
                        {p.languages.map((l) => <li key={l} className="rounded-full bg-soft px-2.5 py-1 text-[13px] text-ink/80">{l}</li>)}
                      </ul>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                      <span>
                        <span className="block text-[13px] text-muted">{isRooms ? "Rent from" : "Starting from"}</span>
                        <span className="block text-lg font-bold">{p.price_from != null ? `SAR ${p.price_from}` : "Ask"}</span>
                      </span>
                      {p.available && (
                        <Link href={`/request?service=${service.slug}&city=${city}&provider=${p.user_id}`} className={`${primaryBtn} !min-h-11 !px-6`}>
                          Book
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </>
  );
}
