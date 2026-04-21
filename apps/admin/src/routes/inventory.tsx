import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type ColumnDef } from "@tanstack/react-table";
import {
  adjustInventory,
  getInventory,
  getInventoryAlerts,
  getStockMovements,
  restockInventory,
  type InventoryAlert,
  type InventoryItem,
  type StockMovement,
} from "@/lib/api";
import {
  AdminPage,
  EmptyState,
  FilterChip,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SearchField,
  SectionTitle,
} from "@/components/AdminUI";
import { DataTable } from "@/components/data-table";
import { downloadCsv, exportPrintableReport } from "@/lib/export";
import { formatGYD } from "@workspace/shared";
import { buttonVariants } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { cn } from "@workspace/ui/lib/utils";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProduct, setActiveProduct] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const [restockNotes, setRestockNotes] = useState("");
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNotes, setAdjustNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [stockView, setStockView] = useState<"all" | "low" | "out">("all");

  async function loadData() {
    setLoading(true);
    try {
      const [inventoryResponse, alertRows, movementResponse] = await Promise.all([
        getInventory(),
        getInventoryAlerts(),
        getStockMovements({ limit: 25 }),
      ]);
      setItems(inventoryResponse.data);
      setAlerts(alertRows);
      setMovements(movementResponse.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.categoryName ?? "").toLowerCase().includes(query) ||
        (item.sku ?? "").toLowerCase().includes(query);
      if (!matchesSearch) return false;
      if (stockView === "low") return item.stockQty <= item.lowStockThreshold;
      if (stockView === "out") return item.stockQty === 0;
      return true;
    });
  }, [items, search, stockView]);

  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.stockQty, 0),
    [items]
  );
  const lowStockCount = useMemo(
    () => items.filter((item) => item.stockQty <= item.lowStockThreshold).length,
    [items]
  );
  const outOfStockCount = useMemo(
    () => items.filter((item) => item.stockQty === 0).length,
    [items]
  );
  const inventoryValue = useMemo(
    () => items.reduce((sum, item) => sum + item.stockQty * item.priceGyd, 0),
    [items]
  );

  async function handleRestock() {
    if (!activeProduct || restockQty <= 0) return;
    setSaving(true);
    try {
      await restockInventory({
        productId: activeProduct.id,
        quantity: restockQty,
        notes: restockNotes,
      });
      setActiveProduct(null);
      setRestockQty(0);
      setRestockNotes("");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleAdjust() {
    if (!activeProduct || adjustNotes.trim().length < 2) return;
    setSaving(true);
    try {
      await adjustInventory({
        productId: activeProduct.id,
        newQty: adjustQty,
        notes: adjustNotes,
      });
      setActiveProduct(null);
      setAdjustQty(0);
      setAdjustNotes("");
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  function handleSelectProduct(item: InventoryItem) {
    setActiveProduct(item);
    setRestockQty(0);
    setRestockNotes("");
    setAdjustQty(item.stockQty);
    setAdjustNotes("");
  }

  function handleExportInventory() {
    downloadCsv(
      `netsurf-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Product", "Category", "SKU", "Price (GYD)", "Stock Qty", "Threshold", "Status"],
      filteredItems.map((item) => [
        item.name,
        item.categoryName ?? "Uncategorized",
        item.sku ?? "",
        item.priceGyd,
        item.stockQty,
        item.lowStockThreshold,
        item.isActive ? "Active" : "Inactive",
      ])
    );
  }

  function handleExportInventoryPdf() {
    exportPrintableReport({
      title: "Inventory Snapshot",
      subtitle: "Current tracked stock levels, alerts, and most recent movement history.",
      generatedAt: new Date().toLocaleString(),
      metrics: [
        { label: "Tracked SKUs", value: String(items.length), note: `${filteredItems.length} in view` },
        { label: "On-Hand Units", value: String(totalUnits), note: formatGYD(inventoryValue) },
        { label: "Low-Stock Alerts", value: String(lowStockCount), note: `${outOfStockCount} fully out` },
      ],
      sections: [
        {
          title: "Inventory Board",
          columns: ["Product", "Category", "SKU", "Stock", "Threshold", "Value", "Status"],
          rows: filteredItems.map((item) => [
            item.name,
            item.categoryName ?? "Uncategorized",
            item.sku ?? item.slug,
            item.stockQty,
            item.lowStockThreshold,
            formatGYD(item.stockQty * item.priceGyd),
            item.isActive ? "Active" : "Inactive",
          ]),
        },
        {
          title: "Alerts",
          columns: ["Product", "Stock", "Threshold"],
          rows:
            alerts.length > 0
              ? alerts.map((alert) => [alert.name, alert.stockQty, alert.lowStockThreshold])
              : [["No active low-stock alerts", "", ""]],
        },
        {
          title: "Recent Movements",
          columns: ["Time", "Product", "Type", "Quantity", "Notes"],
          rows: movements.map((movement) => [
            new Date(movement.createdAt).toLocaleString(),
            movement.productName,
            movement.type,
            movement.quantityChange,
            movement.notes || "",
          ]),
        },
      ],
    });
  }

  return (
    <AdminPage className="max-w-[1500px]">
      <PageHeader
        eyebrow="Inventory"
        title="Stock health, movement control, and replenishment"
        description="Keep beverage stock accurate with a filtered inventory board, quick restock and recount workflows, and recent movement visibility for every tracked SKU."
        actions={
          <>
            <button
              type="button"
              onClick={handleExportInventory}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportInventoryPdf}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Export PDF
            </button>
          </>
        }
        meta={
          <>
            <Badge variant={alerts.length > 0 ? "default" : "secondary"}>
              {alerts.length > 0 ? `${alerts.length} active alerts` : "No urgent alerts"}
            </Badge>
            <Badge variant="outline">{filteredItems.length} items in view</Badge>
            <Badge variant="secondary">{formatGYD(inventoryValue)} shelf value</Badge>
          </>
        }
      />

      {alerts.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-400/20 dark:bg-amber-400/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-amber-800 uppercase dark:text-amber-300">
                Low-Stock Watch
              </p>
              <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
                {alerts.map((alert) => `${alert.name} (${alert.stockQty})`).join(", ")}
              </p>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-800 shrink-0">
              Restock soon
            </Badge>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tracked SKUs"
          value={String(items.length)}
          note="Products with inventory tracking"
        />
        <MetricCard
          label="On-Hand Units"
          value={String(totalUnits)}
          note="Across all tracked stock"
          tone="green"
        />
        <MetricCard
          label="Low Stock"
          value={String(lowStockCount)}
          note="At or below threshold"
          tone={lowStockCount > 0 ? "amber" : "green"}
        />
        <MetricCard
          label="Out of Stock"
          value={String(outOfStockCount)}
          note="Unavailable for sale"
          tone={outOfStockCount > 0 ? "red" : "slate"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_24rem]">
        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Stock Board"
            description="Filter the inventory board, inspect threshold pressure, and select any product for a stock action."
            action={
              search || stockView !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStockView("all");
                  }}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  Reset Filters
                </button>
              ) : null
            }
          />

          <div className="flex flex-wrap gap-2">
            <FilterChip type="button" active={stockView === "all"} onClick={() => setStockView("all")}>
              All Stock
            </FilterChip>
            <FilterChip type="button" active={stockView === "low"} onClick={() => setStockView("low")}>
              Low Stock
            </FilterChip>
            <FilterChip type="button" active={stockView === "out"} onClick={() => setStockView("out")}>
              Out of Stock
            </FilterChip>
          </div>

          <div className="mt-4">
            <SearchField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              label="Search inventory"
              placeholder="Search by product, category, or SKU…"
              inputProps={{ name: "inventory_search" }}
            />
          </div>

          {!loading && filteredItems.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No inventory items matched this view"
                description="Broaden the filter or clear the search to return to the full tracked stock board."
              />
            </div>
          ) : (
            <div className="mt-6">
              <InventoryTable
                items={filteredItems}
                isLoading={loading}
                onManage={handleSelectProduct}
              />
            </div>
          )}
        </PageSection>

        <div className="space-y-6">
          <PageSection className="p-6 sm:p-7">
            <SectionTitle
              title="Stock Actions"
              description={
                activeProduct
                  ? "Update the selected product with a restock or a counted adjustment."
                  : "Select a product from the stock board to start an action."
              }
            />

            {activeProduct ? (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="font-bold text-foreground">{activeProduct.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <InfoPill>{activeProduct.categoryName ?? "Uncategorized"}</InfoPill>
                    <InfoPill tone="green">{activeProduct.stockQty} on hand</InfoPill>
                    <InfoPill tone="amber">
                      Threshold {activeProduct.lowStockThreshold}
                    </InfoPill>
                  </div>
                </div>

                <div className="mt-5 space-y-5">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">Restock</p>
                    <div className="mt-3 space-y-3">
                      <FieldLabel label="Quantity to Add">
                        <Input
                          type="number"
                          min={1}
                          name="restock_quantity"
                          inputMode="numeric"
                          value={restockQty}
                          onChange={(event) => setRestockQty(Number(event.target.value))}
                          placeholder="0"
                        />
                      </FieldLabel>
                      <FieldLabel label="Restock Note">
                        <textarea
                          name="restock_notes"
                          rows={3}
                          value={restockNotes}
                          onChange={(event) => setRestockNotes(event.target.value)}
                          className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Optional receiving note…"
                        />
                      </FieldLabel>
                      <button
                        type="button"
                        onClick={handleRestock}
                        disabled={saving || restockQty <= 0}
                        className={cn(buttonVariants(), "w-full disabled:cursor-not-allowed disabled:opacity-50")}
                      >
                        {saving ? "Saving…" : "Restock Item"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm font-semibold text-foreground">Adjust to Count</p>
                    <div className="mt-3 space-y-3">
                      <FieldLabel label="New Counted Quantity">
                        <Input
                          type="number"
                          min={0}
                          name="adjust_quantity"
                          inputMode="numeric"
                          value={adjustQty}
                          onChange={(event) => setAdjustQty(Number(event.target.value))}
                          placeholder="0"
                        />
                      </FieldLabel>
                      <FieldLabel label="Adjustment Note">
                        <textarea
                          name="adjust_notes"
                          rows={3}
                          value={adjustNotes}
                          onChange={(event) => setAdjustNotes(event.target.value)}
                          className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Explain the recount or variance…"
                        />
                      </FieldLabel>
                      <button
                        type="button"
                        onClick={handleAdjust}
                        disabled={saving || adjustNotes.trim().length < 2}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full disabled:cursor-not-allowed disabled:opacity-50")}
                      >
                        {saving ? "Saving…" : "Adjust Stock"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="No product selected"
                description="Choose a line from the stock board to open the quick action panel."
              />
            )}
          </PageSection>

          <PageSection className="p-6 sm:p-7">
            <SectionTitle
              title="Recent Movements"
              description="The latest stock changes across restocks, adjustments, and sales."
            />

            <div className="space-y-3">
              {movements.length === 0 ? (
                <EmptyState
                  title="No movement history yet"
                  description="Inventory movement entries will appear here once stock changes begin."
                />
              ) : (
                movements.map((movement) => (
                  <div
                    key={movement.id}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {movement.productName}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={movement.quantityChange >= 0 ? "default" : "destructive"}
                        className="shrink-0 tabular-nums"
                      >
                        {movement.quantityChange > 0 ? "+" : ""}
                        {movement.quantityChange}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{movement.type.replaceAll("_", " ")}</Badge>
                      {movement.notes ? (
                        <Badge variant="outline">{movement.notes}</Badge>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </PageSection>
        </div>
      </div>
    </AdminPage>
  );
}

function InventoryTable({
  items,
  isLoading,
  onManage,
}: {
  items: InventoryItem[];
  isLoading: boolean;
  onManage: (item: InventoryItem) => void;
}) {
  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        id: "product",
        accessorFn: (row) => `${row.name} ${row.sku ?? row.slug}`,
        header: "Product",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {row.original.sku ?? row.original.slug}
            </p>
          </div>
        ),
      },
      {
        id: "category",
        accessorKey: "categoryName",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.categoryName ?? "Uncategorized"}
          </Badge>
        ),
      },
      {
        id: "stock",
        accessorKey: "stockQty",
        header: "Stock",
        cell: ({ row }) => {
          const { stockQty, lowStockThreshold } = row.original;
          const variant =
            stockQty === 0
              ? "destructive"
              : stockQty <= lowStockThreshold
                ? "outline"
                : "default";
          return (
            <Badge variant={variant} className="tabular-nums">
              {stockQty}
            </Badge>
          );
        },
      },
      {
        id: "threshold",
        accessorKey: "lowStockThreshold",
        header: "Threshold",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {row.original.lowStockThreshold}
          </span>
        ),
      },
      {
        id: "stockStatus",
        accessorFn: (row) => {
          if (row.stockQty === 0) return "Out";
          if (row.stockQty <= row.lowStockThreshold) return "Low";
          return "OK";
        },
        header: "Status",
        cell: ({ row }) => {
          const { stockQty, lowStockThreshold } = row.original;
          if (stockQty === 0) return <Badge variant="destructive">Out</Badge>;
          if (stockQty <= lowStockThreshold) return <Badge variant="outline" className="border-amber-300 text-amber-800">Low</Badge>;
          return <Badge variant="default">OK</Badge>;
        },
      },
      {
        id: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onManage(row.original);
            }}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Manage
          </button>
        ),
      },
    ],
    [onManage]
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      isLoading={isLoading}
      searchKey="product"
      searchPlaceholder="Search by product, category, or SKU…"
      pageSize={25}
    />
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
        {label}
      </Label>
      {children}
    </div>
  );
}
