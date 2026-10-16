"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";
import { Bell } from "./Bell";

export function SiteHeader() {
  const [user, setUser] = useState<{ id: string; name: string; role: string | null } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      const id = session.user.id;
      setTimeout(async () => {
        const { data: profile } = await supabase.from("profiles").select("name, role").eq("id", id).maybeSingle();
        setUser({ id, name: profile?.name ?? "My account", role: profile?.role ?? null });
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const home =
    user?.role === "provider" ? "/provider" : user?.role === "customer" ? "/account" : user?.role === "admin" ? "/admin" : "/login";

  return (
    <header className="bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 text-[15px] font-medium text-muted sm:gap-5">
          <Link href="/browse" className="hidden hover:text-ink md:inline">Services</Link>
          <Link href="/#how" className="hidden hover:text-ink md:inline">How it works</Link>
          {user?.role !== "provider" && <Link href="/#providers" className="hidden hover:text-ink lg:inline">For providers</Link>}
          <Link href="/support" className="hidden hover:text-ink md:inline">Help</Link>
          {user && user.role && <Bell userId={user.id} />}
          {user && user.role && (
            <Link href="/settings" aria-label="Settings" className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-mist sm:flex">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-ink" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>
          )}
          <Link href={home} className="max-w-[10rem] truncate rounded-full border border-ink px-4 py-2 text-ink hover:bg-ink hover:text-white">
            {user ? user.name : "Log in"}
          </Link>
        </nav>
      </div>
      <div className="sadu" />
    </header>
  );
}
