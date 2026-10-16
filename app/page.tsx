import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeTop } from "@/components/HomeTop";
import { BookingTicket } from "@/components/BookingTicket";
import { Illustration } from "@/components/Illustration";
import { Icon } from "@/components/Icon";
import { SERVICES, ROOMS } from "@/lib/services";

const STEPS = [
  {
    art: "step-request",
    title: "Tell us what needs fixing",
    text: "Pick the service, your district and a time. Add a note if it helps.",
  },
  {
    art: "step-pro",
    title: "Choose a verified technician",
    text: "Compare ratings, languages, experience and starting prices.",
  },
  {
    art: "step-bill",
    title: "Track the visit, pay after",
    text: "Follow every step and see the bill for labour and parts before you pay.",
  },
];

const SHORT: Record<string, string> = { ac: "AC", appliance: "Appliances", cleaning: "Cleaning", pest: "Pest control" };

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 pt-6 sm:px-6 sm:pt-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pb-16">
          <HomeTop />
          <div className="hidden lg:block">
            <BookingTicket />
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold sm:text-3xl">Services</h2>
            <Link href="/browse" className="text-[15px] font-semibold text-palm hover:text-palm-deep">See all</Link>
          </div>

          {/* Phones: compact icon grid */}
          <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 sm:hidden">
            {[...SERVICES.slice(0, 7), ROOMS].map((s) => (
              <li key={s.slug}>
                <Link href={`/browse?service=${s.slug}`} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-paper text-palm shadow-card">
                    <Icon name={s.slug} className="h-7 w-7" />
                  </span>
                  <span className="text-[13px] font-medium leading-tight">{SHORT[s.slug] ?? s.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Larger screens: illustrated cards */}
          <ul className="mt-6 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/browse?service=${s.slug}`} className="group flex h-full flex-col rounded-2xl bg-paper p-5 shadow-card transition-shadow hover:shadow-lift">
                  <Illustration name={s.slug} className="mx-auto h-32 w-full max-w-[15rem] transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none" />
                  <span className="mt-3 text-lg font-bold">{s.name}</span>
                  <span className="mt-0.5 text-[15px] text-muted">{s.jobs}</span>
                </Link>
              </li>
            ))}
          </ul>

          <Link href={`/browse?service=${ROOMS.slug}`}
            className="mt-4 flex items-center gap-4 rounded-2xl bg-paper p-4 shadow-card transition-shadow hover:shadow-lift sm:mt-6 sm:p-6">
            <Illustration name="rooms" className="h-20 w-28 shrink-0 sm:h-28 sm:w-40" />
            <span className="flex-1">
              <span className="block text-lg font-bold sm:text-2xl">Looking for a room?</span>
              <span className="mt-0.5 block text-[15px] text-muted">Rooms and studios from verified landlords.</span>
            </span>
            <span className="hidden min-h-11 items-center rounded-full bg-palm px-5 font-semibold text-white sm:inline-flex">Browse rooms</span>
          </Link>
        </section>

        {/* How it works */}
        <section id="how" className="bg-paper py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-xl font-bold sm:text-3xl">How it works</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3 md:gap-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex items-center gap-4 md:flex-col md:items-start">
                  <Illustration name={step.art} className="h-24 w-32 shrink-0 md:h-40 md:w-full md:max-w-[16rem]" />
                  <div>
                    <p className="text-[14px] font-semibold text-palm">Step {i + 1}</p>
                    <h3 className="mt-0.5 text-lg font-bold">{step.title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Providers */}
        <section id="providers" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid items-center gap-6 overflow-hidden rounded-3xl bg-palm p-6 text-white sm:p-10 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Fix things for a living? Get jobs near you.</h2>
              <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-white/85">
                Technicians, companies and room owners join for free. Choose your services, districts and hours,
                and accept the jobs that suit you.
              </p>
              <Link href="/login" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-sun px-6 font-semibold text-ink hover:bg-white">
                Join as a provider
              </Link>
            </div>
            <Illustration name="step-pro" className="hidden h-48 w-full md:block" />
          </div>
        </section>
      </main>
    </>
  );
}
