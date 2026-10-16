"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Step = "loading" | "email" | "sent" | "profile" | "done";

export default function LoginPage() {
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState<Step>("loading");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [role, setRole] = useState("customer");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadProfile(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        setName(profile.name);
        setStep("done");
      } else {
        setStep("profile");
      }
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userId = session.user.id;
        setTimeout(() => loadProfile(userId), 0);
      } else {
        setStep((s) => (s === "loading" ? "email" : s));
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function sendLink() {
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setStep("sent");
  }

  async function saveProfile() {
    setBusy(true);
    setMessage("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setBusy(false);
      setStep("email");
      return setMessage("Please log in again.");
    }
    const { error } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, name, city, role });
    setBusy(false);
    if (error) return setMessage(error.message);
    setStep("done");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEmail("");
    setName("");
    setMessage("");
    setStep("email");
  }

  const input = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black";
  const button = "w-full rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow">
        <h1 className="text-2xl font-bold text-emerald-700">Khidmah</h1>

        {step === "loading" && <p className="text-gray-600">Loading...</p>}

        {step === "email" && (
          <>
            <p className="text-gray-600">Enter your email to log in or sign up.</p>
            <input className={input} type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className={button} disabled={busy || !email} onClick={sendLink}>
              {busy ? "Sending..." : "Send login link"}
            </button>
          </>
        )}

        {step === "sent" && (
          <>
            <p className="text-gray-800">
              We sent a login link to <strong>{email}</strong>.
            </p>
            <p className="text-sm text-gray-600">
              Open it in this same browser. Check your spam folder if you don&apos;t see it.
            </p>
            <button className="text-sm text-gray-500 underline" onClick={() => setStep("email")}>
              Use a different email
            </button>
          </>
        )}

        {step === "profile" && (
          <>
            <p className="text-gray-600">Welcome! Tell us a bit about you.</p>
            <input className={input} placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)} />
            <select className={input} value={city} onChange={(e) => setCity(e.target.value)}>
              <option>Riyadh</option>
              <option>Dammam</option>
            </select>
            <select className={input} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="customer">I need services</option>
              <option value="provider">I provide services</option>
            </select>
            <button className={button} disabled={busy || !name} onClick={saveProfile}>
              {busy ? "Saving..." : "Continue"}
            </button>
          </>
        )}

        {step === "done" && (
          <>
            <p className="text-lg text-gray-800">You are logged in, {name}.</p>
            <button className={button} onClick={signOut}>Log out</button>
          </>
        )}

        {message && <p className="text-sm text-red-600">{message}</p>}
      </div>
    </main>
  );
}
