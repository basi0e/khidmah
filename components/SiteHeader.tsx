"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "./Logo";

export function SiteHeader() {
  const [name, setName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setName(null);
        setRole(null);
        return;
      }
      const id = session.user.id;
      setTimeout(async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, role")
          .eq("id", id)
          .maybeSingle();
        setName(profile?.name ?? "My account");
        setRole(profile?.role ?? null);
      }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-6 text-[15px] font-medium text-muted">
          <a href="#services" className="hidden hover:text-ink md:inline">Services</a>
          <a href="#how" className="hidden hover:text-ink md:inline">How it works</a>
          <a href="#providers" className="hidden hover:text-ink md:inline">For providers</a>
          <Link
            href={role === "provider" ? "/provider" : role === "customer" ? "/account" : "/login"}
            className="rounded-full border border-ink px-4 py-2 text-ink hover:bg-ink hover:text-white"
          >
            {name ? name : "Log in"}
          </Link>
        </nav>
      </div>
      <div className="sadu" />
    </header>
  );
}
