import * as React from "react";

import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[color:rgba(31,41,55,0.14)] bg-[rgba(31,41,55,0.04)] px-3 py-1 text-xs font-medium text-[color:var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}
