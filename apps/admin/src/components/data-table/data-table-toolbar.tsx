import { type Table } from "@tanstack/react-table";
import { cn } from "@workspace/ui/lib/utils";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Filter...",
  className,
}: DataTableToolbarProps<TData>) {
  const rowCount = table.getFilteredRowModel().rows.length;
  const isFiltered =
    table.getState().columnFilters.length > 0 ||
    Boolean(table.getState().globalFilter);

  const searchValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
    : (table.getState().globalFilter ?? "");

  function handleSearchChange(value: string) {
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value);
    } else {
      table.setGlobalFilter(value);
    }
  }

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex flex-1 items-center gap-2">
        <input
          type="search"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="admin-input h-9 w-[200px] rounded-[1rem] px-3 py-2 text-sm outline-none lg:w-[280px]"
        />
        {isFiltered && (
          <button
            type="button"
            onClick={() => {
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:block">
          {rowCount} {rowCount === 1 ? "item" : "items"}
        </span>
        <ColumnVisibilityDropdown table={table} />
      </div>
    </div>
  );
}

function ColumnVisibilityDropdown<TData>({ table }: { table: Table<TData> }) {
  const hidableColumns = table
    .getAllColumns()
    .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide());

  if (hidableColumns.length === 0) return null;

  return (
    <div className="relative">
      <details className="group">
        <summary className="admin-button-secondary flex cursor-pointer list-none items-center gap-1.5 rounded-[1rem] px-3 py-2 text-xs font-semibold select-none">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
            />
          </svg>
          Columns
        </summary>
        <div className="absolute right-0 z-50 mt-1 min-w-[160px] rounded-[1.25rem] border border-primary/10 bg-white p-2 shadow-lg dark:bg-black/90">
          {hidableColumns.map((column) => (
            <label
              key={column.id}
              className="flex cursor-pointer items-center gap-2 rounded-[0.75rem] px-3 py-2 text-sm hover:bg-primary/4"
            >
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={(e) => column.toggleVisibility(e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              <span className="capitalize">{column.id}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
