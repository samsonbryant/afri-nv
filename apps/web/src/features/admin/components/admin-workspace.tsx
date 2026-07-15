"use client";

import { Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminAiUsage,
  useAdminAuditLogs,
  useAdminOrganizations,
  useAdminPayments,
  useAdminSettings,
  useAdminSubscriptions,
  useAdminUsers,
} from "@/features/admin/hooks/use-admin";
import { useAdminStore } from "@/features/admin/stores/admin-store";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";

function matchesSearch(haystack: string, search: string) {
  if (!search.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

export function AdminWorkspace() {
  const { tab, setTab, search, setSearch } = useAdminStore();
  const users = useAdminUsers();
  const orgs = useAdminOrganizations();
  const subs = useAdminSubscriptions();
  const payments = useAdminPayments();
  const aiUsage = useAdminAiUsage();
  const audit = useAdminAuditLogs();
  const settings = useAdminSettings();

  const forbidden =
    (users.error instanceof ApiError && users.error.isForbidden) ||
    (orgs.error instanceof ApiError && orgs.error.isForbidden) ||
    (settings.error instanceof ApiError && settings.error.isForbidden);

  if (forbidden) {
    return (
      <div>
        <PageHeader title="Admin" description="Platform administration for staff operators." />
        <EmptyState
          icon={Shield}
          title="Staff access required"
          description="You don’t have permission to view platform admin tools."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Users, organizations, subscriptions, payments, and platform settings."
      />

      <div className="mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tables…"
          className="max-w-sm"
        />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminTable loading={users.isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users.data ?? [])
                .filter((u) => matchesSearch(`${u.fullName} ${u.email}`, search))
                .map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.isStaff ? "Yes" : "No"}</TableCell>
                    <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>{formatDate(u.createdAt, "PP")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </AdminTable>
        </TabsContent>

        <TabsContent value="organizations">
          <AdminTable loading={orgs.isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(orgs.data ?? [])
                .filter((o) => matchesSearch(`${o.name} ${o.slug} ${o.plan}`, search))
                .map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>{o.slug}</TableCell>
                    <TableCell>{o.plan}</TableCell>
                    <TableCell>{o.membersCount}</TableCell>
                    <TableCell>{formatDate(o.createdAt, "PP")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </AdminTable>
        </TabsContent>

        <TabsContent value="subscriptions">
          <AdminTable loading={subs.isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Period end</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(subs.data ?? [])
                .filter((s) => matchesSearch(`${s.organizationName} ${s.plan} ${s.status}`, search))
                .map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.organizationName}</TableCell>
                    <TableCell>{s.plan}</TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell>${s.mrr}</TableCell>
                    <TableCell>{formatDate(s.currentPeriodEnd, "PP")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </AdminTable>
        </TabsContent>

        <TabsContent value="payments">
          <AdminTable loading={payments.isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(payments.data ?? [])
                .filter((p) => matchesSearch(`${p.organizationName} ${p.status}`, search))
                .map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.organizationName}</TableCell>
                    <TableCell>
                      {p.currency} {p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell>{formatDate(p.createdAt, "PP")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </AdminTable>
        </TabsContent>

        <TabsContent value="ai-usage">
          <AdminTable loading={aiUsage.isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Requests</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(aiUsage.data ?? [])
                .filter((row) => matchesSearch(row.organizationName, search))
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.organizationName}</TableCell>
                    <TableCell>{row.tokens.toLocaleString()}</TableCell>
                    <TableCell>{row.requests.toLocaleString()}</TableCell>
                    <TableCell>${row.cost.toFixed(2)}</TableCell>
                    <TableCell>{row.period}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </AdminTable>
        </TabsContent>

        <TabsContent value="audit-logs">
          <AdminTable loading={audit.isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(audit.data ?? [])
                .filter((row) => matchesSearch(`${row.actor} ${row.action} ${row.target}`, search))
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.actor}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.target}</TableCell>
                    <TableCell>{row.ipAddress ?? "—"}</TableCell>
                    <TableCell>{formatDate(row.createdAt, "PPp")}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </AdminTable>
        </TabsContent>

        <TabsContent value="settings">
          {settings.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : settings.data ? (
            <dl className="border-border bg-card grid max-w-lg gap-4 rounded-xl border p-5 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Maintenance mode</dt>
                <dd className="mt-1 font-medium">{settings.data.maintenanceMode ? "On" : "Off"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">Signup enabled</dt>
                <dd className="mt-1 font-medium">{settings.data.signupEnabled ? "Yes" : "No"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs uppercase">Default plan</dt>
                <dd className="mt-1 font-medium">{settings.data.defaultPlan}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">Settings unavailable.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminTable({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) return <Skeleton className="mt-4 h-48 w-full" />;
  return (
    <div className="border-border bg-card mt-4 rounded-xl border">
      <Table>{children}</Table>
    </div>
  );
}
