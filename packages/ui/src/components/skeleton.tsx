import { cn } from "@workspace/ui/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/8", className)}
      {...props}
    />
  );
}

export { Skeleton };
