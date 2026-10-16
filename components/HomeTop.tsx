"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMe } from "@/lib/useMe";
import { ALL_SERVICES } from "@/lib/services";
import { Icon } from "./Icon";
import { UiIcon } from "./NavIcons";
import { BookingHeader, Progress, ACTIVE, type BookingRow } from "./Booking";

const EXTRA_WORDS: Record<string, string> = {
  ac: "air conditioner cooling aircon split window gas freon",
  plumbing: "water leak pipe drain toilet tap sink heater",
  electrical: "electric light socket power breaker wiring switch fan",
  cleaning: "clean maid deep sofa carpet",
  painting: "paint wall colour color",
  carpentry: "wood door furniture cabinet lock",
  appliance: "washing machine fridge refrigerator oven dishwasher",
  pest: "cockroach insects termite bed bugs rats mice",
  moving: "move movers shifting relocation boxes truck",
  rooms: "room rent studio bed space flat",
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function HomeTop() {
  const { me } = useMe();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hello, setHello] = useState("");

  useEffect(() => { setHello(greeting()); }, []);

  useEffect(() => {
    if (me?.role === "provider") router.replace("/provider");
    else if (me?.role === "admin") router.replace("/admin");
  }, [me, router]);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return ALL_SERVICES.filter((s) =>
      `${s.name} ${s.jobs} ${s.subs.join(" ")} ${EXTRA_WORDS[s.slug] ?? ""}`.toLowerCase().includes(t)
    ).slice(0, 5);
  }, [q]);

  function go(e: React.FormEvent) {
    e.preventDefault();
    router.push(matches[0] ? `/browse?service=${matches[0].slug}` : "/browse");
  }

  return (
    <div>
      <p className="text-[15px] text-muted">
        {me ? `${hello || "Hello"}, ${me.name.split(" ")[0]}` : "Riyadh and Dammam"}
      </p>
      <h1 className="mt-1 text-[30px] font-bold leading-[1.15] tracking-tight sm:text-5xl">What needs fixing today?</h1>
      <p className="mt-3 max-w-[46ch] text-[16px] text-muted sm:text-lg">
        Verified technicians for AC, plumbing, electrical and more. No booking fees.
      </p>

      <form onSubmit={go} role="search" className="relative mt-6">
        <label htmlFor="home-search" className="sr-only">Search services</label>
        <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-paper px-4 shadow-card focus-within:ring-4 focus-within:ring-palm-50">
          <UiIcon name="search" className="h-5 w-5 shrink-0 text-muted" />
          <input id="home-search" type="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search AC, plumbing, cleaning" className="min-w-0 flex-1 bg-transparent py-3 text-[16px] outline-none placeholder:text-muted/70" />
          <button type="submit" className="hidden min-h-10 rounded-xl bg-palm px-4 font-semibold text-white hover:bg-palm-deep sm:block">Search</button>
        </div>
        {matches.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-paper shadow-lift">
            {matches.map((s) => (
              <li key={s.slug}>
                <Link href={`/browse?service=${s.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-soft">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-palm-50 text-palm"><Icon name={s.slug} className="h-5 w-5" /></span>
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="block text-[13px] text-muted">{s.jobs}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </form>

      <Link href="/request?service=ac&when=today" className="mt-4 flex items-center gap-3 rounded-2xl bg-sun-50 p-4 hover:bg-[#fbecc4]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sun text-ink"><Icon name="ac" className="h-6 w-6" /></span>
        <span className="flex-1">
          <span className="block font-bold">AC not cooling?</span>
          <span className="block text-[14px] text-sun-ink">Get a technician today</span>
        </span>
        <UiIcon name="chevron" className="h-5 w-5 text-ink" />
      </Link>

      {me?.role === "customer" && <NextVisit userId={me.id} />}
    </div>
  );
}

function NextVisit({ userId }: { userId: string }) {
  const { supabase } = useMe();
  const [b, setB] = useState<(BookingRow & { provider: { name: string } | null }) | null>(null);

  useEffect(() => {
    supabase
      .from("bookings")
      .select("*, provider:profiles!bookings_provider_id_fkey(name)")
      .eq("customer_id", userId)
      .in("status", ACTIVE)
      .order("visit_date")
      .limit(1)
      .then(({ data }) => setB(((data ?? [])[0] as unknown as BookingRow & { provider: { name: string } | null }) ?? null));
  }, [supabase, userId]);

  if (!b) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold">Your next visit</h2>
      <Link href={`/booking?id=${b.id}`} className="block rounded-2xl bg-paper p-4 shadow-card hover:shadow-lift">
        <BookingHeader b={b} who={b.provider?.name ?? "Provider"} />
        <Progress status={b.status} kind={b.kind} />
      </Link>
    </section>
  );
}
