import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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

        {loading ? (
          <div className="mt-6 rounded-[1.7rem] border border-dashed border-primary/14 bg-primary/4 px-6 py-12 text-center text-sm text-muted-foreground">
            Loading transfers…
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No transfers in this view"
              description="Create a new transfer when stock is being prepared in Georgetown, or return later when incoming verification is pending."
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {filteredTransfers.map((transfer) => (
              <Link
                key={transfer.id}
                to="/stock-transfers/$id"
                params={{ id: String(transfer.id) }}
                className="rounded-[1.7rem] border border-primary/10 bg-white/78 p-5 shadow-[0_18px_40px_rgb(22_36_12_/6%)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_24px_50px_rgb(22_36_12_/10%)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-black tracking-tight text-foreground">
                      {transfer.transferNumber}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {transfer.dispatchedBy}
                    </p>
                  </div>
                  <StatusPill status={transfer.status} />
                </div>

                <div className="mt-4 grid gap-3 rounded-[1.4rem] border border-primary/8 bg-primary/4 p-4 sm:grid-cols-3">
                  <TransferMeta label="Items" value={String(transfer.itemCount)} />
                  <TransferMeta
                    label="Units"
                    value={String(transfer.totalDispatchedQty)}
                  />
                  <TransferMeta
                    label="Updated"
                    value={new Date(
                      transfer.receivedAt ?? transfer.dispatchedAt ?? transfer.createdAt
                    ).toLocaleDateString()}
                  />
                </div>

                {transfer.notes ? (
                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {transfer.notes}
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    No dispatch notes recorded.
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </PageSection>
    </AdminPage>
  );
}

function TransferMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
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
