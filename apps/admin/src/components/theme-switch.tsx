import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { useTheme } from "@/context/theme-context";

// ─── Icons ───────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── ThemeSwitch ──────────────────────────────────────────────────────────────

export function ThemeSwitch() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const activeIcon =
    theme === "system" ? (
      <MonitorIcon />
    ) : resolvedTheme === "dark" ? (
      <MoonIcon />
    ) : (
      <SunIcon />
    );

  return (
    <DropdownMenuPrimitive.Root modal={false}>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Toggle theme"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          {activeIcon}
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Content
        align="end"
        sideOffset={6}
        className={cn(
          "z-50 min-w-[130px] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
        )}
      >
        {(
          [
            { value: "light", label: "Light", icon: <SunIcon /> },
            { value: "dark", label: "Dark", icon: <MoonIcon /> },
            { value: "system", label: "System", icon: <MonitorIcon /> },
          ] as const
        ).map(({ value, label, icon }) => (
          <DropdownMenuPrimitive.Item
            key={value}
            onSelect={() => setTheme(value)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none transition-colors",
              "hover:bg-accent focus:bg-accent",
              theme === value
                ? "text-[#2D5016] font-semibold dark:text-[#6ea836]"
                : "text-foreground"
            )}
          >
            {icon}
            {label}
            {theme === value && (
              <span className="ms-auto text-[#2D5016] dark:text-[#6ea836]">
                <CheckIcon />
              </span>
            )}
          </DropdownMenuPrimitive.Item>
        ))}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Root>
  );
}
