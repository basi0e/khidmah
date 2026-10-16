"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Illustration } from "@/components/Illustration";
import { Stars } from "@/components/Stars";
import { Chip, primaryBtn, ghostBtn } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { ALL_SERVICES, DISTRICTS, findService, type Service } from "@/lib/services";
import { PROVIDER_FIELDS, ratingsFor, type PublicProvider, type Rating } from "@/lib/providers";

type Sort = "rating" | "price";

export default function BrowsePage() {
  const [supabase] = useState(() => createClient());
  const [service, setService] = useState<Service | undefined>();
  const [city, setCity] = useState("Riyadh");
  const [district, setDistrict] = useState("all");
  const [sort, setSort] = useState<Sort>("rating");
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
        const list = ((data as unknown as PublicProvider[]) ?? []);
        setRatings(await ratingsFor(supabase, list.map((p) => p.user_id)));
        setRows(list);
      });
    const q = new URLSearchParams({ service: service.slug, city });
    window.history.replaceState(null, "", `/browse?${q}`);
  }, [ready, service, city, supabase]);

  const shown = (rows ?? [])
    .filter((p) => district === "all" || p.districts.length === 0 || p.districts.includes(district))
    .sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if (sort === "price") return (a.price_from ?? 0) - (b.price_from ?? 0);
      const ra = ratings[a.user_id]?.avg ?? 0;
      const rb = ratings[b.user_id]?.avg ?? 0;
      return rb - ra || (a.status === "Verified" ? -1 : 1);
    });

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-mist px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {ready && !service && (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight">All services</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_SERVICES.map((s) => (
                  <button key={s.slug} onClick={() => setService(s)}
                    className="flex flex-col rounded-2xl bg-paper p-5 text-left hover:ring-2 hover:ring-ink">
                    <Illustration name={s.slug} className="h-32 w-full" />
                    <span className="mt-2">
                      <span className="block font-display text-lg font-bold">{s.name}</span>
                      <span className="block text-sm text-muted">{s.jobs}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {service && (
            <>
              <div className="flex flex-col-reverse gap-4 rounded-3xl bg-paper p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <h1 className="font-display text-4xl font-bold tracking-tight">{service.name} in {city}</h1>
                  <p className="mt-1 text-muted">{service.jobs}</p>
                </div>
                <Illustration name={service.slug} className="h-32 w-48 shrink-0 sm:h-40 sm:w-60" />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {Object.keys(DISTRICTS).map((c) => (
                  <Chip key={c} selected={city === c} onClick={() => { setCity(c); setDistrict("all"); }}>{c}</Chip>
                ))}
                <select aria-label="District" value={district} onChange={(e) => setDistrict(e.target.value)}
                  className="rounded-xl border-2 border-line bg-paper px-3 py-2.5 font-medium">
                  <option value="all">All districts</option>
                  {DISTRICTS[city].map((d) => <option key={d}>{d}</option>)}
                </select>
                <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}
                  className="rounded-xl border-2 border-line bg-paper px-3 py-2.5 font-medium">
                  <option value="rating">Best rated</option>
                  <option value="price">Lowest price</option>
                </select>
              </div>

              <div className="mt-6 space-y-3">
                {rows === null && <p className="text-muted">Finding providers…</p>}
                {rows && shown.length === 0 && (
                  <div className="rounded-3xl bg-paper p-8 text-center">
                    <Illustration name="step-pro" className="mx-auto h-36 w-56 opacity-80" />
                    <p className="mt-2 font-display text-xl font-bold">No providers here yet</p>
                    <p className="mt-1 text-muted">We&apos;re signing up {service.name.toLowerCase()} providers in {city}. Check back soon.</p>
                    <Link href="/login" className={`${ghostBtn} mt-4 inline-block`}>Offer this service on Khidmah</Link>
                  </div>
                )}
                {shown.map((p) => (
                  <article key={p.user_id} className={`flex flex-col gap-4 rounded-3xl bg-paper p-5 sm:flex-row sm:items-center sm:p-6 ${p.available ? "" : "opacity-60"}`}>
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sun font-display text-xl font-bold">
                      {p.profile.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-xl font-bold">{p.profile.name}</h2>
                        {p.status === "Verified" && <span className="rounded-full bg-palm px-2.5 py-0.5 text-xs font-semibold text-white">Verified</span>}
                        {!p.available && <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold">Not taking jobs</span>}
                      </div>
                      <p className="text-[15px] text-muted">
                        {p.provider_type}{p.experience ? `, ${p.experience}` : ""}
                      </p>
                      <p className="mt-1"><Stars avg={ratings[p.user_id]?.avg ?? 0} count={ratings[p.user_id]?.count ?? 0} /></p>
                      {p.districts.length > 0 && <p className="mt-1 text-sm text-muted">Covers {p.districts.slice(0, 4).join(", ")}{p.districts.length > 4 ? ` and ${p.districts.length - 4} more` : ""}</p>}
                    </div>
                    <div className="flex flex-col gap-2 sm:items-end">
                      {p.price_from != null && (
                        <p><span className="text-sm text-muted">{service.slug === "rooms" ? "rent from " : "from "}</span>
                          <span className="font-display text-xl font-bold">SAR {p.price_from}</span></p>
                      )}
                      <div className="flex gap-2">
                        <Link href={`/pro?id=${p.user_id}`} className="rounded-full border-2 border-ink px-4 py-2 font-semibold hover:bg-mist">Profile</Link>
                        {p.available && (
                          <Link href={`/request?service=${service.slug}&city=${city}&provider=${p.user_id}`} className={`${primaryBtn} !px-4 !py-2`}>Book</Link>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
