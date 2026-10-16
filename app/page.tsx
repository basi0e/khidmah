import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { RequestBuilder } from "@/components/RequestBuilder";
import { BookingTicket } from "@/components/BookingTicket";
import { Icon } from "@/components/Icon";
import { Logo } from "@/components/Logo";
import { SERVICES, ROOMS } from "@/lib/services";

const STEPS = [
  {
    title: "Tell us what needs fixing",
    text: "Pick the service, your district and a time that works. Add a photo or a note if it helps.",
  },
  {
    title: "Choose a verified technician",
    text: "Every provider is checked before they can take jobs. Compare starting prices, experience and reviews.",
  },
  {
    title: "Track the visit, pay after",
    text: "Follow the job from accepted to on the way to done. You see the bill for labour and parts before you pay.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:pt-20">
          <div>
            <h1 className="max-w-[17ch] font-display text-5xl font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              Verified technicians for every fix at home.
            </h1>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted">
              AC service, plumbing, electrical work and more in Riyadh and Dammam.
              No booking fees, for you or the technician.
            </p>
            <div className="mt-9">
              <RequestBuilder />
            </div>
          </div>
          <BookingTicket />
        </section>

        {/* Services */}
        <section id="services" className="bg-mist py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              What can we help with?
            </h2>
            <p className="mt-3 max-w-[56ch] text-lg text-muted">
              Choose a service to see technicians near you.
            </p>

            <div className="mt-10 grid grid-cols-1 overflow-hidden rounded-3xl border border-line bg-paper sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s) => (
                <Link
                  key={s.slug}
                  href={`/request?service=${s.slug}`}
                  className="group flex gap-4 border-b border-line p-6 hover:bg-mist sm:border-r sm:p-7"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mist text-palm group-hover:bg-palm group-hover:text-white">
                    <Icon name={s.slug} />
                  </span>
                  <span>
                    <span className="block font-display text-xl font-bold text-ink">{s.name}</span>
                    <span className="mt-1 block text-[15px] leading-snug text-muted">{s.jobs}</span>
                  </span>
                </Link>
              ))}
            </div>

            <Link
              href={`/request?service=${ROOMS.slug}`}
              className="mt-6 flex flex-col gap-5 rounded-3xl bg-ink p-7 text-white hover:bg-palm-deep sm:flex-row sm:items-center sm:p-9"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sun text-ink">
                <Icon name="rooms" className="h-8 w-8" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-2xl font-bold sm:text-3xl">
                  Looking for a room instead?
                </span>
                <span className="mt-1 block text-white/75">
                  Rooms and studios from verified landlords in Riyadh and Dammam.
                </span>
              </span>
              <span className="rounded-full bg-paper px-5 py-2.5 font-semibold text-ink">
                Browse rooms
              </span>
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">How it works</h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="border-t-4 border-ink pt-6">
                  <span className="font-display text-6xl font-extrabold text-sun">{i + 1}</span>
                  <h3 className="mt-3 font-display text-2xl font-bold">{step.title}</h3>
                  <p className="mt-2 max-w-[38ch] leading-relaxed text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Providers */}
        <section id="providers" className="bg-palm text-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-20 sm:px-6 md:grid-cols-[1.4fr_1fr] md:items-end">
            <div>
              <h2 className="max-w-[18ch] font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Fix things for a living? Get jobs near you.
              </h2>
              <p className="mt-4 max-w-[54ch] text-lg leading-relaxed text-white/85">
                Technicians, companies and room owners join for free. Set your services,
                districts and working hours, and accept the jobs that suit you.
              </p>
            </div>
            <div className="md:text-right">
              <Link
                href="/login"
                className="inline-block rounded-full bg-sun px-7 py-4 text-lg font-semibold text-ink hover:bg-white"
              >
                Join as a provider
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white">
        <div className="sadu" />
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Logo light />
          <p className="text-white/70">Serving Riyadh and Dammam</p>
        </div>
      </footer>
    </>
  );
}
