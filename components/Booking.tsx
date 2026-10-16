"use client";

import { findService } from "@/lib/services";
import { Icon } from "./Icon";
import { dayLabel } from "@/lib/useMe";

export type Bill = {
  labour: number;
  parts: number;
  parts_note: string | null;
  vat_amount: number | null;
  total: number | null;
  paid_method: string;
};

export type BookingRow = {
  id: string;
  ref: string;
  category: string;
  kind: string;
  service: string;
  city: string;
  district: string;
  address: string | null;
  note: string | null;
  visit_date: string;
  visit_slot: string;
  urgent: boolean;
  price_from: number | null;
  rent: number | null;
  pay_method: string;
  status: string;
  status_reason: string | null;
  created_at: string;
  provider_id: string;
  customer_id: string | null;
};

export const FLOW = ["Requested", "Accepted", "On the way", "In progress", "Completed"];
export const ROOM_FLOW = ["Requested", "Accepted", "Completed"];
export const ACTIVE = ["Requested", "Accepted", "On the way", "In progress"];

const PILL: Record<string, string> = {
  Requested: "bg-sun/25 text-ink",
  Accepted: "bg-palm/15 text-palm-deep",
  "On the way": "bg-palm/15 text-palm-deep",
  "In progress": "bg-palm/15 text-palm-deep",
  Completed: "bg-palm text-white",
  Declined: "bg-red-100 text-red-800",
  Cancelled: "bg-red-100 text-red-800",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${PILL[status] ?? "bg-mist"}`}>
      {status}
    </span>
  );
}

export function Progress({ status, kind }: { status: string; kind: string }) {
  const flow = kind === "room" ? ROOM_FLOW : FLOW;
  const at = flow.indexOf(status);
  if (at < 0) return null;
  return (
    <ol className="mt-5 flex items-center gap-1.5" aria-label="Booking progress">
      {flow.map((s, i) => (
        <li key={s} className="flex flex-1 flex-col gap-1.5">
          <span className={`h-1.5 rounded-full ${i <= at ? (i === at && s !== "Completed" ? "bg-sun" : "bg-palm") : "bg-line"}`} />
          <span className={`text-xs ${i <= at ? "font-semibold text-ink" : "text-muted"}`}>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function BookingHeader({ b, who }: { b: BookingRow; who: string }) {
  const svc = findService(b.category);
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mist text-palm">
        <Icon name={svc?.slug ?? "ac"} />
      </span>
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-xl font-bold">{b.service}</h3>
          {b.urgent && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">Urgent</span>}
        </div>
        <p className="text-[15px] text-muted">
          {who}, {b.district}, {b.city}
        </p>
        <p className="text-[15px] text-ink">
          {dayLabel(b.visit_date)}, {b.visit_slot}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusPill status={b.status} />
        <span className="text-xs tabular-nums text-muted">{b.ref}</span>
      </div>
    </div>
  );
}

export function BillView({ bill, vatRegistered = false }: { bill: Bill; vatRegistered?: boolean }) {
  return (
    <div className="mt-5 rounded-2xl bg-mist p-4">
      <p className="font-semibold">Bill</p>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-y-1 text-[15px]">
        <dt className="text-muted">Labour</dt><dd className="tabular-nums">SAR {Number(bill.labour).toFixed(2)}</dd>
        <dt className="text-muted">Parts{bill.parts_note ? ` (${bill.parts_note})` : ""}</dt>
        <dd className="tabular-nums">SAR {Number(bill.parts).toFixed(2)}</dd>
        {(vatRegistered || Number(bill.vat_amount) > 0) && (
          <><dt className="text-muted">VAT</dt><dd className="tabular-nums">SAR {Number(bill.vat_amount ?? 0).toFixed(2)}</dd></>
        )}
        <dt className="font-semibold">Total, paid by {bill.paid_method}</dt>
        <dd className="font-display text-lg font-bold tabular-nums">SAR {Number(bill.total ?? 0).toFixed(2)}</dd>
      </dl>
    </div>
  );
}
