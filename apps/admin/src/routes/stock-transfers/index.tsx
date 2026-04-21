import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { getStockTransfers, type StockTransferListItem } from "@/lib/api";
import {
  AdminPage,
  EmptyState,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { DataTable } from "@/components/data-table";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";

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
          <Link to="/stock-transfers/new">
            <Button>New Transfer</Button>
          </Link>
        }
        meta={
          <>
            <Badge variant="secondary">{filteredTransfers.length} in current view</Badge>
            <Badge variant="outline">
              {tab === "incoming" ? "Incoming verification" : "Outgoing dispatches"}
            </Badge>
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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
            <Button
              key={option.value}
              variant={tab === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(option.value as typeof tab)}
            >
              {option.label}
            </Button>
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
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="outline" size="sm">
              View
            </Button>
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
  const variantMap: Record<string, "secondary" | "outline" | "destructive"> = {
    draft: "outline",
    dispatched: "secondary",
    received: "secondary",
    partial: "secondary",
    cancelled: "destructive",
  };

  return (
    <Badge variant={variantMap[status] ?? "outline"} className="capitalize">
      {status}
    </Badge>
  );
}
