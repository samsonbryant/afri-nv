export type ReportCategory =
  | "financial"
  | "sales"
  | "hr"
  | "marketing"
  | "inventory"
  | "executive"
  | "weekly"
  | "monthly"
  | "annual";

export type ReportStatus = "generating" | "ready" | "failed";

export type ReportTemplate = {
  id: string;
  name: string;
  description?: string;
  category: ReportCategory;
};

export type Report = {
  id: string;
  templateId: string;
  template_id?: string;
  templateName?: string;
  template_name?: string;
  title: string;
  periodStart: string;
  period_start?: string;
  periodEnd: string;
  period_end?: string;
  status: ReportStatus;
  content?: string | null;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
};

export type GenerateReportPayload = {
  templateId: string;
  periodStart: string;
  periodEnd: string;
  organizationId?: string | null;
};

export const TEMPLATE_META: Record<
  ReportCategory,
  { icon: string; color: string; description: string }
> = {
  financial: {
    icon: "DollarSign",
    color: "text-teal-600",
    description: "P&L, balance sheet and cash-flow analysis",
  },
  sales: {
    icon: "TrendingUp",
    color: "text-blue-600",
    description: "Pipeline, conversion and revenue breakdown",
  },
  hr: {
    icon: "Users",
    color: "text-violet-600",
    description: "Headcount, attrition and performance metrics",
  },
  marketing: {
    icon: "Megaphone",
    color: "text-pink-600",
    description: "Campaign ROI, reach and engagement overview",
  },
  inventory: {
    icon: "Package",
    color: "text-orange-600",
    description: "Stock levels, turnover and replenishment alerts",
  },
  executive: {
    icon: "LayoutDashboard",
    color: "text-slate-600",
    description: "High-level KPIs for leadership review",
  },
  weekly: {
    icon: "CalendarDays",
    color: "text-cyan-600",
    description: "Week-over-week operational summary",
  },
  monthly: {
    icon: "Calendar",
    color: "text-indigo-600",
    description: "Monthly performance and goal tracking",
  },
  annual: {
    icon: "BarChart3",
    color: "text-emerald-600",
    description: "Annual review and year-on-year comparison",
  },
};
