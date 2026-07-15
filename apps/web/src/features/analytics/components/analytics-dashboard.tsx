"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useAnalyticsOverview } from "@/features/analytics/hooks/use-analytics";
import { formatNumber } from "@/lib/utils/format";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AnalyticsDashboard() {
  const { data, isLoading, isError, refetch } = useAnalyticsOverview();
  const kpis = data?.kpis;
  const series = data?.series ?? [];

  const cards = [
    { label: "Revenue", value: kpis ? money(kpis.revenue) : "—" },
    { label: "MRR", value: kpis ? money(kpis.mrr) : "—" },
    { label: "ARR", value: kpis ? money(kpis.arr) : "—" },
    {
      label: "Churn",
      value: kpis ? `${kpis.churn.toFixed(1)}%` : "—",
    },
    {
      label: "Retention",
      value: kpis ? `${kpis.retention.toFixed(1)}%` : "—",
    },
    {
      label: "AI Usage",
      value: kpis ? formatNumber(kpis.aiUsage) : "—",
    },
    {
      label: "CSAT",
      value: kpis ? kpis.csat.toFixed(1) : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Revenue, retention, and AI usage across your workspace."
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          icon={TrendingUp}
          title="Couldn’t load analytics"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="border-border bg-card rounded-xl border p-4">
                <p className="text-muted-foreground text-xs uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              </div>
            ))}
          </section>

          {series.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="No time series yet"
              description="Analytics charts will appear once usage data is available."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="border-border bg-card rounded-xl border p-4">
                <h2 className="mb-4 font-medium">Revenue & MRR</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0d9488"
                        fill="#0d948833"
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="mrr"
                        stroke="#334155"
                        fill="#33415522"
                        name="MRR"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="border-border bg-card rounded-xl border p-4">
                <h2 className="mb-4 font-medium">AI usage & churn</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="aiUsage"
                        stroke="#0f766e"
                        strokeWidth={2}
                        dot={false}
                        name="AI usage"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="churn"
                        stroke="#b45309"
                        strokeWidth={2}
                        dot={false}
                        name="Churn %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
