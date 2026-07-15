export type AnalyticsKpis = {
  revenue: number;
  mrr: number;
  arr: number;
  churn: number;
  retention: number;
  aiUsage: number;
  csat: number;
};

export type TimeseriesPoint = {
  date: string;
  revenue: number;
  mrr: number;
  aiUsage: number;
  churn: number;
};

export type AnalyticsOverview = {
  kpis: AnalyticsKpis;
  series: TimeseriesPoint[];
};
