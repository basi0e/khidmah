"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Chip, Panel, inputCls, labelCls, primaryBtn } from "@/components/ui";
import { ALL_SERVICES, DISTRICTS, PROVIDER_TYPES } from "@/lib/services";

type Step = "loading" | "email" | "sent" | "profile" | "provider" | "done";

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [step, setStep] = useState<Step>("loading");
  const [next, setNext] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [role, setRole] = useState("customer");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // provider details
  const [ptype, setPtype] = useState(PROVIDER_TYPES[0]);
  const [services, setServices] = useState<string[]>([]);
  const [price, setPrice] = useState("100");
  const [experience, setExperience] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");

  useEffect(() => {
    setNext(safeNext(new URLSearchParams(window.location.search).get("next")));

    async function load(userId: string) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role, city")
        .eq("id", userId)
        .maybeSingle();
      if (!profile) return setStep("profile");
      setName(profile.name);
      setRole(profile.role);
      setCity(profile.city);
      if (profile.role === "provider") {
        const { data: pp } = await supabase
          .from("provider_profiles")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!pp) {
          setDistricts(DISTRICTS[profile.city] ?? []);
          return setStep("provider");
        }
      }
      setStep("done");
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const id = session.user.id;
        setTimeout(() => load(id), 0);
      } else {
        setStep((s) => (s === "loading" ? "email" : s));
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  // Send people back to what they were doing (e.g. a booking) once they're ready
  useEffect(() => {
    if (step === "done" && next) router.push(next);
  }, [step, next, router]);

  async function submitAuth() {
    setBusy(true);
    setMessage("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) {
        return setMessage(
          error.message === "Invalid login credentials"
            ? "Wrong email or password. New here? Choose Create account."
            : error.message
        );
      }
      return; // the login listener loads the profile
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (!data.session) {
      // Email confirmation is switched on in Supabase
      setStep("sent");
    }
  }

  async function forgotPassword() {
    if (!email.trim()) return setMessage("Enter your email first, then click Forgot password.");
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setMessage("");
    setStep("sent");
  }

  async function saveProfile() {
    setBusy(true);
    setMessage("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setBusy(false);
      setStep("email");
      return setMessage("Your login expired. Enter your email to get a new link.");
    }
    const { error } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, name: name.trim(), city, role });
    setBusy(false);
    if (error) return setMessage(error.message);
    if (role === "provider") {
      setDistricts(DISTRICTS[city] ?? []);
      setStep("provider");
    } else {
      setStep("done");
    }
  }

  async function saveProvider() {
    setBusy(true);
    setMessage("");
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setBusy(false);
      setStep("email");
      return setMessage("Your login expired. Enter your email to get a new link.");
    }
    const { error } = await supabase.from("provider_profiles").insert({
      user_id: data.user.id,
      provider_type: ptype,
      services,
      price_from: Number(price),
      experience: experience || null,
      districts,
      contact_phone: phone || null,
      about: about || null,
      vat_registered: ptype === "Company",
      status: "Pending verification",
    });
    setBusy(false);
    if (error) return setMessage(error.message);
    setStep("done");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setEmail("");
    setPassword("");
    setName("");
    setMessage("");
    setStep("email");
  }

  function toggle(list: string[], value: string, set: (v: string[]) => void) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  const canSubmit = /\S+@\S+\.\S+/.test(email.trim()) && password.length >= (mode === "signup" ? 8 : 1);

  const offerable = ALL_SERVICES.filter((s) =>
    ptype === "Landlord / room owner" ? s.slug === "rooms" : s.slug !== "rooms"
  );
  const providerReady = services.length > 0 && Number(price) >= 10 && districts.length > 0;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-mist px-4 py-14 sm:px-6">
        <div className={`mx-auto ${step === "provider" ? "max-w-2xl" : "max-w-md"}`}>
          <Panel>
            {step === "loading" && <p className="text-muted">Checking your login…</p>}

            {step === "email" && (
              <>
                <div className="flex gap-2" role="tablist">
                  {(["login", "signup"] as const).map((m) => (
                    <button key={m} role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setMessage(""); }}
                      className={`rounded-full px-5 py-2 font-semibold ${mode === m ? "bg-ink text-white" : "bg-mist text-ink"}`}>
                      {m === "login" ? "Log in" : "Create account"}
                    </button>
                  ))}
                </div>
                <h1 className="mt-6 font-display text-3xl font-bold">
                  {mode === "login" ? "Welcome back" : "Join Khidmah"}
                </h1>
                <label className={`${labelCls} mt-5`} htmlFor="email">Email</label>
                <input id="email" className={inputCls} type="email" autoComplete="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
                <label className={`${labelCls} mt-4`} htmlFor="password">Password</label>
                <input id="password" className={inputCls} type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder={mode === "signup" ? "At least 8 characters" : ""}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canSubmit && submitAuth()} />
                <button className={`${primaryBtn} mt-5 w-full`} disabled={busy || !canSubmit} onClick={submitAuth}>
                  {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
                </button>
                {mode === "login" && (
                  <button className="mt-4 text-sm text-muted underline hover:text-ink" onClick={forgotPassword}>
                    Forgot password?
                  </button>
                )}
              </>
            )}

            {step === "sent" && (
              <>
                <h1 className="font-display text-3xl font-bold">Check your email</h1>
                <p className="mt-3 text-ink">
                  We sent an email to <strong>{email}</strong>. Open the link in it to continue.
                </p>
                <p className="mt-2 text-muted">Not there after a minute? Check your spam folder.</p>
                <button className="mt-5 text-muted underline hover:text-ink" onClick={() => setStep("email")}>
                  Back to log in
                </button>
              </>
            )}

            {step === "profile" && (
              <>
                <h1 className="font-display text-3xl font-bold">Welcome to Khidmah</h1>
                <p className="mt-2 text-muted">A few details to set up your account.</p>
                <label className={`${labelCls} mt-6`} htmlFor="name">Your name</label>
                <input id="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                <p className={`${labelCls} mt-5`}>City</p>
                <div className="flex gap-2" role="radiogroup" aria-label="City">
                  {Object.keys(DISTRICTS).map((c) => (
                    <Chip key={c} selected={city === c} onClick={() => setCity(c)}>{c}</Chip>
                  ))}
                </div>
                <p className={`${labelCls} mt-5`}>I want to</p>
                <div className="grid gap-2" role="radiogroup" aria-label="Account type">
                  <Chip selected={role === "customer"} onClick={() => setRole("customer")}>Book services</Chip>
                  <Chip selected={role === "provider"} onClick={() => setRole("provider")}>Offer my services</Chip>
                </div>
                <button className={`${primaryBtn} mt-6 w-full`} disabled={busy || name.trim().length < 2} onClick={saveProfile}>
                  {busy ? "Saving…" : "Continue"}
                </button>
              </>
            )}

            {step === "provider" && (
              <>
                <h1 className="font-display text-3xl font-bold">Your provider profile</h1>
                <p className="mt-2 text-muted">Customers see this when choosing who to book.</p>

                <p className={`${labelCls} mt-6`}>I am</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Provider type">
                  {PROVIDER_TYPES.map((t) => (
                    <Chip key={t} selected={ptype === t} onClick={() => { setPtype(t); setServices([]); }}>{t}</Chip>
                  ))}
                </div>

                <p className={`${labelCls} mt-6`}>Services you offer</p>
                <div className="flex flex-wrap gap-2">
                  {offerable.map((s) => (
                    <Chip key={s.slug} role="checkbox" selected={services.includes(s.slug)}
                      onClick={() => toggle(services, s.slug, setServices)}>{s.name}</Chip>
                  ))}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={labelCls} htmlFor="price">
                      {ptype === "Landlord / room owner" ? "Monthly rent from (SAR)" : "Starting price (SAR)"}
                    </label>
                    <input id="price" className={inputCls} type="number" min={10} value={price}
                      onChange={(e) => setPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls} htmlFor="exp">Experience</label>
                    <input id="exp" className={inputCls} placeholder="e.g. 8 years" value={experience}
                      onChange={(e) => setExperience(e.target.value)} />
                  </div>
                </div>

                <p className={`${labelCls} mt-6`}>Districts you cover in {city}</p>
                <div className="flex flex-wrap gap-2">
                  {(DISTRICTS[city] ?? []).map((d) => (
                    <Chip key={d} role="checkbox" selected={districts.includes(d)}
                      onClick={() => toggle(districts, d, setDistricts)}>{d}</Chip>
                  ))}
                </div>

                <label className={`${labelCls} mt-6`} htmlFor="phone">Contact phone (shared after a customer books)</label>
                <input id="phone" className={inputCls} inputMode="tel" placeholder="05XXXXXXXX" value={phone}
                  onChange={(e) => setPhone(e.target.value)} />

                <label className={`${labelCls} mt-5`} htmlFor="about">About you (optional)</label>
                <textarea id="about" className={inputCls} rows={3} maxLength={600} value={about}
                  onChange={(e) => setAbout(e.target.value)} />

                <button className={`${primaryBtn} mt-6 w-full`} disabled={busy || !providerReady} onClick={saveProvider}>
                  {busy ? "Saving…" : "Create provider profile"}
                </button>
                <p className="mt-3 text-sm text-muted">
                  New profiles show as pending until we verify your documents. You can still receive requests meanwhile.
                </p>
              </>
            )}

            {step === "done" && (
              <>
                <h1 className="font-display text-3xl font-bold">You&apos;re logged in, {name}.</h1>
                <p className="mt-2 text-muted">
                  {role === "provider" ? "Booking requests will show up in your account." : role === "admin" ? "You have admin access." : "Ready to book a service."}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={role === "provider" ? "/provider" : role === "admin" ? "/admin" : "/account"} className={primaryBtn}>
                    {role === "provider" ? "Go to your jobs" : role === "admin" ? "Open admin" : "My bookings"}
                  </a>
                  <button className="rounded-full border-2 border-ink px-6 py-3 font-semibold hover:bg-mist" onClick={signOut}>
                    Log out
                  </button>
                </div>
              </>
            )}

            {message && <p className="mt-4 text-sm font-medium text-red-700">{message}</p>}
          </Panel>
        </div>
      </main>
    </>
  );
}
