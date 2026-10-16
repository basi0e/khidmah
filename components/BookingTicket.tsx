const STATUSES = ["Requested", "Accepted", "On the way", "In progress", "Completed"];
const CURRENT = 2;

export function BookingTicket() {
  return (
    <div className="relative rounded-3xl bg-palm-deep p-6 text-white sm:p-7">
      <p className="text-sm text-white/70">Example booking</p>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-bold">AC deep cleaning</p>
          <p className="mt-1 text-white/80">Al Malqa, Riyadh</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums">KH-1042</span>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sun font-display text-lg font-bold text-ink">
          FA
        </div>
        <div className="flex-1">
          <p className="font-semibold">Faisal A.</p>
          <p className="text-sm text-white/75">Verified technician, 8 years</p>
        </div>
        <p className="text-right text-sm text-white/75">Today<br />4 to 6 pm</p>
      </div>

      <ol className="mt-7 space-y-3.5" aria-label="Booking progress">
        {STATUSES.map((s, i) => {
          const cls = i < CURRENT ? "step-done" : i === CURRENT ? "step-now" : "";
          return (
            <li key={s} className="flex items-center gap-3">
              <span
                className={`h-3.5 w-3.5 shrink-0 rounded-full bg-white/20 ${cls}`}
                style={cls ? { animationDelay: `${300 + i * 350}ms` } : undefined}
              />
              <span className={i <= CURRENT ? "font-medium text-white" : "text-white/55"}>
                {s}
              </span>
              {i === CURRENT && (
                <span className="ml-auto text-sm text-sun">Arriving in 20 min</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
