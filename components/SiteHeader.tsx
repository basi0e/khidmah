"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Bell } from "./Bell";
import { useMe } from "@/lib/useMe";

export function homeFor(role: string | null | undefined) {
  return role === "provider" ? "/provider" : role === "customer" ? "/account" : role === "admin" ? "/admin" : "/login";
}

export function SiteHeader() {
  const { me } = useMe();
  const path = usePathname();

  const links = [
    ["/browse", "Services"],
    ["/#how", "How it works"],
    ...(me?.role === "provider" ? [] : [["/#providers", "For providers"]]),
    ["/support", "Help"],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Site">
          {links.map(([href, label]) => (
            <Link key={href} href={href}
              className={`hidden rounded-full px-3 py-2 text-[15px] font-medium md:inline-block ${path === href ? "bg-soft text-ink" : "text-muted hover:text-ink"}`}>
              {label}
            </Link>
          ))}
          {me && <Bell userId={me.id} />}
          {me === null && (
            <Link href="/login" className="ml-1 inline-flex min-h-11 items-center rounded-full bg-palm px-5 font-semibold text-white hover:bg-palm-deep">
              Log in
            </Link>
          )}
          {me && (
            <Link href={homeFor(me.role)} aria-label={`Your account, ${me.name}`}
              className="ml-1 inline-flex min-h-11 max-w-[12rem] items-center gap-2 rounded-full border border-line-strong p-1 font-semibold text-ink hover:bg-soft md:pr-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palm-50 text-[15px] font-bold text-palm-deep">
                {me.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden truncate md:inline">{me.name}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
