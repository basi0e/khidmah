"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip, Panel, inputCls, primaryBtn, ghostBtn } from "@/components/ui";
import { ACTIVE, StatusPill, type BookingRow } from "@/components/Booking";
import { createClient } from "@/lib/supabase/client";
import { dayLabel, one, useMe } from "@/lib/useMe";
import { findService } from "@/lib/services";

type Tab = "providers" | "bookings" | "users" | "support";

type ProviderRow = {
  user_id: string;
  provider_type: string;
  services: string[];
  price_from: number;
  experience: string | null;
  about: string | null;
  districts: string[];
  available: boolean;
  status: string;
  reject_reason: string | null;
  contact_phone: string | null;
  updated_at: string;
  profile: { name: string; city: string; created_at: string } | null;
};

type AdminBooking = BookingRow & {
  customer_phone: string | null;
  customer: { name: string } | null;
  provider: { name: string } | null;
  bill: { total: number } | { total: number }[] | null;
};

type UserRow = { id: string; name: string; role: string; city: string; created_at: string };

type Ticket = {
  id: string;
  ref: string;
  subject: string;
  body: string;
  status: string;
  created_at: string;
  booking_id: string | null;
  user: { name: string } | null;
  replies: { id: number; body: string; created_at: string }[];
};

const STATUSES = ["Requested", "Accepted", "On the way", "In progress", "Completed", "Declined", "Cancelled"];

