"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";
import { UiIcon, type IconName } from "./NavIcons";

type Tab = { href: string; label: string; icon: IconName; match: (p: string) => boolean };

const TABS: Record<string, Tab[]> = {
  customer: [
    { href: "/", label: "Home", icon: "home", match: (p) => p === "/" || p.startsWith("/browse") || p.startsWith("/pro") || p.startsWith("/request") },
    { href: "/account", label: "Bookings", icon: "calendar", match: (p) => p.startsWith("/account") },
    { href: "/messages", label: "Messages", icon: "chat", match: (p) => p.startsWith("/messages") || p.startsWith("/booking") },
    { href: "/settings", label: "Account", icon: "user", match: (p) => p.startsWith("/settings") || p.startsWith("/support") },
  ],
  provider: [
    { href: "/provider", label: "Jobs", icon: "briefcase", match: (p) => p.startsWith("/provider") },
    { href: "/messages", label: "Messages", icon: "chat", match: (p) => p.startsWith("/messages") || p.startsWith("/booking") },
    { href: "/browse", label: "Services", icon: "grid", match: (p) => p.startsWith("/browse") || p.startsWith("/pro") },
    { href: "/settings", label: "Account", icon: "user", match: (p) => p.startsWith("/settings") || p.startsWith("/support") },
  ],
  admin: [
    { href: "/admin", label: "Admin", icon: "shield", match: (p) => p.startsWith("/admin") },
    { href: "/browse", label: "Services", icon: "grid", match: (p) => p.startsWith("/browse") || p.startsWith("/pro") },
    { href: "/settings", label: "Account", icon: "user", match: (p) => p.startsWith("/settings") },
  ],
};

/** App-style tab bar on phones for logged-in people. */
export function BottomNav() {
  const { supabase, me } = useMe();
  const path = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!me || me.role === "admin") return;
    const count = () =>
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", me.id)
        .eq("is_read", false)
        .like("body", "New message%")
        .then(({ count }) => setUnread(count ?? 0));
    count();
    const ch = supabase
      .channel(`nav-${me.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` }, count)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me, supabase, path]);

  const tabs = me ? TABS[me.role] : null;
  // Focused flows (booking form, chat) have their own bottom bar
  if (!tabs || path.startsWith("/request") || path.startsWith("/booking")) return null;

  return (
    <>
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((t) => {
            const active = t.match(path);
            return (
              <li key={t.href + t.label}>
                <Link href={t.href} aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] ${active ? "font-semibold text-palm" : "font-medium text-muted"}`}>
                  <UiIcon name={t.icon} filled={active} />
                  {t.label}
                  {t.icon === "chat" && unread > 0 && (
                    <span className="absolute left-1/2 top-2 ml-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d92d20] px-1 text-[11px] font-bold text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
