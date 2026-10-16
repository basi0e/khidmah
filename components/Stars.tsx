export function Stars({ avg, count }: { avg: number; count: number }) {
  if (count === 0) return <span className="text-sm text-muted">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-sun" aria-hidden="true">★</span>
      <span className="font-semibold text-ink">{avg.toFixed(1)}</span>
      <span className="text-muted">({count} review{count === 1 ? "" : "s"})</span>
    </span>
  );
}
