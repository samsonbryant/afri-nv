import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { isDemoMode } from "@/lib/constants";
import { withOrg, unwrapList, pickString, pickIso } from "@/lib/api/org";
import type {
  ReportTemplate,
  Report,
  GenerateReportPayload,
  ReportCategory,
} from "@/features/reports/types";

function mapTemplate(raw: Record<string, unknown>): ReportTemplate {
  const type = pickString(raw, "type", "id", "category") || "financial";
  return {
    id: type,
    name: pickString(raw, "label", "name") || type.replace(/_/g, " "),
    description: (raw.description as string | undefined) ?? undefined,
    category: type as ReportCategory,
  };
}

function mapReport(raw: Record<string, unknown>): Report {
  const contentRaw = raw.content;
  let content: string | null = null;
  if (typeof contentRaw === "string") {
    content = contentRaw;
  } else if (contentRaw && typeof contentRaw === "object") {
    const obj = contentRaw as Record<string, unknown>;
    content =
      (typeof obj.markdown === "string" && obj.markdown) ||
      (typeof obj.text === "string" && obj.text) ||
      JSON.stringify(contentRaw, null, 2);
  }
  const type = pickString(raw, "type", "templateId", "template_id");
  return {
    id: pickString(raw, "id"),
    templateId: type,
    templateName: pickString(raw, "templateName", "template_name", "title") || type || undefined,
    title: pickString(raw, "title") || "Untitled Report",
    periodStart: pickString(raw, "periodStart", "period_start"),
    periodEnd: pickString(raw, "periodEnd", "period_end"),
    status: (pickString(raw, "status") || "ready") as Report["status"],
    content,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

const DEFAULT_TEMPLATES: ReportTemplate[] = [
  { id: "financial", name: "Financial Report", category: "financial" },
  { id: "sales", name: "Sales Report", category: "sales" },
  { id: "hr", name: "HR Report", category: "hr" },
  { id: "marketing", name: "Marketing Report", category: "marketing" },
  { id: "inventory", name: "Inventory Report", category: "inventory" },
  { id: "executive", name: "Executive Summary", category: "executive" },
  { id: "weekly", name: "Weekly Report", category: "weekly" },
  { id: "monthly", name: "Monthly Report", category: "monthly" },
  { id: "annual", name: "Annual Report", category: "annual" },
];

function demoReports(): Report[] {
  const now = Date.now();
  return [
    {
      id: "r1",
      templateId: "tpl-financial",
      templateName: "Financial Report",
      title: "Financial Report — Q3 2025",
      periodStart: "2025-07-01",
      periodEnd: "2025-09-30",
      status: "ready",
      content:
        "## Financial Report — Q3 2025\n\n### Executive Summary\n\nQ3 2025 was a strong quarter with revenue growing **14.3% YoY** to **$4.2M**. Operating expenses were held flat at $3.2M through automation savings, yielding a net profit margin of **22.1%**.\n\n### Revenue Breakdown\n\n| Segment | Q3 2025 | Q3 2024 | Change |\n|---------|---------|---------|--------|\n| SaaS Subscriptions | $2.8M | $2.3M | +21.7% |\n| Professional Services | $1.1M | $1.0M | +10% |\n| Other | $0.3M | $0.4M | -25% |\n\n### Key Metrics\n- **Gross Margin:** 68.2%\n- **EBITDA:** $1.1M\n- **Cash on Hand:** $6.4M\n\n### Outlook\nQ4 guidance remains at $4.5M–$4.8M revenue with continued margin improvement expected from automation initiatives.",
      createdAt: new Date(now - 86400_000 * 5).toISOString(),
      updatedAt: new Date(now - 86400_000 * 5).toISOString(),
    },
    {
      id: "r2",
      templateId: "tpl-sales",
      templateName: "Sales Report",
      title: "Sales Report — October 2025",
      periodStart: "2025-10-01",
      periodEnd: "2025-10-31",
      status: "ready",
      content:
        "## Sales Report — October 2025\n\n### Pipeline Summary\n\nTotal pipeline value: **$8.2M** across 64 active opportunities.\n\n- **New Deals Opened:** 18\n- **Deals Closed Won:** 9 ($1.1M)\n- **Deals Closed Lost:** 4 ($380K)\n- **Conversion Rate:** 69%\n\n### Top Performers\n1. Jordan Smith — $420K\n2. Alex Rivera — $310K\n3. Sam Chen — $280K",
      createdAt: new Date(now - 86400_000 * 2).toISOString(),
      updatedAt: new Date(now - 86400_000 * 2).toISOString(),
    },
  ];
}

export async function fetchReportTemplates(): Promise<ReportTemplate[]> {
  try {
    const payload = await api.get<unknown>(API_ENDPOINTS.reports.templates);
    const list = unwrapList(payload as ReportTemplate[] | { results?: ReportTemplate[] }).map((r) =>
      mapTemplate(r as Record<string, unknown>),
    );
    return list.length > 0 ? list : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export async function generateReport(payload: GenerateReportPayload): Promise<Report> {
  if (isDemoMode()) {
    const template =
      DEFAULT_TEMPLATES.find((t) => t.id === payload.templateId) ?? DEFAULT_TEMPLATES[0];
    return {
      id: `r-${Date.now()}`,
      templateId: payload.templateId,
      templateName: template.name,
      title: `${template.name} — ${payload.periodStart} to ${payload.periodEnd}`,
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
      status: "ready",
      content: `## ${template.name}\n\n**Period:** ${payload.periodStart} → ${payload.periodEnd}\n\n### Highlights\n- Key metrics improved vs prior period\n- Narrative insights for ${template.category} stakeholders\n\n> Demo content — live analytics connect when the reports API is available.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const body: Record<string, unknown> = {
    type: payload.templateId.replace(/^tpl-/, ""),
    period_start: payload.periodStart,
    period_end: payload.periodEnd,
  };
  if (payload.organizationId) body.organization_id = payload.organizationId;

  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.reports.generate, body);
  return mapReport(raw);
}

export async function fetchReports(organizationId?: string | null): Promise<Report[]> {
  if (isDemoMode()) return demoReports();

  try {
    const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.reports.list, organizationId));
    return unwrapList(payload as Report[] | { results?: Report[] }).map((r) =>
      mapReport(r as Record<string, unknown>),
    );
  } catch {
    return [];
  }
}

export async function fetchReport(id: string): Promise<Report> {
  const raw = await api.get<Record<string, unknown>>(API_ENDPOINTS.reports.detail(id));
  return mapReport(raw);
}
