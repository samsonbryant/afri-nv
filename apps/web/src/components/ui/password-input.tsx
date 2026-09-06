"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export type PasswordInputProps = React.ComponentProps<"input"> & {
  toggleLabelShow?: string;
  toggleLabelHide?: string;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { className, toggleLabelShow = "Show password", toggleLabelHide = "Hide password", ...props },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? toggleLabelHide : toggleLabelShow}
          tabIndex={0}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
