import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-skeleton rounded-md bg-linear-to-r from-muted/70 via-muted to-muted/70 bg-[length:200%_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }
