"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip, Panel, inputCls, labelCls, primaryBtn, ghostBtn } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useMe, type Me } from "@/lib/useMe";
import { DISTRICTS, REQUIRED_DOCS } from "@/lib/services";

export default function SettingsPage() {
  const { supabase, me } = useMe();
  const router = useRouter();

  async function logOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl space-y-6">
          {me === undefined && <p className="text-muted">Loading…</p>}
          {me === null && (
            <Panel>
              <h1 className="text-2xl font-bold sm:text-3xl">Log in to see your settings</h1>
              <Link href="/login?next=/settings" className={`${primaryBtn} mt-5 inline-block`}>Log in</Link>
            </Panel>
          )}
          {me && (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h1 className="text-[26px] font-bold tracking-tight sm:text-4xl">Settings</h1>
                <button className={ghostBtn} onClick={logOut}>Log out</button>
              </div>
              <ProfileSection me={me} />
              <PasswordSection />
              {me.role === "customer" && <AddressesSection me={me} />}
              {me.role === "customer" && <FavouritesSection me={me} />}
              {me.role === "provider" && <DocumentsSection me={me} />}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function Status({ msg }: { msg: string }) {
  if (!msg) return null;
  const ok = msg.startsWith("✓");
  return <p className={`mt-3 text-sm font-medium ${ok ? "text-palm" : "text-[#b42318]"}`}>{msg}</p>;
}

function ProfileSection({ me }: { me: Me }) {
  const [supabase] = useState(() => createClient());
  const [name, setName] = useState(me.name);
  const [city, setCity] = useState(me.city);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, [supabase]);

  async function save() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update({ name: name.trim(), city }).eq("id", me.id);
    if (!error && me.role === "provider" && city !== me.city) {
      // Districts belong to a city, so reset them when a provider moves
      await supabase.from("provider_profiles").update({ districts: DISTRICTS[city] }).eq("user_id", me.id);
    }
    setBusy(false);
    setMsg(error ? error.message : "✓ Saved");
  }

  return (
    <Panel>
      <h2 className="text-xl font-bold">Your details</h2>
      <p className="mt-1 text-[15px] text-muted">Logged in as {email}</p>
      <label className={`${labelCls} mt-5`} htmlFor="name">Name</label>
      <input id="name" className={inputCls} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      {me.role !== "admin" && (
        <>
          <p className={`${labelCls} mt-5`}>City</p>
          <div className="flex gap-2" role="radiogroup" aria-label="City">
            {Object.keys(DISTRICTS).map((c) => <Chip key={c} selected={city === c} onClick={() => setCity(c)}>{c}</Chip>)}
          </div>
          {me.role === "provider" && city !== me.city && (
            <p className="mt-2 text-sm text-muted">Your districts will reset to all of {city}. You can narrow them on your jobs page.</p>
          )}
        </>
      )}
      <button className={`${primaryBtn} mt-6`} disabled={busy || name.trim().length < 2} onClick={save}>{busy ? "Saving…" : "Save"}</button>
      <Status msg={msg} />
    </Panel>
  );
}

function PasswordSection() {
  const [supabase] = useState(() => createClient());
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg(error.message);
    setPw("");
    setPw2("");
    setMsg("✓ Password changed");
  }

  return (
    <Panel>
      <h2 className="text-xl font-bold">Password</h2>
      <label className={`${labelCls} mt-5`} htmlFor="pw">New password</label>
      <input id="pw" className={inputCls} type="password" autoComplete="new-password" placeholder="At least 8 characters"
        value={pw} onChange={(e) => setPw(e.target.value)} />
      <label className={`${labelCls} mt-4`} htmlFor="pw2">Repeat it</label>
      <input id="pw2" className={inputCls} type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
      {pw2 && pw !== pw2 && <p className="mt-2 text-sm text-[#b42318]">The passwords don&apos;t match.</p>}
      <button className={`${primaryBtn} mt-6`} disabled={busy || pw.length < 8 || pw !== pw2} onClick={save}>Change password</button>
      <Status msg={msg} />
    </Panel>
  );
}

type Address = { id: string; label: string; district: string; detail: string };

