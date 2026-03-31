import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion";
import { cn } from "@workspace/ui/lib/utils";

const revealEase = [0.22, 1, 0.36, 1] as const;

const pageVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.52,
      ease: revealEase,
    },
  },
};

export function AdminPage({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "hidden"}
      animate={reduceMotion ? undefined : "show"}
      variants={reduceMotion ? undefined : pageVariants}
      className={cn("mx-auto max-w-7xl space-y-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8", className)}
    >
      {children}
    </motion.div>
  );
}

export function PageSection({
  className,
  children,
  ...props
}: HTMLMotionProps<"section">) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : undefined}
      variants={reduceMotion ? undefined : itemVariants}
      className={cn("admin-surface rounded-[1.9rem]", className)}
      {...props}
    >
      {children}
    </motion.section>
  );
}

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
    <PageSection className="admin-dotted p-6 sm:p-8">
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="admin-kicker mb-3">{eyebrow}</p> : null}
          <h1 className="text-balance text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
            {description}
          </p>
          {meta ? <div className="mt-5 flex flex-wrap gap-2">{meta}</div> : null}
        </div>

        {actions ? (
          <div className="relative z-10 flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </PageSection>
  );
}

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
  const toneMap = {
    green: {
      text: "text-primary",
      ring: "border-primary/12",
      glow: "rgb(45 80 22 / 20%)",
      dot: "bg-primary",
    },
    amber: {
      text: "text-amber-700",
      ring: "border-amber-200/80",
      glow: "rgb(196 148 26 / 24%)",
      dot: "bg-amber-500",
    },
    red: {
      text: "text-red-700",
      ring: "border-red-200/80",
      glow: "rgb(185 28 28 / 18%)",
      dot: "bg-red-500",
    },
    slate: {
      text: "text-slate-700",
      ring: "border-slate-200/80",
      glow: "rgb(71 85 105 / 16%)",
      dot: "bg-slate-500",
    },
  }[tone];

  return (
    <PageSection
      className={cn(
        "admin-metric-glow min-h-[10.5rem] border p-5 sm:p-6",
        toneMap.ring
      )}
      style={{ ["--metric-glow" as string]: toneMap.glow }}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", toneMap.dot)} />
          <p className="text-xs font-bold tracking-[0.22em] text-muted-foreground uppercase">
            {label}
          </p>
        </div>
      <div>
        <p
          className={cn(
            "text-3xl font-black tracking-tight tabular-nums sm:text-4xl",
            toneMap.text
          )}
        >
          {value}
        </p>
        {note ? <p className="mt-2 text-sm text-muted-foreground">{note}</p> : null}
        </div>
      </div>
    </PageSection>
  );
}

export function FilterChip({
  active,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform]",
        active
          ? "admin-button-primary shadow-none"
          : "admin-button-secondary text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

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
        "admin-input flex w-full items-center gap-3 rounded-[1.2rem] px-4 py-3.5",
        className
      )}
    >
      <span className="sr-only">{label}</span>
      <svg
        width="18"
        height="18"
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
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/80"
        {...inputProps}
      />
    </label>
  );
}

export function InfoPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const toneClass = {
    neutral: "border-primary/10 bg-white/70 text-primary/80",
    green: "border-primary/12 bg-primary/8 text-primary",
    amber: "border-amber-200/70 bg-amber-50 text-amber-800",
    red: "border-red-200/70 bg-red-50 text-red-700",
  }[tone];

  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", toneClass)}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.7rem] border border-dashed border-primary/16 bg-primary/4 p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-sm">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

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
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-black tracking-tight text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export const motionItemVariants = itemVariants;
