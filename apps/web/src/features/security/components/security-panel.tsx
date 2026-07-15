"use client";

import { DatabaseBackup, Loader2, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useSecurityOverview, useTriggerBackup } from "@/features/security/hooks/use-security";
import { formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const statusVariant: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  ok: "success",
  warning: "warning",
  error: "destructive",
  unknown: "outline",
};

export function SecurityPanel() {
  const { data, isLoading, isError, refetch } = useSecurityOverview();
  const backup = useTriggerBackup();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Security"
        description="Encryption, monitoring, backups, and audit activity for this workspace."
        actions={
          <Button onClick={() => backup.mutate()} disabled={backup.isPending}>
            {backup.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DatabaseBackup className="h-4 w-4" aria-hidden />
            )}
            Trigger backup
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          icon={ShieldAlert}
          title="Couldn’t load security status"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(data?.status ?? []).map((item) => (
              <div key={item.id} className={cn("border-border bg-card rounded-xl border p-4")}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-300" />
                    <h2 className="font-medium">{item.label}</h2>
                  </div>
                  <Badge variant={statusVariant[item.status] ?? "outline"}>{item.status}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">{item.detail}</p>
              </div>
            ))}
            {(data?.status ?? []).length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No status cards"
                description="Security status will appear when the API is available."
                className="sm:col-span-2 lg:col-span-4"
              />
            ) : null}
          </section>

          <section className="space-y-3">
            <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
              Audit log
            </h2>
            {(data?.auditLogs ?? []).length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No audit events"
                description="Security-relevant actions will show up here."
              />
            ) : (
              <div className="border-border rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data!.auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.actor}</TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell>{log.target ?? "—"}</TableCell>
                        <TableCell>{formatRelative(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
