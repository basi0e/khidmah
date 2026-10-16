"use client";

export const inputCls =
  "w-full min-h-12 rounded-xl border border-line-strong bg-paper px-4 py-3 text-[16px] text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-palm focus:ring-4 focus:ring-palm-50";
export const labelCls = "mb-1.5 block text-[15px] font-semibold text-ink";
export const primaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-palm px-6 font-semibold text-white transition-colors hover:bg-palm-deep disabled:cursor-not-allowed disabled:opacity-40";
export const ghostBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-paper px-6 font-semibold text-ink transition-colors hover:bg-soft";
export const dangerLink = "font-semibold text-[#b42318] underline-offset-2 hover:underline";

export function Chip({
  selected,
  onClick,
  children,
  role = "radio",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  role?: "radio" | "checkbox";
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-left text-[15px] font-medium transition-colors ${
        selected
          ? "border-palm bg-palm-50 text-palm-deep"
          : "border-line-strong bg-paper text-ink hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-paper p-5 shadow-card sm:p-7 ${className}`}>{children}</div>;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-xl bg-soft p-1">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={value === v}
          onClick={() => onChange(v)}
          className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-3 text-[15px] transition-colors ${
            value === v ? "bg-paper font-semibold text-ink shadow-[0_1px_3px_rgb(20_32_43/0.12)]" : "font-medium text-muted hover:text-ink"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ tone, children }: { tone: "green" | "sun" | "red" | "grey" | "solid"; children: React.ReactNode }) {
  const map = {
    green: "bg-palm-50 text-palm-deep",
    sun: "bg-sun-50 text-sun-ink",
    red: "bg-[#fdecea] text-[#9b1c13]",
    grey: "bg-soft text-muted",
    solid: "bg-palm text-white",
  } as const;
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[13px] font-semibold ${map[tone]}`}>{children}</span>;
}
