import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "available" | "off" | "vacation" | "shift" | "pending" | "kitchen" | "service" | "admin";
}


const variantClasses: Record<string, string> = {
  default: "bg-[--muted] text-[--foreground]",
  available: "bg-emerald-100 text-emerald-800",
  off: "bg-red-100 text-red-800",
  vacation: "bg-amber-100 text-amber-800",
  shift: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  kitchen: "bg-violet-100 text-violet-800",
  service: "bg-cyan-100 text-cyan-800",
  admin: "bg-slate-200 text-slate-800",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
