export type PipelineStage = "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";

export const PIPELINE_STAGES: PipelineStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  website: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  companyId: string | null;
  companyName: string;
  createdAt: string;
  updatedAt: string;
};

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  notes: string;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Opportunity = {
  id: string;
  title: string;
  stage: PipelineStage;
  amount: number;
  currency: string;
  probability: number;
  companyId: string | null;
  companyName: string;
  contactId: string | null;
  contactName: string;
  closeDate: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmActivity = {
  id: string;
  type: string;
  subject: string;
  notes: string;
  dueDate: string;
  completedAt: string | null;
  opportunityId: string | null;
  contactId: string | null;
  contactName: string;
  companyId: string | null;
  followUpSuggestion: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanyPayload = {
  name: string;
  domain?: string;
  industry?: string;
  website?: string;
  phone?: string;
};

export type CreateContactPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  company_id?: string;
};

export type CreateLeadPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  notes?: string;
};

export type CreateOpportunityPayload = {
  title: string;
  stage: PipelineStage;
  amount: number;
  currency?: string;
  probability?: number;
  company_id?: string;
  contact_id?: string;
  close_date?: string;
  description?: string;
};

export type UpdateOpportunityStagePayload = {
  stage: PipelineStage;
};

export type PipelineData = {
  stages: {
    stage: PipelineStage;
    label: string;
    count: number;
    totalAmount: number;
    currency: string;
    opportunities: Opportunity[];
  }[];
  totalAmount: number;
  totalCount: number;
};
