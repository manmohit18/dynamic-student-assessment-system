import * as React from "react";

import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-stone-200 bg-white px-4 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20",
        className,
      )}
      {...props}
    />
  );
}
