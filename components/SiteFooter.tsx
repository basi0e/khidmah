import Link from "next/link";
import { Logo } from "./Logo";

const LINKS = [
  ["/browse", "Services"],
  ["/faq", "FAQ"],
  ["/support", "Contact support"],
  ["/about", "About"],
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="sadu" />
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div>
          <Logo light />
          <p className="mt-3 text-white/70">Home services in Riyadh and Dammam</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="text-white/80 hover:text-white">{label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
