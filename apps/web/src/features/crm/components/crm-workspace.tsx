"use client";

import React, { useState } from "react";
import {
  Building2,
  Users,
  UserPlus,
  Activity,
  Kanban,
  Plus,
  ArrowRightLeft,
  Sparkles,
  TrendingUp,
  Phone,
  Mail,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useCompanies,
  useCreateCompany,
  useContacts,
  useCreateContact,
  useLeads,
  useCreateLead,
  useConvertLead,
  usePipeline,
  useCreateOpportunity,
  useUpdateOpportunityStage,
  useActivities,
  useFollowUp,
} from "@/features/crm/hooks/use-crm";
import { useCrmStore } from "@/features/crm/stores/crm-store";
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  type PipelineStage,
  type Opportunity,
  type Company,
  type Contact,
  type Lead,
  type CrmActivity,
} from "@/features/crm/types";
import { formatDate, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STAGE_COLORS: Record<PipelineStage, string> = {
  lead: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  qualified: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  proposal: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-200",
  negotiation: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  won: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  lost: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const ACTIVITY_TYPE_ICONS: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Users,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Kanban card
function OpportunityCard({
  opportunity,
  onStageChange,
  isUpdating,
}: {
  opportunity: Opportunity;
  onStageChange: (id: string, stage: PipelineStage) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="border-border bg-card rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-foreground line-clamp-2 text-sm font-medium leading-tight">
          {opportunity.title}
        </p>
        <span className="shrink-0 text-sm font-semibold text-teal-700 dark:text-teal-300">
          {formatCurrency(opportunity.amount, opportunity.currency)}
        </span>
      </div>

      {opportunity.companyName && (
        <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
          <Building2 className="h-3 w-3" aria-hidden />
          {opportunity.companyName}
        </p>
      )}

      {opportunity.contactName && (
        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
          <Users className="h-3 w-3" aria-hidden />
          {opportunity.contactName}
        </p>
      )}

      {opportunity.closeDate && (
        <p className="text-muted-foreground mb-2 text-xs">
          Close: {formatDate(opportunity.closeDate)}
        </p>
      )}

      <div className="mt-2">
        <select
          aria-label="Change stage"
          value={opportunity.stage}
          disabled={isUpdating}
          onChange={(e) => onStageChange(opportunity.id, e.target.value as PipelineStage)}
          className="border-border bg-background text-foreground w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
        >
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Kanban column
function KanbanColumn({
  stage,
  label,
  opportunities,
  totalAmount,
  currency,
  onStageChange,
  isUpdating,
}: {
  stage: PipelineStage;
  label: string;
  opportunities: Opportunity[];
  totalAmount: number;
  currency: string;
  onStageChange: (id: string, stage: PipelineStage) => void;
  isUpdating: boolean;
}) {
  const colorClass = STAGE_COLORS[stage];

  return (
    <div className="border-border bg-muted/30 flex w-64 shrink-0 flex-col rounded-xl border">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", colorClass)}>
            {label}
          </span>
          <span className="text-muted-foreground text-xs">{opportunities.length}</span>
        </div>
        {totalAmount > 0 && (
          <span className="text-muted-foreground text-xs font-medium">
            {formatCurrency(totalAmount, currency)}
          </span>
        )}
      </div>

      <div
        className="flex flex-col gap-2 overflow-y-auto p-2"
        style={{ minHeight: "120px", maxHeight: "calc(100vh - 320px)" }}
      >
        {opportunities.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-xs">No opportunities</p>
        ) : (
          opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onStageChange={onStageChange}
              isUpdating={isUpdating}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Create Opportunity Dialog
function CreateOpportunityDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useCreateOpportunity();
  const [form, setForm] = useState({
    title: "",
    stage: "lead" as PipelineStage,
    amount: "",
    currency: "USD",
    close_date: "",
    description: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    mutate(
      {
        title: form.title,
        stage: form.stage,
        amount: parseFloat(form.amount) || 0,
        currency: form.currency,
        close_date: form.close_date || undefined,
        description: form.description || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            title: "",
            stage: "lead",
            amount: "",
            currency: "USD",
            close_date: "",
            description: "",
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="opp-title">Title *</Label>
            <Input
              id="opp-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Deal name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="opp-stage">Stage</Label>
              <Select
                id="opp-stage"
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as PipelineStage }))}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-amount">Amount</Label>
              <Input
                id="opp-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opp-close">Close Date</Label>
            <Input
              id="opp-close"
              type="date"
              value={form.close_date}
              onChange={(e) => setForm((f) => ({ ...f, close_date: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="opp-desc">Description</Label>
            <Textarea
              id="opp-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional notes"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !form.title.trim()}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Pipeline Tab
function PipelineTab() {
  const { data: pipeline, isLoading } = usePipeline();
  const { mutate: changeStage, isPending: isUpdating } = useUpdateOpportunityStage();
  const [createOpen, setCreateOpen] = useState(false);

  function handleStageChange(id: string, stage: PipelineStage) {
    changeStage({ id, stage });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {pipeline && (
            <span className="text-muted-foreground text-sm">
              {pipeline.totalCount} opportunities ·{" "}
              <span className="text-foreground font-medium">
                {formatCurrency(pipeline.totalAmount)}
              </span>{" "}
              pipeline
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add opportunity
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-64 shrink-0 rounded-xl" />
          ))}
        </div>
      ) : pipeline && pipeline.stages.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline.stages.map((col) => (
            <KanbanColumn
              key={col.stage}
              stage={col.stage}
              label={col.label}
              opportunities={col.opportunities}
              totalAmount={col.totalAmount}
              currency={col.currency}
              onStageChange={handleStageChange}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Kanban}
          title="Pipeline is empty"
          description="Add your first opportunity to start tracking deals through stages."
          actionLabel="Add opportunity"
          onAction={() => setCreateOpen(true)}
        />
      )}

      <CreateOpportunityDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

// Create Company Dialog
function CreateCompanyDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useCreateCompany();
  const [form, setForm] = useState({ name: "", domain: "", industry: "", website: "", phone: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    mutate(
      {
        name: form.name,
        domain: form.domain,
        industry: form.industry,
        website: form.website,
        phone: form.phone,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({ name: "", domain: "", industry: "", website: "", phone: "" });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Company</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="co-name">Company Name *</Label>
            <Input
              id="co-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Acme Corp"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="co-domain">Domain</Label>
              <Input
                id="co-domain"
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                placeholder="acme.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-industry">Industry</Label>
              <Input
                id="co-industry"
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                placeholder="Technology"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="co-website">Website</Label>
              <Input
                id="co-website"
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://acme.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="co-phone">Phone</Label>
              <Input
                id="co-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555-0100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !form.name.trim()}>
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Companies Tab
function CompaniesTab() {
  const { data: companies = [], isLoading } = useCompanies();
  const { companySearch, setCompanySearch } = useCrmStore();
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.domain.toLowerCase().includes(companySearch.toLowerCase()) ||
      c.industry.toLowerCase().includes(companySearch.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="Search companies…"
          value={companySearch}
          onChange={(e) => setCompanySearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add company
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add your first company to start building your CRM."
          actionLabel="Add company"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="border-border rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateCompanyDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CompanyRow({ company }: { company: Company }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{company.name}</TableCell>
      <TableCell className="text-muted-foreground">{company.domain || "—"}</TableCell>
      <TableCell>{company.industry || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{company.size || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{company.phone || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(company.createdAt)}</TableCell>
    </TableRow>
  );
}

// Create Contact Dialog
function CreateContactDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useCreateContact();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    title: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) return;
    mutate(
      {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        title: form.title,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({ first_name: "", last_name: "", email: "", phone: "", title: "" });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ct-first">First Name *</Label>
              <Input
                id="ct-first"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="Alice"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-last">Last Name</Label>
              <Input
                id="ct-last"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Johnson"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ct-email">Email *</Label>
            <Input
              id="ct-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="alice@company.com"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ct-phone">Phone</Label>
              <Input
                id="ct-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+1 555-0100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ct-title">Title</Label>
              <Input
                id="ct-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="VP Sales"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.first_name.trim() || !form.email.trim()}
            >
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Contacts Tab
function ContactsTab() {
  const { data: contacts = [], isLoading } = useContacts();
  const { contactSearch, setContactSearch } = useCrmStore();
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = contacts.filter((c) => {
    const q = contactSearch.toLowerCase();
    return (
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.companyName.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="Search contacts…"
          value={contactSearch}
          onChange={(e) => setContactSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add contact
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add contacts to keep track of your key people."
          actionLabel="Add contact"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="border-border rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <ContactRow key={contact.id} contact={contact} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateContactDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {contact.firstName} {contact.lastName}
      </TableCell>
      <TableCell className="text-muted-foreground">{contact.email}</TableCell>
      <TableCell className="text-muted-foreground">{contact.phone || "—"}</TableCell>
      <TableCell>{contact.title || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{contact.companyName || "—"}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(contact.createdAt)}</TableCell>
    </TableRow>
  );
}

// Create Lead Dialog
function CreateLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useCreateLead();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    notes: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.email.trim()) return;
    mutate(
      { ...form },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            company: "",
            source: "",
            notes: "",
          });
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ld-first">First Name *</Label>
              <Input
                id="ld-first"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                placeholder="Dave"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-last">Last Name</Label>
              <Input
                id="ld-last"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                placeholder="Wilson"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ld-email">Email *</Label>
            <Input
              id="ld-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="dave@startup.io"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ld-company">Company</Label>
              <Input
                id="ld-company"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Startup IO"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ld-source">Source</Label>
              <select
                id="ld-source"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className="border-input bg-background focus-visible:ring-ring flex h-10 w-full appearance-none rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
              >
                <option value="">Select source</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="email">Email Campaign</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ld-notes">Notes</Label>
            <Textarea
              id="ld-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any initial notes…"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !form.first_name.trim() || !form.email.trim()}
            >
              {isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Leads Tab
function LeadsTab() {
  const { data: leads = [], isLoading } = useLeads();
  const { mutate: convertLead, isPending: isConverting } = useConvertLead();
  const { leadSearch, setLeadSearch } = useCrmStore();
  const [createOpen, setCreateOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const filtered = leads.filter((l) => {
    const q = leadSearch.toLowerCase();
    return (
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      l.company.toLowerCase().includes(q)
    );
  });

  function handleConvert(id: string) {
    setConvertingId(id);
    convertLead(id, { onSettled: () => setConvertingId(null) });
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Input
          placeholder="Search leads…"
          value={leadSearch}
          onChange={(e) => setLeadSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden />
          Add lead
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No leads yet"
          description="Add leads and convert them to contacts when they're ready."
          actionLabel="Add lead"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <div className="border-border rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  onConvert={handleConvert}
                  isConverting={isConverting && convertingId === lead.id}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateLeadDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function LeadRow({
  lead,
  onConvert,
  isConverting,
}: {
  lead: Lead;
  onConvert: (id: string) => void;
  isConverting: boolean;
}) {
  const statusVariant =
    lead.status === "converted" ? "success" : lead.status === "contacted" ? "secondary" : "outline";

  return (
    <TableRow>
      <TableCell className="font-medium">
        {lead.firstName} {lead.lastName}
      </TableCell>
      <TableCell className="text-muted-foreground">{lead.email}</TableCell>
      <TableCell>{lead.company || "—"}</TableCell>
      <TableCell className="text-muted-foreground capitalize">{lead.source || "—"}</TableCell>
      <TableCell>
        <Badge variant={statusVariant} className="capitalize">
          {lead.status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
      <TableCell>
        {lead.convertedAt ? (
          <span className="text-muted-foreground text-xs">Converted</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isConverting}
            onClick={() => onConvert(lead.id)}
            className="gap-1.5"
          >
            <ArrowRightLeft className="h-3 w-3" aria-hidden />
            {isConverting ? "Converting…" : "Convert"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

// Activities Tab
function ActivitiesTab() {
  const { data: activities = [], isLoading } = useActivities();
  const { mutate: followUp, isPending: isFollowingUp } = useFollowUp();
  const [followUpId, setFollowUpId] = useState<string | null>(null);

  function handleFollowUp(id: string) {
    setFollowUpId(id);
    followUp(id, { onSettled: () => setFollowUpId(null) });
  }

  return (
    <div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activities yet"
          description="Activities will appear here as your team logs calls, emails, and meetings."
        />
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onFollowUp={handleFollowUp}
              isFollowingUp={isFollowingUp && followUpId === activity.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityCard({
  activity,
  onFollowUp,
  isFollowingUp,
}: {
  activity: CrmActivity;
  onFollowUp: (id: string) => void;
  isFollowingUp: boolean;
}) {
  const TypeIcon = ACTIVITY_TYPE_ICONS[activity.type] ?? Activity;
  const isCompleted = Boolean(activity.completedAt);
  const isOverdue = !isCompleted && activity.dueDate && new Date(activity.dueDate) < new Date();

  return (
    <li className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isCompleted
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              : isOverdue
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
          )}
        >
          <TypeIcon className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground font-medium">{activity.subject}</p>
            <Badge
              variant={isCompleted ? "success" : isOverdue ? "destructive" : "secondary"}
              className="capitalize"
            >
              {isCompleted ? "Completed" : isOverdue ? "Overdue" : activity.type}
            </Badge>
          </div>

          {activity.notes && <p className="text-muted-foreground text-sm">{activity.notes}</p>}

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
            {activity.contactName && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" aria-hidden />
                {activity.contactName}
              </span>
            )}
            {activity.dueDate && <span>Due {formatRelative(activity.dueDate)}</span>}
          </div>

          {activity.followUpSuggestion && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-xs text-teal-800 dark:bg-teal-900/20 dark:text-teal-300">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>{activity.followUpSuggestion}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
        <Button
          size="sm"
          variant="outline"
          disabled={isFollowingUp}
          onClick={() => onFollowUp(activity.id)}
          className="gap-1.5"
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          {isFollowingUp ? "Generating…" : "AI Follow-up"}
        </Button>
      </div>
    </li>
  );
}

// Pipeline summary stats
function PipelineSummary() {
  const { data: pipeline } = usePipeline();
  if (!pipeline) return null;

  const wonStage = pipeline.stages.find((s) => s.stage === "won");
  const activeStages = pipeline.stages.filter((s) => s.stage !== "won" && s.stage !== "lost");
  const activeAmount = activeStages.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card className="p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Pipeline Value
        </p>
        <p className="text-foreground mt-1 text-xl font-semibold">{formatCurrency(activeAmount)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Total Deals
        </p>
        <p className="text-foreground mt-1 text-xl font-semibold">{pipeline.totalCount}</p>
      </Card>
      <Card className="p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Won This Period
        </p>
        <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(wonStage?.totalAmount ?? 0)}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Win Rate
        </p>
        <p className="text-foreground mt-1 flex items-center gap-1 text-xl font-semibold">
          <TrendingUp className="h-4 w-4 text-teal-600" aria-hidden />
          {pipeline.totalCount > 0
            ? Math.round(((wonStage?.count ?? 0) / pipeline.totalCount) * 100)
            : 0}
          %
        </p>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main workspace
// ---------------------------------------------------------------------------

export function CrmWorkspace() {
  const { activeTab, setActiveTab } = useCrmStore();

  return (
    <div>
      <PageHeader
        title="CRM"
        description="Manage your pipeline, companies, contacts, and leads in one place."
      />

      <PipelineSummary />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="border-border bg-muted/50 mb-6 flex w-full flex-wrap gap-1 rounded-xl border p-1 sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="pipeline" className="flex items-center gap-1.5">
            <Kanban className="h-3.5 w-3.5" aria-hidden />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Companies
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Leads
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" aria-hidden />
            Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline">
          <PipelineTab />
        </TabsContent>

        <TabsContent value="companies">
          <CompaniesTab />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>

        <TabsContent value="leads">
          <LeadsTab />
        </TabsContent>

        <TabsContent value="activities">
          <ActivitiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
