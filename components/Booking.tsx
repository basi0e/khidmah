"use client";

import { findService } from "@/lib/services";
import { Icon } from "./Icon";
import { StatusBadge } from "./ui";
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

export function statusTone(status: string): "green" | "sun" | "red" | "grey" | "solid" {
  if (status === "Requested") return "sun";
  if (status === "Completed") return "solid";
  if (status === "Declined" || status === "Cancelled") return "red";
  return "green";
}

export function StatusPill({ status }: { status: string }) {
  return <StatusBadge tone={statusTone(status)}>{status}</StatusBadge>;
}

export function Progress({ status, kind }: { status: string; kind: string }) {
  const flow = kind === "room" ? ROOM_FLOW : FLOW;
  const at = flow.indexOf(status);
  if (at < 0) return null;
  return (
    <div className="mt-4">
      <ol className="flex gap-1" aria-label={`Progress: ${status}`}>
        {flow.map((s, i) => (
          <li key={s} className={`h-[5px] flex-1 rounded-full ${i < at || (i === at && s === "Completed") ? "bg-palm" : i === at ? "bg-sun" : "bg-line"}`} />
        ))}
      </ol>
      <p className="mt-2 text-[13px] text-muted">
        Step {at + 1} of {flow.length}: <span className="font-semibold text-ink">{status}</span>
        {at < flow.length - 1 && <>, next {flow[at + 1].toLowerCase()}</>}
      </p>
    </div>
  );
}

export function BookingHeader({ b, who }: { b: BookingRow; who: string }) {
  const svc = findService(b.category);
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-palm-50 text-palm">
        <Icon name={svc?.slug ?? "ac"} className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[17px] font-bold leading-snug">{b.service}</h3>
          <StatusPill status={b.status} />
        </div>
        <p className="mt-0.5 text-[14px] text-muted">
          {dayLabel(b.visit_date)}, {b.visit_slot.replace(/\s*\(.*\)/, "")}. {b.district}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[14px] text-muted">
          <span>{who}</span>
          <span className="tabular-nums text-[12px]">{b.ref}</span>
          {b.urgent && <span className="rounded-full bg-[#b42318] px-2 py-0.5 text-[11px] font-bold text-white">Urgent</span>}
        </p>
      </div>
    </div>
  );
}

export function BillView({ bill, vatRegistered = false }: { bill: Bill; vatRegistered?: boolean }) {
  return (
    <div className="mt-4 rounded-xl bg-soft p-4">
      <p className="text-[15px] font-semibold">Bill</p>
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-y-1 text-[15px]">
        <dt className="text-muted">Labour</dt><dd className="tabular-nums">SAR {Number(bill.labour).toFixed(2)}</dd>
        <dt className="text-muted">Parts{bill.parts_note ? ` (${bill.parts_note})` : ""}</dt>
        <dd className="tabular-nums">SAR {Number(bill.parts).toFixed(2)}</dd>
        {(vatRegistered || Number(bill.vat_amount) > 0) && (
          <><dt className="text-muted">VAT</dt><dd className="tabular-nums">SAR {Number(bill.vat_amount ?? 0).toFixed(2)}</dd></>
        )}
        <dt className="mt-1 border-t border-line pt-2 font-semibold">Total, paid by {bill.paid_method}</dt>
        <dd className="mt-1 border-t border-line pt-2 text-lg font-bold tabular-nums">SAR {Number(bill.total ?? 0).toFixed(2)}</dd>
      </dl>
    </div>
  );
}
