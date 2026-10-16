"use client";

export const inputCls =
  "w-full rounded-xl border-2 border-line bg-paper px-4 py-3 text-ink outline-none focus:border-palm";
export const labelCls = "mb-1.5 block font-medium text-ink";
export const primaryBtn =
  "rounded-full bg-ink px-6 py-3.5 font-semibold text-white hover:bg-palm-deep disabled:cursor-not-allowed disabled:opacity-50";
export const ghostBtn = "rounded-full border-2 border-ink px-6 py-3 font-semibold text-ink hover:bg-mist";

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
      className={`rounded-xl border-2 px-4 py-2.5 text-left font-medium transition-colors ${
        selected
          ? "border-palm bg-palm text-white"
          : "border-line bg-paper text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_0_var(--color-ink)] sm:p-8">
      {children}
    </div>
  );
}
