import Link from "next/link";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Khidmah home">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
        <path d="M16 2 30 16 16 30 2 16z" fill="#0e6b57" />
        <path d="M16 9l7 7-7 7-7-7z" fill="#f2b33d" />
        <path d="M16 13.5l2.5 2.5-2.5 2.5-2.5-2.5z" fill={light ? "#1b2430" : "#ffffff"} />
      </svg>
      <span className={`font-display text-2xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Khidmah
      </span>
    </Link>
  );
}
