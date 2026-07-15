"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>");
  return ctx;
}

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

function Tabs({ value: controlled, defaultValue, onValueChange, children, className }: TabsProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const value = controlled ?? uncontrolled;

  const handleChange = React.useCallback(
    (next: string) => {
      if (controlled === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [controlled, onValueChange],
  );

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-10 items-center justify-start gap-1 rounded-lg p-1",
        className,
      )}
      {...props}
    />
  );
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
};

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const { value: active, onValueChange } = useTabsContext();
  const selected = active === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? "active" : "inactive"}
      className={cn(
        "ring-offset-background focus-visible:ring-ring inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        selected ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
        className,
      )}
      onClick={() => onValueChange(value)}
      {...props}
    />
  );
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string;
};

function TabsContent({ className, value, ...props }: TabsContentProps) {
  const { value: active } = useTabsContext();
  if (active !== value) return null;

  return (
    <div role="tabpanel" className={cn("mt-4 focus-visible:outline-none", className)} {...props} />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
