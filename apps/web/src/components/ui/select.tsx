"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full appearance-none rounded-md border px-3 py-2 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {children}
        </select>
        <ChevronDown
          className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
