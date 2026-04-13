import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { getStockTransfers, type StockTransferListItem } from "@/lib/api";
import {
  AdminPage,
  EmptyState,
  FilterChip,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { DataTable } from "@/components/data-table";

export const Route = createFileRoute("/stock-transfers/")({
  component: StockTransfersPage,
});

function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransferListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"outgoing" | "incoming">("outgoing");

  useEffect(() => {
    getStockTransfers({ limit: 100 })
      .then((response) => setTransfers(response.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredTransfers = useMemo(
    () =>
      transfers.filter((transfer) => {
        if (tab === "incoming") {
          return ["dispatched", "partial", "received"].includes(transfer.status);
        }
        return ["draft", "dispatched", "partial", "received"].includes(transfer.status);
      }),
    [tab, transfers]
  );

  const draftCount = transfers.filter((transfer) => transfer.status === "draft").length;
  const dispatchedCount = transfers.filter(
    (transfer) => transfer.status === "dispatched" || transfer.status === "partial"
  ).length;
  const receivedCount = transfers.filter((transfer) => transfer.status === "received").length;
  const unitsInMotion = transfers
    .filter((transfer) => ["draft", "dispatched", "partial"].includes(transfer.status))
    .reduce((sum, transfer) => sum + transfer.totalDispatchedQty, 0);

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Transfers"
        title="Dispatches between Georgetown and the park"
        description="Track stock leaving the city, verify what actually arrived on site, and keep transfer records tidy enough for follow-up and reconciliation."
        actions={
          <Link
            to="/stock-transfers/new"
            className="admin-button-primary rounded-full px-5 py-3 text-sm font-bold"
          >
            New Transfer
          </Link>
        }
        meta={
          <>
            <InfoPill tone="green">{filteredTransfers.length} in current view</InfoPill>
            <InfoPill>{tab === "incoming" ? "Incoming verification" : "Outgoing dispatches"}</InfoPill>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Drafts"
          value={String(draftCount)}
          note="Built but not yet dispatched"
          tone="slate"
        />
        <MetricCard
          label="In Motion"
          value={String(dispatchedCount)}
          note="Awaiting or mid-way through receipt"
          tone="amber"
        />
        <MetricCard
          label="Received"
          value={String(receivedCount)}
          note="Closed transfer records"
          tone="green"
        />
        <MetricCard
          label="Units in Motion"
          value={String(unitsInMotion)}
          note="Across draft and dispatched transfers"
          tone="red"
        />
      </div>

      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Transfer Board"
          description="Switch between outgoing dispatches and incoming verification work. Open any transfer to edit, dispatch, or receive it."
        />

        <div className="flex flex-wrap gap-2">
          {[
            { value: "outgoing", label: "Outgoing" },
            { value: "incoming", label: "Incoming" },
          ].map((option) => (
            <FilterChip
              key={option.value}
              type="button"
              active={tab === option.value}
              onClick={() => setTab(option.value as typeof tab)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>

        {!loading && filteredTransfers.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No transfers in this view"
              description="Create a new transfer when stock is being prepared in Georgetown, or return later when incoming verification is pending."
            />
          </div>
        ) : (
          <div className="mt-6">
            <TransfersTable transfers={filteredTransfers} isLoading={loading} />
          </div>
        )}
      </PageSection>
    </AdminPage>
  );
}

function TransfersTable({
  transfers,
  isLoading,
}: {
  transfers: StockTransferListItem[];
  isLoading: boolean;
}) {
  const columns = useMemo<ColumnDef<StockTransferListItem>[]>(
    () => [
      {
        id: "transferNumber",
        accessorKey: "transferNumber",
        header: "Transfer #",
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.transferNumber}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusPill status={row.original.status} />,
      },
      {
        id: "from",
        accessorKey: "dispatchedBy",
        header: "From",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.dispatchedBy}
          </span>
        ),
      },
      {
        id: "date",
        accessorKey: "createdAt",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {format(new Date(row.original.createdAt), "d MMM yyyy")}
          </span>
        ),
      },
      {
        id: "action",
        header: "Action",
        enableHiding: false,
        cell: ({ row }) => (
          <Link
            to="/stock-transfers/$id"
            params={{ id: String(row.original.id) }}
            className="admin-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            View
          </Link>
        ),
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={transfers}
      isLoading={isLoading}
      searchKey="transferNumber"
      searchPlaceholder="Search by transfer number…"
      pageSize={25}
    />
  );
}

function StatusPill({
  status,
}: {
  status: StockTransferListItem["status"];
}) {
  const tone = {
    draft: "bg-slate-100 text-slate-700",
    dispatched: "bg-amber-100 text-amber-700",
    received: "bg-emerald-100 text-emerald-700",
    partial: "bg-orange-100 text-orange-700",
    cancelled: "bg-red-100 text-red-700",
  }[status];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${tone}`}>
      {status}
    </span>
  );
}
