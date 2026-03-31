type Status = "pending" | "confirmed" | "declined" | "cancelled";

const styles: Record<Status, string> = {
  pending: "border-amber-200/80 bg-amber-50 text-amber-800",
  confirmed: "border-primary/12 bg-primary/10 text-primary",
  declined: "border-red-200/80 bg-red-50 text-red-700",
  cancelled: "border-slate-200/80 bg-slate-100/80 text-slate-600",
};

export function StatusBadge({ status }: { status: Status }) {
  const dot = {
    pending: "bg-amber-500",
    confirmed: "bg-primary",
    declined: "bg-red-500",
    cancelled: "bg-slate-400",
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {status}
    </span>
  );
}