function when(ts: string) {
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminPage() {
  const { supabase, me } = useMe();
  const [tab, setTab] = useState<Tab>("providers");
  const [providers, setProviders] = useState<ProviderRow[] | null>(null);
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [p, b, u, t] = await Promise.all([
      supabase.from("provider_profiles").select("*, profile:profiles!inner(name, city, created_at)").order("updated_at", { ascending: false }),
      supabase
        .from("bookings")
        .select("*, customer:profiles!bookings_customer_id_fkey(name), provider:profiles!bookings_provider_id_fkey(name), bill:bills(total)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("profiles").select("id, name, role, city, created_at").order("created_at", { ascending: false }),
      supabase
        .from("tickets")
        .select("*, user:profiles!tickets_user_id_fkey(name), replies:ticket_replies(id, body, created_at)")
        .order("created_at", { ascending: false }),
    ]);
    const firstError = [p, b, u, t].find((r) => r.error)?.error;
    if (firstError) setError(firstError.message);
    setProviders((p.data as unknown as ProviderRow[]) ?? []);
    setBookings((b.data as unknown as AdminBooking[]) ?? []);
    setUsers((u.data as UserRow[]) ?? []);
    setTickets((t.data as unknown as Ticket[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    if (me?.role === "admin") load();
  }, [me, load]);

  const pending = providers?.filter((p) => p.status === "Pending verification" || p.status === "Under review") ?? [];
  const activeBookings = bookings?.filter((b) => ACTIVE.includes(b.status)) ?? [];
  const openTickets = tickets?.filter((t) => t.status === "Open") ?? [];

  const stats = [
    { label: "Users", value: users?.length ?? "–" },
    { label: "Providers waiting for review", value: providers ? pending.length : "–", alert: pending.length > 0 },
    { label: "Active bookings", value: bookings ? activeBookings.length : "–" },
    { label: "Completed jobs", value: bookings?.filter((b) => b.status === "Completed").length ?? "–" },
    { label: "Open support tickets", value: tickets ? openTickets.length : "–", alert: openTickets.length > 0 },
  ];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          {me === undefined && <p className="text-muted">Loading…</p>}
          {me === null && (
            <div className="mx-auto max-w-md">
              <Panel>
                <h1 className="text-2xl font-bold sm:text-3xl">Admin login</h1>
                <Link href="/login?next=/admin" className={`${primaryBtn} mt-5 inline-block`}>Log in</Link>
              </Panel>
            </div>
          )}
          {me && me.role !== "admin" && (
            <div className="mx-auto max-w-md">
              <Panel>
                <h1 className="text-2xl font-bold sm:text-3xl">Admins only</h1>
                <p className="mt-2 text-muted">This account doesn&apos;t have access to the admin page.</p>
                <Link href="/" className={`${primaryBtn} mt-5 inline-block`}>Back to home</Link>
              </Panel>
            </div>
          )}

          {me?.role === "admin" && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-[26px] font-bold tracking-tight sm:text-4xl">Khidmah admin</h1>
                  <p className="mt-1 text-muted">Logged in as {me.name}</p>
                </div>
                <button className={ghostBtn} onClick={load}>Refresh</button>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
                {stats.map((s) => (
                  <div key={s.label} className={`rounded-2xl p-4 ${s.alert ? "bg-sun/30" : "bg-paper"}`}>
                    <dt className="text-sm text-muted">{s.label}</dt>
                    <dd className="mt-1 text-2xl font-bold sm:text-3xl tabular-nums">{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-wrap gap-2" role="tablist">
                {([
                  ["providers", `Providers${pending.length ? ` (${pending.length} to review)` : ""}`],
                  ["bookings", "Bookings"],
                  ["users", "Users"],
                  ["support", `Support${openTickets.length ? ` (${openTickets.length})` : ""}`],
                ] as [Tab, string][]).map(([t, label]) => (
                  <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                    className={`rounded-full px-5 py-2 font-semibold ${tab === t ? "bg-ink text-white" : "bg-paper text-ink"}`}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-5">
                {tab === "providers" && <ProvidersTab rows={providers} onChange={load} />}
                {tab === "bookings" && <BookingsTab rows={bookings} onChange={load} />}
                {tab === "users" && <UsersTab rows={users} meId={me.id} onChange={load} />}
                {tab === "support" && <SupportTab rows={tickets} adminId={me.id} onChange={load} />}
              </div>
              {error && <p className="mt-4 font-medium text-[#b42318]">{error}</p>}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-2xl bg-paper shadow-card p-8 text-center text-muted">{text}</div>;
}

/* ---------- Providers ---------- */

function ProvidersTab({ rows, onChange }: { rows: ProviderRow[] | null; onChange: () => void }) {
  const [filter, setFilter] = useState("review");
  if (!rows) return <p className="text-muted">Loading providers…</p>;
  const shown = rows.filter((p) =>
    filter === "review" ? ["Pending verification", "Under review"].includes(p.status) :
    filter === "all" ? true : p.status === filter
  );
  return (
    <>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter providers">
        {[["review", "Needs review"], ["Verified", "Verified"], ["Rejected", "Rejected"], ["all", "All"]].map(([v, l]) => (
          <Chip key={v} selected={filter === v} onClick={() => setFilter(v)}>{l}</Chip>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {shown.length === 0 && <Empty text={filter === "review" ? "No providers waiting for review." : "No providers here."} />}
        {shown.map((p) => <ProviderCard key={p.user_id} p={p} onChange={onChange} />)}
      </div>
    </>
  );
}

function ProviderCard({ p, onChange }: { p: ProviderRow; onChange: () => void }) {
  const [supabase] = useState(() => createClient());
  const [docs, setDocs] = useState<{ id: string; doc_type: string; file_name: string; file_path: string }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function setStatus(status: string) {
    let reason: string | null = null;
    if (status === "Rejected") {
      reason = window.prompt("Reason for rejecting (the provider will see this):");
      if (reason === null) return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase
      .from("provider_profiles")
      .update({ status, reject_reason: status === "Rejected" ? reason : null })
      .eq("user_id", p.user_id);
    setBusy(false);
    if (error) return setMsg(error.message);
    onChange();
  }

  async function loadDocs() {
    const { data, error } = await supabase.from("documents").select("id, doc_type, file_name, file_path").eq("provider_id", p.user_id);
    if (error) return setMsg(error.message);
    setDocs(data ?? []);
  }

  async function openDoc(path: string) {
    const { data, error } = await supabase.storage.from("provider-docs").createSignedUrl(path, 300);
    if (error || !data) return setMsg(error?.message ?? "Couldn't open the file.");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const tone =
    p.status === "Verified" ? "bg-palm text-white" :
    p.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-sun/30 text-ink";

  return (
    <article className="rounded-2xl bg-paper shadow-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold">{p.profile?.name ?? "Unnamed provider"}</h3>
          <p className="text-[15px] text-muted">
            {p.provider_type}, {p.profile?.city}{p.experience ? `, ${p.experience}` : ""}. Joined {p.profile ? when(p.profile.created_at) : ""}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>{p.status}</span>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-1 text-[15px] sm:grid-cols-[auto_1fr]">
        <dt className="text-muted">Services</dt>
        <dd>{p.services.map((s) => findService(s)?.name ?? s).join(", ") || "None"}</dd>
        <dt className="text-muted">Price from</dt><dd>SAR {p.price_from}</dd>
        <dt className="text-muted">Districts</dt><dd>{p.districts.join(", ") || "None"}</dd>
        <dt className="text-muted">Phone</dt><dd>{p.contact_phone ?? "Not given"}</dd>
        <dt className="text-muted">Taking jobs</dt><dd>{p.available ? "Yes" : "No"}</dd>
        {p.about && (<><dt className="text-muted">About</dt><dd>{p.about}</dd></>)}
        {p.reject_reason && (<><dt className="text-muted">Rejected because</dt><dd className="text-red-800">{p.reject_reason}</dd></>)}
      </dl>

      <div className="mt-4">
        {docs === null ? (
          <button className="text-[15px] font-semibold text-palm underline" onClick={loadDocs}>Show documents</button>
        ) : docs.length === 0 ? (
          <p className="text-[15px] text-muted">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-1 text-[15px]">
            {docs.map((d) => (
              <li key={d.id}>
                {d.doc_type}:{" "}
                <button className="font-semibold text-palm underline" onClick={() => openDoc(d.file_path)}>{d.file_name}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {p.status !== "Verified" && <button className={primaryBtn} disabled={busy} onClick={() => setStatus("Verified")}>Approve</button>}
        {p.status === "Pending verification" && <button className={ghostBtn} disabled={busy} onClick={() => setStatus("Under review")}>Mark under review</button>}
        {p.status !== "Rejected" && (
          <button className="font-semibold text-[#b42318] underline" disabled={busy} onClick={() => setStatus("Rejected")}>
            {p.status === "Verified" ? "Revoke and reject" : "Reject"}
          </button>
        )}
      </div>
      {msg && <p className="mt-3 text-sm font-medium text-[#b42318]">{msg}</p>}
    </article>
  );
}

/* ---------- Bookings ---------- */

function BookingsTab({ rows, onChange }: { rows: AdminBooking[] | null; onChange: () => void }) {
  const [supabase] = useState(() => createClient());
  const [status, setStatus] = useState("all");
  const [city, setCity] = useState("all");
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (rows ?? []).filter((b) =>
      (status === "all" || (status === "active" ? ACTIVE.includes(b.status) : b.status === status)) &&
      (city === "all" || b.city === city) &&
      (!term ||
        b.ref.toLowerCase().includes(term) ||
        b.service.toLowerCase().includes(term) ||
        (b.customer?.name ?? "").toLowerCase().includes(term) ||
        (b.provider?.name ?? "").toLowerCase().includes(term))
    );
  }, [rows, status, city, q]);

  async function cancel(b: AdminBooking) {
    const reason = window.prompt(`Cancel ${b.ref}? Reason (both sides will see this):`);
    if (reason === null) return;
    const { error } = await supabase.rpc("set_booking_status", { p_booking: b.id, p_status: "Cancelled", p_reason: reason || "Cancelled by Khidmah support" });
    if (error) return setMsg(error.message);
    onChange();
  }

  if (!rows) return <p className="text-muted">Loading bookings…</p>;

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <input className={`${inputCls} lg:max-w-xs`} placeholder="Search ref, service or name" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={`${inputCls} lg:max-w-[12rem]`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={`${inputCls} lg:max-w-[10rem]`} value={city} onChange={(e) => setCity(e.target.value)} aria-label="City">
          <option value="all">Both cities</option>
          <option>Riyadh</option>
          <option>Dammam</option>
        </select>
        <p className="text-sm text-muted lg:ml-auto">{shown.length} of {rows.length}</p>
      </div>

      {shown.length === 0 ? (
        <div className="mt-4"><Empty text="No bookings match." /></div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-paper shadow-card">
          <table className="w-full min-w-[820px] text-left text-[15px]">
            <thead className="border-b border-line text-sm text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Booking</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Visit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Bill</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => {
                const bill = one(b.bill);
                return (
                  <tr key={b.id} className="border-b border-line last:border-0 align-top">
                    <td className="px-4 py-3">
                      <Link href={`/booking?id=${b.id}`} className="text-sm tabular-nums text-palm underline">{b.ref}</Link>
                      <br />{b.service}{b.urgent && <span className="ml-1 font-bold text-[#b42318]">urgent</span>}
                    </td>
                    <td className="px-4 py-3">{b.customer?.name ?? "Deleted"}<br /><span className="text-sm text-muted">{b.customer_phone ?? ""}</span></td>
                    <td className="px-4 py-3">{b.provider?.name ?? "Deleted"}</td>
                    <td className="px-4 py-3">{dayLabel(b.visit_date)}<br /><span className="text-sm text-muted">{b.district}, {b.city}</span></td>
                    <td className="px-4 py-3"><StatusPill status={b.status} />
                      {b.status_reason && <p className="mt-1 max-w-[14rem] text-sm text-muted">{b.status_reason}</p>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{bill ? `SAR ${Number(bill.total).toFixed(2)}` : "–"}</td>
                    <td className="px-4 py-3 text-right">
                      {ACTIVE.includes(b.status) && (
                        <button className="text-sm font-semibold text-[#b42318] underline" onClick={() => cancel(b)}>Cancel</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {msg && <p className="mt-3 text-sm font-medium text-[#b42318]">{msg}</p>}
    </>
  );
}

/* ---------- Users ---------- */

type Account = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  disabled: boolean;
  name: string | null;
  role: string | null;
  city: string | null;
};

function UsersTab({ rows, meId, onChange }: { rows: UserRow[] | null; meId: string; onChange: () => void }) {
  const [supabase] = useState(() => createClient());
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [role, setRole] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_list_accounts");
    if (error) {
      // The account tools haven't been added to the database yet: fall back to completed profiles
      setNeedsSetup(true);
      setAccounts(
        (rows ?? []).map((u) => ({
          id: u.id, email: "", created_at: u.created_at, last_sign_in_at: null, disabled: false,
          name: u.name, role: u.role, city: u.city,
        }))
      );
      return;
    }
    setNeedsSetup(false);
    setAccounts((data as Account[]) ?? []);
  }, [supabase, rows]);

  useEffect(() => { load(); }, [load]);

  async function toggleDisabled(a: Account) {
    const verb = a.disabled ? "Enable" : "Disable";
    if (!window.confirm(`${verb} ${a.email || a.name}?${a.disabled ? "" : " They won't be able to log in."}`)) return;
    setBusy(a.id);
    setMsg("");
    const { error } = await supabase.rpc("admin_set_disabled", { p_user: a.id, p_disabled: !a.disabled });
    setBusy(null);
    if (error) return setMsg(error.message);
    load();
    onChange();
  }

  async function remove(a: Account) {
    const label = a.email || a.name || "this account";
    const typed = window.prompt(
      `Delete ${label} permanently?\n\nTheir open bookings will be cancelled and they will need to sign up again. Past bookings stay in the records.\n\nType DELETE to confirm.`
    );
    if (typed !== "DELETE") return;
    setBusy(a.id);
    setMsg("");
    const { error } = await supabase.rpc("admin_delete_account", { p_user: a.id });
    setBusy(null);
    if (error) return setMsg(error.message);
    load();
    onChange();
  }

  if (!accounts) return <p className="text-muted">Loading accounts…</p>;
  const term = q.trim().toLowerCase();
  const shown = accounts.filter((u) =>
    (role === "all" || (role === "incomplete" ? !u.role : role === "disabled" ? u.disabled : u.role === role)) &&
    (!term || (u.name ?? "").toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
  );
  const incomplete = accounts.filter((u) => !u.role).length;

  return (
    <>
      {needsSetup && (
        <p className="mb-4 rounded-2xl bg-sun/30 px-4 py-3 text-[15px]">
          Showing completed profiles only. To see every account and disable or delete them, run the file{" "}
          <code className="rounded bg-paper px-1">supabase/003_admin_accounts.sql</code> in the Supabase SQL Editor.
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input className={`${inputCls} sm:max-w-xs`} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter accounts">
          {([
            ["all", "All"], ["customer", "Customers"], ["provider", "Providers"], ["admin", "Admins"],
            ...(needsSetup ? [] : [["incomplete", `Unfinished (${incomplete})`], ["disabled", "Disabled"]]),
          ] as [string, string][]).map(([v, l]) => (
            <Chip key={v} selected={role === v} onClick={() => setRole(v)}>{l}</Chip>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <div className="mt-4"><Empty text="No accounts match." /></div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-paper shadow-card">
          <table className="w-full min-w-[760px] text-left text-[15px]">
            <thead className="border-b border-line text-sm text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Last login</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className={`border-b border-line last:border-0 align-top ${u.disabled ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{u.name ?? <span className="text-muted">No name yet</span>}</span>
                    {u.email && <><br /><span className="text-sm text-muted">{u.email}</span></>}
                  </td>
                  <td className="px-4 py-3">
                    {u.role ? <span className="capitalize">{u.role}</span> : <span className="rounded-full bg-sun/30 px-2.5 py-0.5 text-sm">Unfinished sign-up</span>}
                    {u.disabled && <><br /><span className="text-sm font-semibold text-[#b42318]">Disabled</span></>}
                  </td>
                  <td className="px-4 py-3">{u.city ?? "–"}</td>
                  <td className="px-4 py-3">{when(u.created_at)}</td>
                  <td className="px-4 py-3">{u.last_sign_in_at ? when(u.last_sign_in_at) : "–"}</td>
                  <td className="px-4 py-3 text-right">
                    {!needsSetup && u.id !== meId && u.role !== "admin" && (
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <button className="text-sm font-semibold underline" disabled={busy === u.id} onClick={() => toggleDisabled(u)}>
                          {u.disabled ? "Enable" : "Disable"}
                        </button>
                        <button className="text-sm font-semibold text-[#b42318] underline" disabled={busy === u.id} onClick={() => remove(u)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {msg && <p className="mt-3 text-sm font-medium text-[#b42318]">{msg}</p>}
    </>
  );
}

/* ---------- Support ---------- */

function SupportTab({ rows, adminId, onChange }: { rows: Ticket[] | null; adminId: string; onChange: () => void }) {
  if (!rows) return <p className="text-muted">Loading tickets…</p>;
  if (rows.length === 0) return <Empty text="No support tickets yet." />;
  return (
    <div className="space-y-3">
      {rows.map((t) => <TicketCard key={t.id} t={t} adminId={adminId} onChange={onChange} />)}
    </div>
  );
}

function TicketCard({ t, adminId, onChange }: { t: Ticket; adminId: string; onChange: () => void }) {
  const [supabase] = useState(() => createClient());
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function send() {
    setBusy(true);
    const { error } = await supabase.from("ticket_replies").insert({ ticket_id: t.id, author_id: adminId, body: reply.trim() });
    setBusy(false);
    if (error) return setMsg(error.message);
    setReply("");
    onChange();
  }

  async function setStatus(status: string) {
    setBusy(true);
    const { error } = await supabase.from("tickets").update({ status }).eq("id", t.id);
    setBusy(false);
    if (error) return setMsg(error.message);
    onChange();
  }

  return (
    <article className="rounded-2xl bg-paper shadow-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold">{t.subject}</h3>
          <p className="text-sm text-muted">{t.ref}, from {t.user?.name ?? "deleted user"}, {when(t.created_at)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${t.status === "Open" ? "bg-sun/30" : "bg-mist text-muted"}`}>{t.status}</span>
      </div>
      <p className="mt-3 whitespace-pre-line text-[15px]">{t.body}</p>
      {t.replies.length > 0 && (
        <ul className="mt-4 space-y-2 border-l-4 border-palm pl-4">
          {[...t.replies].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((r) => (
            <li key={r.id} className="text-[15px]"><span className="text-sm text-muted">Khidmah: </span>{r.body}</li>
          ))}
        </ul>
      )}
      {t.status === "Open" && (
        <div className="mt-4">
          <textarea className={inputCls} rows={2} placeholder="Write a reply" value={reply} onChange={(e) => setReply(e.target.value)} />
          <div className="mt-3 flex flex-wrap gap-3">
            <button className={primaryBtn} disabled={busy || !reply.trim()} onClick={send}>Send reply</button>
            <button className={ghostBtn} disabled={busy} onClick={() => setStatus("Resolved")}>Mark resolved</button>
          </div>
        </div>
      )}
      {t.status === "Resolved" && (
        <button className="mt-4 text-sm font-semibold underline" disabled={busy} onClick={() => setStatus("Open")}>Reopen</button>
      )}
      {msg && <p className="mt-3 text-sm font-medium text-[#b42318]">{msg}</p>}
    </article>
  );
}
