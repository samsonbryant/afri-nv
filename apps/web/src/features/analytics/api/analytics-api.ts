import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickNumber, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type { AnalyticsKpis, AnalyticsOverview, TimeseriesPoint } from "@/features/analytics/types";

function demoOverview(): AnalyticsOverview {
  const series: TimeseriesPoint[] = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return {
      date: d.toISOString().slice(0, 7),
      revenue: 320000 + i * 18000 + (i % 3) * 4000,
      mrr: 118000 + i * 4200,
      aiUsage: 28000 + i * 2500,
      churn: Math.max(1.2, 4.5 - i * 0.2),
    };
  });
  const last = series[series.length - 1];
  return {
    kpis: {
      revenue: last.revenue,
      mrr: last.mrr,
      arr: last.mrr * 12,
      churn: last.churn,
      retention: 100 - last.churn,
      aiUsage: last.aiUsage,
      csat: 4.6,
    },
    series,
  };
}

function mapKpis(
  overview: Record<string, unknown>,
  extras?: {
    retention?: number;
    churn?: number;
    aiUsage?: number;
    csat?: number;
  },
): AnalyticsKpis {
  const rawChurn = extras?.churn ?? pickNumber(overview, "churn", "churn_rate");
  const churn = rawChurn > 0 && rawChurn <= 1 ? rawChurn * 100 : rawChurn;
  const rawRetention = extras?.retention ?? pickNumber(overview, "retention", "retention_rate");
  const retention =
    rawRetention > 0
      ? rawRetention <= 1
        ? rawRetention * 100
        : rawRetention
      : Math.max(0, 100 - churn);
  return {
    revenue: pickNumber(overview, "revenue"),
    mrr: pickNumber(overview, "mrr"),
    arr: pickNumber(overview, "arr") || pickNumber(overview, "mrr") * 12,
    churn,
    retention,
    aiUsage: extras?.aiUsage ?? pickNumber(overview, "aiUsage", "ai_usage", "ai_tokens"),
    csat: extras?.csat ?? pickNumber(overview, "csat"),
  };
}

function mapRevenueSeries(payload: unknown, fallbackMrr: number): TimeseriesPoint[] {
  const rows = Array.isArray(payload)
    ? payload
    : ((payload as { results?: unknown[] })?.results ?? []);
  return rows.map((row, i) => {
    const r = (row ?? {}) as Record<string, unknown>;
    const amount = pickNumber(r, "amount_cents", "revenue", "amount") || fallbackMrr;
    const date =
      String(r.period ?? r.date ?? "").slice(0, 10) ||
      new Date(Date.now() - (rows.length - 1 - i) * 30 * 86400000).toISOString().slice(0, 7);
    return {
      date,
      revenue: amount,
      mrr: amount,
      aiUsage: 0,
      churn: 0,
    };
  });
}

export async function fetchAnalyticsOverview(
  organizationId?: string | null,
): Promise<AnalyticsOverview> {
  if (isDemoMode()) return demoOverview();
  try {
    const [overview, revenue, retention, churn, aiUsage, satisfaction] = await Promise.all([
      api.get<Record<string, unknown>>(withOrg(API_ENDPOINTS.analytics.overview, organizationId)),
      api.get<unknown>(withOrg(API_ENDPOINTS.analytics.revenue, organizationId)).catch(() => []),
      api
        .get<Record<string, unknown>>(withOrg(API_ENDPOINTS.analytics.retention, organizationId))
        .catch(() => ({})),
      api
        .get<Record<string, unknown>>(withOrg(API_ENDPOINTS.analytics.churn, organizationId))
        .catch(() => ({})),
      api
        .get<Record<string, unknown>>(withOrg(API_ENDPOINTS.analytics.aiUsage, organizationId))
        .catch(() => ({})),
      api
        .get<Record<string, unknown>>(withOrg(API_ENDPOINTS.analytics.satisfaction, organizationId))
        .catch(() => ({})),
    ]);

    const kpis = mapKpis(overview, {
      churn: pickNumber(churn, "churn_rate", "churn") || undefined,
      retention: pickNumber(retention, "retention_rate", "retention") || undefined,
      aiUsage: pickNumber(aiUsage, "tokens", "ai_tokens", "aiUsage") || undefined,
      csat: pickNumber(satisfaction, "csat") || undefined,
    });

    return {
      kpis,
      series: mapRevenueSeries(revenue, kpis.mrr),
    };
  } catch {
    return {
      kpis: {
        revenue: 0,
        mrr: 0,
        arr: 0,
        churn: 0,
        retention: 0,
        aiUsage: 0,
        csat: 0,
      },
      series: [],
    };
  }
}