function AddressesSection({ me }: { me: Me }) {
  const [supabase] = useState(() => createClient());
  const [list, setList] = useState<Address[] | null>(null);
  const [label, setLabel] = useState("Home");
  const [district, setDistrict] = useState(DISTRICTS[me.city]?.[0] ?? "");
  const [detail, setDetail] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("addresses").select("id, label, district, detail").eq("user_id", me.id).order("created_at");
    setList((data as Address[]) ?? []);
  }, [supabase, me.id]);

  useEffect(() => { load(); }, [load]);

  async function add() {
    setMsg("");
    const { error } = await supabase.from("addresses").insert({ user_id: me.id, label: label.trim() || "Home", district, detail: detail.trim() });
    if (error) return setMsg(error.message);
    setDetail("");
    load();
  }

  async function remove(id: string) {
    await supabase.from("addresses").delete().eq("id", id);
    load();
  }

  return (
    <Panel>
      <h2 className="text-xl font-bold">Saved addresses</h2>
      <p className="mt-1 text-[15px] text-muted">Pick these with one tap when you book.</p>
      <ul className="mt-4 space-y-2">
        {list?.length === 0 && <li className="text-muted">No saved addresses yet.</li>}
        {list?.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-mist p-3">
            <span><span className="font-semibold">{a.label}</span><br /><span className="text-[15px] text-muted">{a.district}, {a.detail}</span></span>
            <button className="text-sm font-semibold text-[#b42318] underline" onClick={() => remove(a.id)}>Remove</button>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label className={labelCls} htmlFor="alabel">Label</label>
          <input id="alabel" className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor="adist">District in {me.city}</label>
          <select id="adist" className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
            {(DISTRICTS[me.city] ?? []).map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <label className={`${labelCls} mt-3`} htmlFor="adetail">Building, street, apartment</label>
      <input id="adetail" className={inputCls} maxLength={200} value={detail} onChange={(e) => setDetail(e.target.value)} />
      <button className={`${primaryBtn} mt-4`} disabled={detail.trim().length < 3} onClick={add}>Add address</button>
      <Status msg={msg} />
    </Panel>
  );
}

function FavouritesSection({ me }: { me: Me }) {
  const [supabase] = useState(() => createClient());
  const [list, setList] = useState<{ provider_id: string; provider: { name: string } | null }[] | null>(null);

  useEffect(() => {
    supabase.from("favorites").select("provider_id, provider:profiles!favorites_provider_id_fkey(name)").eq("customer_id", me.id)
      .then(({ data }) => setList((data as unknown as { provider_id: string; provider: { name: string } | null }[]) ?? []));
  }, [supabase, me.id]);

  return (
    <Panel>
      <h2 className="text-xl font-bold">Saved providers</h2>
      {list?.length === 0 && <p className="mt-3 text-muted">Tap Save on a provider&apos;s profile to keep them here.</p>}
      <ul className="mt-4 flex flex-wrap gap-2">
        {list?.map((f) => (
          <li key={f.provider_id}>
            <Link href={`/pro?id=${f.provider_id}`} className="inline-block rounded-full border-2 border-line px-4 py-2 font-medium hover:border-ink">
              ♥ {f.provider?.name ?? "Provider"}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

type Doc = { id: string; doc_type: string; file_name: string; file_path: string; uploaded_at: string };

function DocumentsSection({ me }: { me: Me }) {
  const [supabase] = useState(() => createClient());
  const [ptype, setPtype] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [pp, d] = await Promise.all([
      supabase.from("provider_profiles").select("provider_type, status").eq("user_id", me.id).maybeSingle(),
      supabase.from("documents").select("id, doc_type, file_name, file_path, uploaded_at").eq("provider_id", me.id).order("uploaded_at"),
    ]);
    setPtype(pp.data?.provider_type ?? null);
    setStatus(pp.data?.status ?? "");
    setDocs((d.data as Doc[]) ?? []);
  }, [supabase, me.id]);

  useEffect(() => { load(); }, [load]);

  async function upload(docType: string, file: File) {
    if (file.size > 10 * 1024 * 1024) return setMsg("Files must be under 10 MB.");
    setBusy(docType);
    setMsg("");
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${me.id}/${Date.now()}_${safe}`;
    const up = await supabase.storage.from("provider-docs").upload(path, file);
    if (up.error) { setBusy(null); return setMsg(up.error.message); }
    const ins = await supabase.from("documents").insert({ provider_id: me.id, doc_type: docType, file_path: path, file_name: file.name });
    if (ins.error) { setBusy(null); return setMsg(ins.error.message); }
    if (status === "Pending verification" || status === "Rejected") {
      await supabase.from("provider_profiles").update({ status: "Under review" }).eq("user_id", me.id);
    }
    setBusy(null);
    setMsg("✓ Uploaded. We'll review it soon.");
    load();
  }

  async function remove(d: Doc) {
    await supabase.storage.from("provider-docs").remove([d.file_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    load();
  }

  if (!ptype) return null;
  const needed = REQUIRED_DOCS[ptype] ?? [];

  return (
    <Panel>
      <h2 className="text-xl font-bold">Verification documents</h2>
      <p className="mt-1 text-[15px] text-muted">
        Status: <span className="font-semibold text-ink">{status}</span>. Only Khidmah admins can see these files.
      </p>
      <ul className="mt-5 space-y-4">
        {needed.map(([type, required]) => {
          const mine = docs.filter((d) => d.doc_type === type);
          return (
            <li key={type} className="rounded-2xl border-2 border-line p-4">
              <p className="font-semibold">{type} {required ? <span className="text-sm text-[#b42318]">(required)</span> : <span className="text-sm text-muted">(optional)</span>}</p>
              {mine.map((d) => (
                <p key={d.id} className="mt-1 flex items-center justify-between gap-3 text-[15px]">
                  <span>✓ {d.file_name}</span>
                  <button className="text-sm font-semibold text-[#b42318] underline" onClick={() => remove(d)}>Remove</button>
                </p>
              ))}
              <label className="mt-3 inline-block cursor-pointer rounded-full border border-line-strong px-4 py-2 text-[15px] font-semibold hover:bg-mist">
                {busy === type ? "Uploading…" : mine.length ? "Upload another" : "Upload file"}
                <input type="file" accept="image/*,.pdf" className="sr-only" disabled={!!busy}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(type, f); e.target.value = ""; }} />
              </label>
            </li>
          );
        })}
      </ul>
      <Status msg={msg} />
    </Panel>
  );
}
