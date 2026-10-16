"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Icon } from "@/components/Icon";
import { findService } from "@/lib/services";

const WHEN: Record<string, string> = {
  today: "today",
  week: "this week",
  flexible: "at any time",
};

export default function RequestPage() {
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);

  const service = findService(params?.get("service") ?? null);
  const city = params?.get("city") ?? "Riyadh";
  const when = WHEN[params?.get("when") ?? ""] ?? "at any time";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        {params && (
          <div className="rounded-3xl border-2 border-ink p-7 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-9">
            {service && (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mist text-palm">
                <Icon name={service.slug} className="h-8 w-8" />
              </span>
            )}
            <h1 className="mt-5 font-display text-3xl font-bold sm:text-4xl">
              {service ? service.name : "Your request"} in {city}, {when}
            </h1>
            <p className="mt-3 text-lg text-muted">
              Booking requests open soon. Log in now so your details are ready when they do.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-full bg-ink px-6 py-3 font-semibold text-white hover:bg-palm-deep">
                Log in
              </Link>
              <Link href="/" className="rounded-full border border-ink px-6 py-3 font-semibold hover:bg-mist">
                Back to services
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
