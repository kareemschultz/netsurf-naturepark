import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getStockTransfers, type StockTransferListItem } from "@/lib/api";

export const Route = createFileRoute("/stock-transfers/")({
  component: StockTransfersPage,
});

function StockTransfersPage() {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<StockTransferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");

  useEffect(() => {
    getStockTransfers({ limit: 100 })
      .then((response) => setTransfers(response.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTransfers = transfers.filter((transfer) => {
    if (tab === "incoming") {
      return ["dispatched", "partial", "received"].includes(transfer.status);
    }
    return ["draft", "dispatched", "partial", "received"].includes(transfer.status);
  });

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-black">Stock Transfers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track Georgetown dispatches and park-side receipt verification.
          </p>
        </div>
        <Link
          to="/stock-transfers/new"
          className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#2D5016" }}
        >
          + New Transfer
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          { value: "outgoing", label: "Outgoing" },
          { value: "incoming", label: "Incoming" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setTab(option.value as typeof tab)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === option.value
                ? "text-white"
                : "bg-white text-muted-foreground hover:text-foreground"
            }`}
            style={tab === option.value ? { backgroundColor: "#2D5016" } : undefined}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            Loading transfers...
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No transfers in this view yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Transfer
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Dispatcher
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Items
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransfers.map((transfer) => (
                  <tr
                    key={transfer.id}
                    onClick={() =>
                      navigate({
                        to: "/stock-transfers/$id",
                        params: { id: String(transfer.id) },
                      })
                    }
                    className="cursor-pointer transition-colors hover:bg-muted/20"
                  >
                    <td className="px-5 py-4 font-semibold">{transfer.transferNumber}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {transfer.dispatchedBy}
                    </td>
                    <td className="px-5 py-4">
                      {transfer.itemCount} lines · {transfer.totalDispatchedQty} units
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={transfer.status} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(
                        transfer.receivedAt ?? transfer.dispatchedAt ?? transfer.createdAt
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: StockTransferListItem["status"];
}) {
  const styles = {
    draft: "bg-gray-100 text-gray-600",
    dispatched: "bg-amber-100 text-amber-700",
    received: "bg-green-100 text-green-700",
    partial: "bg-orange-100 text-orange-700",
    cancelled: "bg-red-100 text-red-700",
  } as const;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>
      {status}
    </span>
  );
}
