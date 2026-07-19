"use client";

import { useState } from "react";
import { Building2, Plus, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  useAdminManualPayments,
  useAdminOrganizations,
  useAdminOverview,
  useAdminPayments,
  useAdminSettings,
  useAdminSubscriptions,
  useAdminUsers,
  useApproveManualPayment,
  useCreateAdminUser,
  useRejectManualPayment,
  useUpdateAdminSettings,
  useUpdateAdminUser,
} from "@/features/admin/hooks/use-admin";
import { useAdminStore } from "@/features/admin/stores/admin-store";
import type { AdminUser } from "@/features/admin/types";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/format";

function matchesSearch(haystack: string, search: string) {
  if (!search.trim()) return true;
  return haystack.toLowerCase().includes(search.trim().toLowerCase());
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-xs">{hint}</p> : null}
    </div>
  );
}

export function AdminWorkspace() {
  const { tab, setTab, search, setSearch } = useAdminStore();
  const overview = useAdminOverview();
  const users = useAdminUsers();
  const orgs = useAdminOrganizations();
  const subs = useAdminSubscriptions();
  const payments = useAdminPayments();
  const manualPayments = useAdminManualPayments();
  const approvePayment = useApproveManualPayment();
  const rejectPayment = useRejectManualPayment();
  const aiUsage = useAdminAiUsage();
  const audit = useAdminAuditLogs();
  const settings = useAdminSettings();
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const updateSettings = useUpdateAdminSettings();

  const [createOpen, setCreateOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    isStaff: false,
    isSuperuser: false,
  });

  const forbidden =
    (users.error instanceof ApiError && users.error.isForbidden) ||
    (orgs.error instanceof ApiError && orgs.error.isForbidden) ||
    (overview.error instanceof ApiError && overview.error.isForbidden);

  if (forbidden) {
    return (
      <div>
        <PageHeader title="Admin" description="Platform administration for staff operators." />
        <EmptyState
          icon={Shield}
          title="Staff access required"
          description="You don’t have permission to view platform admin tools. Sign in with a staff/superuser account created via createsuperuser."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Platform Admin"
        description="Monitor the system, manage users, and control platform settings."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create user
          </Button>
        }
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {overview.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Users"
                value={String(overview.data?.users ?? 0)}
                hint={`${overview.data?.staffUsers ?? 0} staff`}
              />
              <StatCard label="Organizations" value={String(overview.data?.organizations ?? 0)} />
              <StatCard
                label="Active subscriptions"
                value={String(overview.data?.activeSubscriptions ?? 0)}
                hint={`MRR $${((overview.data?.mrrCents ?? 0) / 100 || 0).toFixed(0)}`}
              />
              <StatCard
                label="AI tokens"
                value={(overview.data?.aiTokens ?? 0).toLocaleString()}
                hint={`Revenue $${((overview.data?.revenueCents ?? 0) / 100 || 0).toFixed(0)}`}
              />
            </div>
          )}
          <div className="border-border bg-card grid gap-3 rounded-xl border p-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Users className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div>
                <p className="font-medium">User operations</p>
                <p className="text-muted-foreground text-sm">
                  Create accounts, grant staff access, reset passwords, and deactivate users.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="text-muted-foreground mt-0.5 h-5 w-5" />
              <div>
                <p className="font-medium">Tenant monitoring</p>
                <p className="text-muted-foreground text-sm">
                  Review organizations, billing state, AI usage, and audit activity.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <AdminTable loading={users.isLoading}>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users.data ?? [])
                .filter((u) => matchesSearch(`${u.fullName} ${u.email}`, search))
                .map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell className="space-x-1">
                      {u.isSuperuser ? <Badge>Superuser</Badge> : null}
                      {u.isStaff ? <Badge variant="secondary">Staff</Badge> : null}
                      {!u.isStaff && !u.isSuperuser ? (
                        <span className="text-muted-foreground text-sm">User</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>{formatDate(u.createdAt, "PP")}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateUser.mutate({
                            id: u.id,
                            input: { isStaff: !u.isStaff },
                          })
                        }
                      >
                        {u.isStaff ? "Revoke staff" : "Make staff"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateUser.mutate({
                            id: u.id,
                            input: { isActive: !u.isActive },
                          })
                        }
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPasswordUser(u);
                          setNewPassword("");
                        }}
                      >
                        Set password
                      </Button>
                    </TableCell>
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
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="mb-3 font-semibold">Mobile money awaiting review</h3>
              <AdminTable loading={manualPayments.isLoading}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Txn ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(manualPayments.data ?? [])
                    .filter((p) =>
                      matchesSearch(
                        `${p.reference} ${p.organizationName} ${p.transactionId} ${p.payerPhone}`,
                        search,
                      ),
                    )
                    .map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.reference}</TableCell>
                        <TableCell>{p.organizationName}</TableCell>
                        <TableCell>{p.planName}</TableCell>
                        <TableCell>
                          {p.provider === "mtn_momo" ? "MTN MoMo" : "Orange Money"}
                        </TableCell>
                        <TableCell>
                          {p.currency.toUpperCase()} {(p.amountCents / 100).toLocaleString()}
                        </TableCell>
                        <TableCell>{p.transactionId || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "approved"
                                ? "success"
                                : p.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          {(p.status === "pending" || p.status === "submitted") && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => approvePayment.mutate(p.id)}
                                disabled={approvePayment.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  rejectPayment.mutate({
                                    id: p.id,
                                    reason: "Could not verify transfer",
                                  })
                                }
                                disabled={rejectPayment.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </AdminTable>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Payment events</h3>
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
                          {p.currency} {Number(p.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell>{formatDate(p.createdAt, "PP")}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </AdminTable>
            </div>
          </div>
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
            <div className="border-border bg-card max-w-lg space-y-5 rounded-xl border p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Maintenance mode</p>
                  <p className="text-muted-foreground text-sm">
                    Block non-staff access when enabled.
                  </p>
                </div>
                <Switch
                  checked={settings.data.maintenanceMode}
                  onCheckedChange={(checked) => updateSettings.mutate({ maintenanceMode: checked })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Public signup</p>
                  <p className="text-muted-foreground text-sm">Allow new users to self-register.</p>
                </div>
                <Switch
                  checked={settings.data.signupEnabled}
                  onCheckedChange={(checked) => updateSettings.mutate({ signupEnabled: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-plan">Default plan</Label>
                <Input
                  id="default-plan"
                  defaultValue={settings.data.defaultPlan}
                  onBlur={(e) => {
                    const value = e.target.value.trim();
                    if (value && value !== settings.data?.defaultPlan) {
                      updateSettings.mutate({ defaultPlan: value });
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Settings unavailable.</p>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-first">First name</Label>
                <Input
                  id="admin-first"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-last">Last name</Label>
                <Input
                  id="admin-last"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-staff">Staff access</Label>
              <Switch
                id="admin-staff"
                checked={form.isStaff}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isStaff: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-super">Superuser</Label>
              <Switch
                id="admin-super"
                checked={form.isSuperuser}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isSuperuser: checked, isStaff: checked || f.isStaff }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!form.email || form.password.length < 8 || createUser.isPending}
              onClick={() => {
                createUser.mutate(
                  {
                    email: form.email,
                    password: form.password,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    isStaff: form.isStaff,
                    isSuperuser: form.isSuperuser,
                  },
                  {
                    onSuccess: () => {
                      setCreateOpen(false);
                      setForm({
                        email: "",
                        password: "",
                        firstName: "",
                        lastName: "",
                        isStaff: false,
                        isSuperuser: false,
                      });
                      setTab("users");
                    },
                  },
                );
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(passwordUser)} onOpenChange={(open) => !open && setPasswordUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set password for {passwordUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="set-password">New password</Label>
            <Input
              id="set-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPasswordUser(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={newPassword.length < 8 || updateUser.isPending || !passwordUser}
              onClick={() => {
                if (!passwordUser) return;
                updateUser.mutate(
                  { id: passwordUser.id, input: { password: newPassword } },
                  {
                    onSuccess: () => {
                      setPasswordUser(null);
                      setNewPassword("");
                    },
                  },
                );
              }}
            >
              Save password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminTable({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) return <Skeleton className="mt-4 h-48 w-full" />;
  return (
    <div className="border-border bg-card mt-4 overflow-x-auto rounded-xl border">
      <Table>{children}</Table>
    </div>
  );
}
