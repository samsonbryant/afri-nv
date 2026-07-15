import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { withOrg, unwrapList, pickString, pickNumber, pickIso } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  Company,
  Contact,
  Lead,
  Opportunity,
  CrmActivity,
  PipelineData,
  PipelineStage,
  CreateCompanyPayload,
  CreateContactPayload,
  CreateLeadPayload,
  CreateOpportunityPayload,
  UpdateOpportunityStagePayload,
} from "@/features/crm/types";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCompany(raw: Record<string, unknown>): Company {
  return {
    id: pickString(raw, "id"),
    name: pickString(raw, "name"),
    domain: pickString(raw, "domain"),
    industry: pickString(raw, "industry"),
    size: pickString(raw, "size"),
    website: pickString(raw, "website"),
    phone: pickString(raw, "phone"),
    address: pickString(raw, "address"),
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapContact(raw: Record<string, unknown>): Contact {
  return {
    id: pickString(raw, "id"),
    firstName: pickString(raw, "firstName", "first_name"),
    lastName: pickString(raw, "lastName", "last_name"),
    email: pickString(raw, "email"),
    phone: pickString(raw, "phone"),
    title: pickString(raw, "title"),
    companyId: (raw.companyId ?? raw.company_id ?? null) as string | null,
    companyName: pickString(raw, "companyName", "company_name", "company"),
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapLead(raw: Record<string, unknown>): Lead {
  return {
    id: pickString(raw, "id"),
    firstName: pickString(raw, "firstName", "first_name"),
    lastName: pickString(raw, "lastName", "last_name"),
    email: pickString(raw, "email"),
    phone: pickString(raw, "phone"),
    company: pickString(raw, "company", "companyName", "company_name"),
    source: pickString(raw, "source"),
    status: pickString(raw, "status") || "new",
    notes: pickString(raw, "notes"),
    convertedAt:
      (raw.convertedAt as string | null | undefined) ??
      (raw.converted_at as string | null | undefined) ??
      null,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

const VALID_STAGES: PipelineStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

function toStage(value: unknown): PipelineStage {
  if (typeof value === "string" && VALID_STAGES.includes(value as PipelineStage)) {
    return value as PipelineStage;
  }
  return "lead";
}

function mapOpportunity(raw: Record<string, unknown>): Opportunity {
  return {
    id: pickString(raw, "id"),
    title: pickString(raw, "title", "name"),
    stage: toStage(raw.stage),
    amount: pickNumber(raw, "amount"),
    currency: pickString(raw, "currency") || "USD",
    probability: pickNumber(raw, "probability"),
    companyId: (raw.companyId ?? raw.company_id ?? null) as string | null,
    companyName: pickString(raw, "companyName", "company_name", "company"),
    contactId: (raw.contactId ?? raw.contact_id ?? null) as string | null,
    contactName: pickString(raw, "contactName", "contact_name", "contact"),
    closeDate: pickString(raw, "closeDate", "close_date"),
    description: pickString(raw, "description"),
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapActivity(raw: Record<string, unknown>): CrmActivity {
  return {
    id: pickString(raw, "id"),
    type: pickString(raw, "type") || "task",
    subject: pickString(raw, "subject", "title", "name"),
    notes: pickString(raw, "notes", "description"),
    dueDate: pickString(raw, "dueDate", "due_date"),
    completedAt:
      (raw.completedAt as string | null | undefined) ??
      (raw.completed_at as string | null | undefined) ??
      null,
    opportunityId: (raw.opportunityId ?? raw.opportunity_id ?? null) as string | null,
    contactId: (raw.contactId ?? raw.contact_id ?? null) as string | null,
    contactName: pickString(raw, "contactName", "contact_name", "contact"),
    companyId: (raw.companyId ?? raw.company_id ?? null) as string | null,
    followUpSuggestion: pickString(
      raw,
      "followUpSuggestion",
      "follow_up_suggestion",
      "ai_suggestion",
    ),
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

function demoCompanies(): Company[] {
  return [
    {
      id: "c1",
      name: "Acme Corp",
      domain: "acme.com",
      industry: "Technology",
      size: "51-200",
      website: "https://acme.com",
      phone: "+1 555-0100",
      address: "123 Main St, San Francisco, CA",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "c2",
      name: "Globex Inc",
      domain: "globex.com",
      industry: "Manufacturing",
      size: "201-500",
      website: "https://globex.com",
      phone: "+1 555-0200",
      address: "456 Elm St, Chicago, IL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "c3",
      name: "Initech",
      domain: "initech.com",
      industry: "Finance",
      size: "11-50",
      website: "https://initech.com",
      phone: "+1 555-0300",
      address: "789 Oak Ave, Austin, TX",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function demoContacts(): Contact[] {
  return [
    {
      id: "ct1",
      firstName: "Alice",
      lastName: "Johnson",
      email: "alice@acme.com",
      phone: "+1 555-1001",
      title: "VP Sales",
      companyId: "c1",
      companyName: "Acme Corp",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ct2",
      firstName: "Bob",
      lastName: "Smith",
      email: "bob@globex.com",
      phone: "+1 555-2002",
      title: "CTO",
      companyId: "c2",
      companyName: "Globex Inc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ct3",
      firstName: "Carol",
      lastName: "Lee",
      email: "carol@initech.com",
      phone: "+1 555-3003",
      title: "CEO",
      companyId: "c3",
      companyName: "Initech",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function demoLeads(): Lead[] {
  return [
    {
      id: "l1",
      firstName: "Dave",
      lastName: "Wilson",
      email: "dave@startup.io",
      phone: "+1 555-4004",
      company: "Startup IO",
      source: "website",
      status: "new",
      notes: "Interested in enterprise plan",
      convertedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "l2",
      firstName: "Eva",
      lastName: "Martinez",
      email: "eva@scaleup.co",
      phone: "+1 555-5005",
      company: "ScaleUp Co",
      source: "referral",
      status: "contacted",
      notes: "Follow up next week",
      convertedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function demoOpportunities(): Opportunity[] {
  return [
    {
      id: "o1",
      title: "Acme Enterprise Deal",
      stage: "proposal",
      amount: 120000,
      currency: "USD",
      probability: 60,
      companyId: "c1",
      companyName: "Acme Corp",
      contactId: "ct1",
      contactName: "Alice Johnson",
      closeDate: "2026-09-30",
      description: "Full suite license",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "o2",
      title: "Globex Pilot",
      stage: "qualified",
      amount: 45000,
      currency: "USD",
      probability: 40,
      companyId: "c2",
      companyName: "Globex Inc",
      contactId: "ct2",
      contactName: "Bob Smith",
      closeDate: "2026-08-15",
      description: "3-month pilot program",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "o3",
      title: "Initech Renewal",
      stage: "negotiation",
      amount: 80000,
      currency: "USD",
      probability: 80,
      companyId: "c3",
      companyName: "Initech",
      contactId: "ct3",
      contactName: "Carol Lee",
      closeDate: "2026-07-31",
      description: "Annual contract renewal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "o4",
      title: "New Lead Opportunity",
      stage: "lead",
      amount: 20000,
      currency: "USD",
      probability: 15,
      companyId: null,
      companyName: "Startup IO",
      contactId: null,
      contactName: "Dave Wilson",
      closeDate: "2026-10-15",
      description: "Inbound from website",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "o5",
      title: "Mega Corp Win",
      stage: "won",
      amount: 250000,
      currency: "USD",
      probability: 100,
      companyId: null,
      companyName: "Mega Corp",
      contactId: null,
      contactName: "Frank Zhao",
      closeDate: "2026-06-30",
      description: "Closed won last month",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function demoActivities(): CrmActivity[] {
  const now = new Date();
  return [
    {
      id: "a1",
      type: "call",
      subject: "Discovery call with Alice",
      notes: "Discussed budget and timeline",
      dueDate: new Date(now.getTime() + 86400000).toISOString(),
      completedAt: null,
      opportunityId: "o1",
      contactId: "ct1",
      contactName: "Alice Johnson",
      companyId: "c1",
      followUpSuggestion: "Send pricing proposal by Friday",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "a2",
      type: "email",
      subject: "Follow up: Globex Pilot proposal",
      notes: "Sent deck and contract draft",
      dueDate: new Date(now.getTime() + 172800000).toISOString(),
      completedAt: null,
      opportunityId: "o2",
      contactId: "ct2",
      contactName: "Bob Smith",
      companyId: "c2",
      followUpSuggestion: "Schedule a technical deep-dive",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "a3",
      type: "meeting",
      subject: "Initech contract review",
      notes: "Legal terms being finalized",
      dueDate: new Date(now.getTime() - 3600000).toISOString(),
      completedAt: new Date().toISOString(),
      opportunityId: "o3",
      contactId: "ct3",
      contactName: "Carol Lee",
      companyId: "c3",
      followUpSuggestion: "Get signatures by end of week",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}

function demoPipeline(opportunities: Opportunity[]): PipelineData {
  const STAGE_LIST: PipelineStage[] = [
    "lead",
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ];
  const STAGE_LABELS: Record<PipelineStage, string> = {
    lead: "Lead",
    qualified: "Qualified",
    proposal: "Proposal",
    negotiation: "Negotiation",
    won: "Won",
    lost: "Lost",
  };

  const grouped = STAGE_LIST.map((stage) => {
    const ops = opportunities.filter((o) => o.stage === stage);
    return {
      stage,
      label: STAGE_LABELS[stage],
      count: ops.length,
      totalAmount: ops.reduce((sum, o) => sum + o.amount, 0),
      currency: "USD",
      opportunities: ops,
    };
  });

  return {
    stages: grouped,
    totalAmount: opportunities.reduce((sum, o) => sum + o.amount, 0),
    totalCount: opportunities.length,
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function fetchCompanies(organizationId?: string | null): Promise<Company[]> {
  if (isDemoMode()) return demoCompanies();
  try {
    const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.crm.companies, organizationId));
    return unwrapList<Record<string, unknown>>(
      payload as Record<string, unknown>[] | { results?: Record<string, unknown>[] },
    ).map(mapCompany);
  } catch {
    return [];
  }
}

export async function createCompany(
  payload: CreateCompanyPayload,
  organizationId?: string | null,
): Promise<Company> {
  const raw = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.crm.companies, organizationId),
    payload,
  );
  return mapCompany(raw);
}

export async function fetchContacts(organizationId?: string | null): Promise<Contact[]> {
  if (isDemoMode()) return demoContacts();
  try {
    const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.crm.contacts, organizationId));
    return unwrapList<Record<string, unknown>>(
      payload as Record<string, unknown>[] | { results?: Record<string, unknown>[] },
    ).map(mapContact);
  } catch {
    return [];
  }
}

export async function createContact(
  payload: CreateContactPayload,
  organizationId?: string | null,
): Promise<Contact> {
  const raw = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.crm.contacts, organizationId),
    payload,
  );
  return mapContact(raw);
}

export async function fetchLeads(organizationId?: string | null): Promise<Lead[]> {
  if (isDemoMode()) return demoLeads();
  try {
    const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.crm.leads, organizationId));
    return unwrapList<Record<string, unknown>>(
      payload as Record<string, unknown>[] | { results?: Record<string, unknown>[] },
    ).map(mapLead);
  } catch {
    return [];
  }
}

export async function createLead(
  payload: CreateLeadPayload,
  organizationId?: string | null,
): Promise<Lead> {
  const raw = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.crm.leads, organizationId),
    payload,
  );
  return mapLead(raw);
}

export async function convertLead(id: string): Promise<Contact> {
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.crm.convertLead(id));
  return mapContact(raw);
}

export async function fetchOpportunities(organizationId?: string | null): Promise<Opportunity[]> {
  if (isDemoMode()) return demoOpportunities();
  try {
    const payload = await api.get<unknown>(
      withOrg(API_ENDPOINTS.crm.opportunities, organizationId),
    );
    return unwrapList<Record<string, unknown>>(
      payload as Record<string, unknown>[] | { results?: Record<string, unknown>[] },
    ).map(mapOpportunity);
  } catch {
    return [];
  }
}

export async function createOpportunity(
  payload: CreateOpportunityPayload,
  organizationId?: string | null,
): Promise<Opportunity> {
  const raw = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.crm.opportunities, organizationId),
    payload,
  );
  return mapOpportunity(raw);
}

export async function updateOpportunityStage(
  id: string,
  payload: UpdateOpportunityStagePayload,
): Promise<Opportunity> {
  const raw = await api.patch<Record<string, unknown>>(API_ENDPOINTS.crm.opportunity(id), payload);
  return mapOpportunity(raw);
}

export async function fetchPipeline(organizationId?: string | null): Promise<PipelineData> {
  if (isDemoMode()) {
    const opps = demoOpportunities();
    return demoPipeline(opps);
  }
  try {
    const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.crm.pipeline, organizationId));
    if (payload && typeof payload === "object" && "stages" in (payload as object)) {
      return payload as PipelineData;
    }
    const opps = unwrapList<Record<string, unknown>>(
      payload as Record<string, unknown>[] | { results?: Record<string, unknown>[] },
    ).map(mapOpportunity);
    return demoPipeline(opps);
  } catch {
    return demoPipeline([]);
  }
}

export async function fetchActivities(organizationId?: string | null): Promise<CrmActivity[]> {
  if (isDemoMode()) return demoActivities();
  try {
    const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.crm.activities, organizationId));
    return unwrapList<Record<string, unknown>>(
      payload as Record<string, unknown>[] | { results?: Record<string, unknown>[] },
    ).map(mapActivity);
  } catch {
    return [];
  }
}

export async function triggerFollowUp(id: string): Promise<CrmActivity> {
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.crm.followUp(id));
  return mapActivity(raw);
}
