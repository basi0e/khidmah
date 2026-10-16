"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Icon } from "@/components/Icon";
import { Stars } from "@/components/Stars";
import { Panel, inputCls, primaryBtn } from "@/components/ui";
import { useMe } from "@/lib/useMe";
import { findService } from "@/lib/services";
import { PROVIDER_FIELDS, hoursText, type PublicProvider } from "@/lib/providers";

type Review = { booking_id: string; customer_name: string; stars: number; body: string | null; reply: string | null; created_at: string };

export default function ProviderProfilePage() {
  const { supabase, me } = useMe();
  const [id, setId] = useState<string | null>(null);
  const [p, setP] = useState<PublicProvider | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [jobs, setJobs] = useState<number | null>(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setId(new URLSearchParams(window.location.search).get("id"));
  }, []);

  useEffect(() => {
    if (!id) {
      if (id === null && typeof window !== "undefined" && !new URLSearchParams(window.location.search).get("id")) setP(null);
      return;
    }
    Promise.all([
      supabase.from("provider_profiles").select(PROVIDER_FIELDS).eq("user_id", id).maybeSingle(),
      supabase.from("reviews").select("booking_id, customer_name, stars, body, reply, created_at").eq("provider_id", id).order("created_at", { ascending: false }),
      supabase.rpc("provider_jobs_done", { p: id }),
    ]).then(([pp, rv, jd]) => {
      setP((pp.data as unknown as PublicProvider) ?? null);
      setReviews((rv.data as Review[]) ?? []);
      setJobs(typeof jd.data === "number" ? jd.data : null);
    });
  }, [id, supabase]);

  useEffect(() => {
    if (me?.role !== "customer" || !id) return;
    supabase.from("favorites").select("provider_id").eq("customer_id", me.id).eq("provider_id", id).maybeSingle()
      .then(({ data }) => setFav(!!data));
  }, [me, id, supabase]);

  async function toggleFav() {
    if (!me || !id) return;
    if (fav) await supabase.from("favorites").delete().eq("customer_id", me.id).eq("provider_id", id);
    else await supabase.from("favorites").insert({ customer_id: me.id, provider_id: id });
    setFav(!fav);
  }

  async function reload() {
    if (!id) return;
    const { data } = await supabase.from("reviews").select("booking_id, customer_name, stars, body, reply, created_at").eq("provider_id", id).order("created_at", { ascending: false });
    setReviews((data as Review[]) ?? []);
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
  const isMe = me?.id === id;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-4xl">
          {p === undefined && <p className="text-muted">Loading…</p>}
          {p === null && (
            <Panel>
              <h1 className="text-2xl font-bold sm:text-3xl">Provider not found</h1>
              <p className="mt-2 text-muted">This profile may have been removed.</p>
              <Link href="/browse" className={`${primaryBtn} mt-5 inline-block`}>Browse services</Link>
            </Panel>
          )}
          {p && (
            <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
              <div className="space-y-6">
                <Panel>
                  <div className="flex flex-wrap items-start gap-5">
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sun text-2xl font-bold sm:text-3xl">
                      {p.profile.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-bold sm:text-3xl">{p.profile.name}</h1>
                        {p.status === "Verified" && <span className="rounded-full bg-palm px-3 py-1 text-sm font-semibold text-white">Verified</span>}
                      </div>
                      <p className="text-muted">{p.provider_type} in {p.profile.city}{p.experience ? `, ${p.experience}` : ""}</p>
                      <p className="mt-2"><Stars avg={avg} count={reviews.length} /></p>
                      {jobs !== null && <p className="mt-1 text-sm text-muted">{jobs} job{jobs === 1 ? "" : "s"} completed on Khidmah</p>}
                    </div>
                    {me?.role === "customer" && (
                      <button onClick={toggleFav} aria-pressed={fav}
                        className={`rounded-full border-2 px-4 py-2 font-semibold ${fav ? "border-palm bg-palm text-white" : "border-ink hover:bg-mist"}`}>
                        {fav ? "♥ Saved" : "♡ Save"}
                      </button>
                    )}
                  </div>
                  {p.about && <p className="mt-6 whitespace-pre-line leading-relaxed">{p.about}</p>}
                </Panel>

                <Panel>
                  <h2 className="text-xl font-bold">Reviews</h2>
                  {reviews.length === 0 && <p className="mt-3 text-muted">No reviews yet. Reviews appear after completed jobs.</p>}
                  <ul className="mt-4 space-y-5">
                    {reviews.map((r) => (
                      <li key={r.booking_id} className="border-b border-line pb-5 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold">{r.customer_name.split(" ")[0]}</p>
                          <p className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</p>
                        </div>
                        <p className="text-sun" aria-label={`${r.stars} out of 5`}>{"★".repeat(r.stars)}<span className="text-line">{"★".repeat(5 - r.stars)}</span></p>
                        {r.body && <p className="mt-1">{r.body}</p>}
                        {r.reply && <p className="mt-2 border-l-4 border-palm pl-3 text-[15px]"><span className="text-muted">Reply: </span>{r.reply}</p>}
                        {isMe && !r.reply && <ReplyBox bookingId={r.booking_id} onSaved={reload} />}
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>

              <aside className="space-y-6">
                <Panel>
                  {p.price_from != null && (
                    <p>
                      <span className="text-muted">{p.services.includes("rooms") ? "Rent from" : "Starting price"}</span><br />
                      <span className="text-2xl font-bold sm:text-3xl">SAR {p.price_from}</span>
                    </p>
                  )}
                  <h2 className="mt-5 font-semibold">Book a service</h2>
                  <ul className="mt-2 space-y-2">
                    {p.services.map((s) => {
                      const svc = findService(s);
                      if (!svc) return null;
                      return (
                        <li key={s}>
                          {p.available && !isMe ? (
                            <Link href={`/request?service=${s}&city=${p.profile.city}&provider=${p.user_id}`}
                              className="flex items-center gap-3 rounded-xl border-2 border-line p-3 hover:border-ink">
                              <span className="text-palm"><Icon name={s} className="h-6 w-6" /></span>
                              <span className="font-medium">{svc.name}</span>
                            </Link>
                          ) : (
                            <span className="flex items-center gap-3 rounded-xl border-2 border-line p-3 text-muted">
                              <Icon name={s} className="h-6 w-6" />{svc.name}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {!p.available && <p className="mt-3 text-sm text-muted">Not taking new jobs right now.</p>}
                </Panel>
                <Panel>
                  <dl className="space-y-3 text-[15px]">
                    <div><dt className="text-muted">Areas</dt><dd>{p.districts.length ? p.districts.join(", ") : `All of ${p.profile.city}`}</dd></div>
                    <div><dt className="text-muted">Working hours</dt><dd>{hoursText(p)}</dd></div>
                    <div><dt className="text-muted">Languages</dt><dd>{p.languages.join(", ")}</dd></div>
                  </dl>
                </Panel>
              </aside>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function ReplyBox({ bookingId, onSaved }: { bookingId: string; onSaved: () => void }) {
  const { supabase } = useMe();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  async function save() {
    const { error } = await supabase.from("reviews").update({ reply: text.trim() }).eq("booking_id", bookingId);
    if (error) return setMsg(error.message);
    onSaved();
  }
  return (
    <div className="mt-3">
      <textarea className={inputCls} rows={2} maxLength={1000} placeholder="Reply publicly to this review" value={text} onChange={(e) => setText(e.target.value)} />
      <button className={`${primaryBtn} mt-2 !py-2`} disabled={!text.trim()} onClick={save}>Post reply</button>
      {msg && <p className="mt-2 text-sm text-[#b42318]">{msg}</p>}
    </div>
  );
}
