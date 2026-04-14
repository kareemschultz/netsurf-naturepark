import type { ReactNode, ChangeEventHandler, InputHTMLAttributes } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export function AdminPage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Page section (card-like surface) ────────────────────────────────────────

export function PageSection({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="relative">{children}</div>
    </Card>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {meta && (
          <div className="mt-2 flex flex-wrap gap-2">{meta}</div>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// ─── Stat / metric card ───────────────────────────────────────────────────────

export function MetricCard({
  label,
  value,
  note,
  tone = "green",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "green" | "amber" | "red" | "slate";
}) {
  const dotClass = {
    green: "bg-primary",
    amber: "bg-amber-500",
    red: "bg-red-500",
    slate: "bg-slate-400",
  }[tone];

  const valueClass = {
    green: "text-primary",
    amber: "text-amber-700 dark:text-amber-400",
    red: "text-red-700 dark:text-red-400",
    slate: "text-slate-700 dark:text-slate-300",
  }[tone];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", dotClass)} />
          <CardDescription className="text-[10px] font-bold tracking-[0.2em] uppercase">
            {label}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn("text-3xl font-bold tracking-tight tabular-nums sm:text-4xl", valueClass)}>
          {value}
        </p>
        {note && (
          <p className="mt-1 text-xs text-muted-foreground leading-5">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Section title ────────────────────────────────────────────────────────────

export function SectionTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

export function FilterChip({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Search field ─────────────────────────────────────────────────────────────

export function SearchField({
  value,
  onChange,
  placeholder,
  className,
  label = "Search",
  inputProps,
}: {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  className?: string;
  label?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "placeholder" | "className">;
}) {
  return (
    <label
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm shadow-sm",
        "focus-within:ring-2 focus-within:ring-ring",
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-muted-foreground"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
        {...inputProps}
      />
    </label>
  );
}

// ─── Info pill ────────────────────────────────────────────────────────────────

export function InfoPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const variantClass = {
    neutral: "border-border bg-muted text-muted-foreground",
    green: "border-primary/20 bg-primary/10 text-primary",
    amber: "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
    red: "border-red-200 bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        variantClass
      )}
    >
      {children}
    </span>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const emptyIcons = {
  bookings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  ),
  cart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  ),
  leaf: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  default: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
} as const;

export function EmptyState({
  title,
  description,
  action,
  variant = "default",
}: {
  title: string;
  description: string;
  action?: ReactNode;
  variant?: keyof typeof emptyIcons;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-sm">
        {emptyIcons[variant]}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Stat card alias ──────────────────────────────────────────────────────────
// Named StatCard as the spec calls it — thin alias over MetricCard
export const StatCard = MetricCard;

// Keep motionItemVariants exported for any files that still import it
export const motionItemVariants = {};
