"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import {
  BarChart3,
  Calendar,
  CalendarDays,
  DollarSign,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Package,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  useGenerateReport,
  useReportTemplates,
  useReports,
} from "@/features/reports/hooks/use-reports";
import { useReportsStore } from "@/features/reports/stores/reports-store";
import { TEMPLATE_META, type ReportCategory } from "@/features/reports/types";
import { cn } from "@/lib/utils/cn";
import { formatRelative } from "@/lib/utils/format";

const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  Users,
  Megaphone,
  Package,
  LayoutDashboard,
  CalendarDays,
  Calendar,
  BarChart3,
};

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  };
}

export function ReportsStudio() {
  const selectedTemplateId = useReportsStore((s) => s.selectedTemplateId);
  const setSelectedTemplateId = useReportsStore((s) => s.setSelectedTemplateId);
  const activeReport = useReportsStore((s) => s.activeReport);
  const setActiveReport = useReportsStore((s) => s.setActiveReport);
  const generateDialogOpen = useReportsStore((s) => s.generateDialogOpen);
  const setGenerateDialogOpen = useReportsStore((s) => s.setGenerateDialogOpen);

  const range = defaultRange();
  const [periodStart, setPeriodStart] = useState(range.periodStart);
  const [periodEnd, setPeriodEnd] = useState(range.periodEnd);

  const { data: templates = [], isLoading: loadingTemplates } = useReportTemplates();
  const { data: reports = [], isLoading: loadingReports, isError, refetch } = useReports();
  const generate = useGenerateReport();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate financial, sales, HR, and executive reports for any period."
      />

      <section className="space-y-3">
        <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          Templates
        </h2>
        {loadingTemplates ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const meta =
                TEMPLATE_META[template.category as ReportCategory] ?? TEMPLATE_META.executive;
              const Icon = ICON_MAP[meta.icon] ?? BarChart3;
              return (
                <button
                  key={template.id}
                  type="button"
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    selectedTemplateId === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40",
                  )}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setGenerateDialogOpen(true);
                  }}
                >
                  <div
                    className={cn(
                      "bg-primary/10 mb-2 flex h-9 w-9 items-center justify-center rounded-lg",
                      meta.color,
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <h3 className="text-foreground font-medium">{template.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {template.description ?? meta.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            History
          </h2>
          {loadingReports ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <EmptyState
              icon={BarChart3}
              title="Couldn’t load reports"
              description="Try again shortly."
              actionLabel="Retry"
              onAction={() => void refetch()}
              className="py-10"
            />
          ) : reports.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No reports yet"
              description="Pick a template to generate your first report."
              className="py-10"
            />
          ) : (
            <ul className="space-y-2">
              {reports.map((item) => {
                const active = item.id === activeReport?.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                      )}
                      onClick={() => setActiveReport(item)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        <Badge
                          variant={
                            item.status === "ready"
                              ? "success"
                              : item.status === "failed"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {item.periodStart} → {item.periodEnd} · {formatRelative(item.createdAt)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Viewer
          </h2>
          {activeReport ? (
            <article className="border-border bg-card rounded-xl border p-4 md:p-6">
              <header className="border-border mb-4 border-b pb-4">
                <h3 className="font-display text-xl font-semibold">{activeReport.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {activeReport.periodStart} → {activeReport.periodEnd}
                </p>
              </header>
              <div className="markdown-body [&_blockquote]:border-primary/40 [&_blockquote]:text-muted-foreground [&_h2]:font-display [&_td]:border-border [&_th]:border-border space-y-3 text-sm [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-medium [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                  {activeReport.content ?? "_No content_"}
                </ReactMarkdown>
              </div>
            </article>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Select a report"
              description="Choose a report from history or generate a new one from a template."
              className="py-16"
            />
          )}
        </section>
      </div>

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate report</DialogTitle>
            <DialogDescription>Choose a report type and generation options.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedTemplateId) return;
              generate.mutate({
                templateId: selectedTemplateId,
                periodStart,
                periodEnd,
              });
            }}
          >
            <p className="text-muted-foreground text-sm">
              Template:{" "}
              <span className="text-foreground font-medium">
                {templates.find((t) => t.id === selectedTemplateId)?.name ?? selectedTemplateId}
              </span>
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="period-start">Period start</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period-end">Period end</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={generate.isPending || !selectedTemplateId || !periodStart || !periodEnd}
              >
                {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
