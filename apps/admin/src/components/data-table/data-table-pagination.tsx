import { type Table } from "@tanstack/react-table";
import { cn } from "@workspace/ui/lib/utils";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  className?: string;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  className,
  pageSizeOptions = [10, 25, 50, 100],
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const currentPage = pageIndex + 1;

  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {totalRows === 0
            ? "No results"
            : `Showing ${firstRow}–${lastRow} of ${totalRows}`}
        </span>

        <div className="flex items-center gap-1.5">
          <label
            htmlFor="dt-page-size"
            className="text-xs text-muted-foreground"
          >
            Rows:
          </label>
          <select
            id="dt-page-size"
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="h-7 rounded-md border border-input bg-background px-2 py-0.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {Math.max(pageCount, 1)}
        </span>

        {(["«", "‹", "›", "»"] as const).map((symbol, i) => {
          const disabled =
            i < 2 ? !table.getCanPreviousPage() : !table.getCanNextPage();
          const onClick = [
            () => table.setPageIndex(0),
            () => table.previousPage(),
            () => table.nextPage(),
            () => table.setPageIndex(pageCount - 1),
          ][i];
          const label = ["First page", "Previous page", "Next page", "Last page"][i];

          return (
            <button
              key={symbol}
              type="button"
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              {symbol}
            </button>
          );
        })}
      </div>
    </div>
  );
}
