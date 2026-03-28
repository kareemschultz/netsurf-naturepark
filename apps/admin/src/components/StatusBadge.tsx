type Status = "pending" | "confirmed" | "declined" | "cancelled";

const styles: Record<Status, string> = {
  pending:   "bg-amber-100 text-amber-800 border border-amber-200",
  confirmed: "bg-green-100 text-green-800 border border-green-200",
  declined:  "bg-red-100   text-red-800   border border-red-200",
  cancelled: "bg-gray-100  text-gray-600  border border-gray-200",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
