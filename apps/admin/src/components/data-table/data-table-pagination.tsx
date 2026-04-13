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
      {/* Left: rows info + page size */}
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
            className="admin-input h-7 rounded-[0.75rem] px-2 py-0.5 text-xs outline-none"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {Math.max(pageCount, 1)}
        </span>

        <button
          type="button"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="flex h-7 w-7 items-center justify-center rounded-[0.75rem] border border-primary/10 bg-white/72 text-xs font-semibold text-foreground transition-colors hover:bg-primary/4 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-black/20"
          aria-label="First page"
        >
          «
        </button>
        <button
          type="button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="flex h-7 w-7 items-center justify-center rounded-[0.75rem] border border-primary/10 bg-white/72 text-xs font-semibold text-foreground transition-colors hover:bg-primary/4 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-black/20"
          aria-label="Previous page"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="flex h-7 w-7 items-center justify-center rounded-[0.75rem] border border-primary/10 bg-white/72 text-xs font-semibold text-foreground transition-colors hover:bg-primary/4 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-black/20"
          aria-label="Next page"
        >
          ›
        </button>
        <button
          type="button"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
          className="flex h-7 w-7 items-center justify-center rounded-[0.75rem] border border-primary/10 bg-white/72 text-xs font-semibold text-foreground transition-colors hover:bg-primary/4 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-black/20"
          aria-label="Last page"
        >
          »
        </button>
      </div>
    </div>
  );
}
