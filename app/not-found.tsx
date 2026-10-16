import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-mist px-4 py-20">
        <div className="max-w-md text-center">
          <p className="font-display text-7xl font-extrabold text-sun">404</p>
          <h1 className="mt-4 font-display text-3xl font-bold">We couldn&apos;t find that page</h1>
          <p className="mt-2 text-muted">The link may be old or mistyped.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-full bg-ink px-6 py-3 font-semibold text-white hover:bg-palm-deep">Go home</Link>
            <Link href="/browse" className="rounded-full border-2 border-ink px-6 py-3 font-semibold hover:bg-paper">Browse services</Link>
          </div>
        </div>
      </main>
    </>
  );
}
