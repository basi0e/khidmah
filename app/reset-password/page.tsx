"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Panel, inputCls, labelCls, primaryBtn } from "@/components/ui";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  // The link in the reset email logs the person in for this one step
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setReady(!!session);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function save() {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setMessage(error.message);
    setDone(true);
  }

  const valid = password.length >= 8 && password === confirm;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-md">
          <Panel>
            {ready === null && <p className="text-muted">Checking your link…</p>}
            {ready === false && (
              <>
                <h1 className="text-2xl font-bold sm:text-3xl">This link has expired</h1>
                <p className="mt-2 text-muted">Request a new one from the login page with Forgot password.</p>
                <Link href="/login" className={`${primaryBtn} mt-5 inline-block`}>Back to log in</Link>
              </>
            )}
            {ready && !done && (
              <>
                <h1 className="text-2xl font-bold sm:text-3xl">Set a new password</h1>
                <label className={`${labelCls} mt-6`} htmlFor="pw">New password</label>
                <input id="pw" className={inputCls} type="password" autoComplete="new-password"
                  placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                <label className={`${labelCls} mt-4`} htmlFor="pw2">Repeat it</label>
                <input id="pw2" className={inputCls} type="password" autoComplete="new-password"
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {confirm && password !== confirm && <p className="mt-2 text-sm text-[#b42318]">The passwords don&apos;t match.</p>}
                <button className={`${primaryBtn} mt-5 w-full`} disabled={busy || !valid} onClick={save}>
                  {busy ? "Saving…" : "Save new password"}
                </button>
              </>
            )}
            {done && (
              <>
                <h1 className="text-2xl font-bold sm:text-3xl">Password saved</h1>
                <p className="mt-2 text-muted">You&apos;re logged in and can use the new password next time.</p>
                <Link href="/login" className={`${primaryBtn} mt-5 inline-block`}>Continue</Link>
              </>
            )}
            {message && <p className="mt-4 text-sm font-medium text-[#b42318]">{message}</p>}
          </Panel>
        </div>
      </main>
    </>
  );
}
