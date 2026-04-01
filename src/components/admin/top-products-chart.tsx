"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { truncate } from "@/lib/utils";

interface TopProductsChartProps {
  data: { name: string; revenue: number }[];
}

function formatTick(value: number) {
  if (value === 0) return "$0";
  if (value >= 100000) return `$${(value / 100000).toFixed(1)}k`;
  return `$${(value / 100).toFixed(0)}`;
}

export function TopProductsChart({ data }: TopProductsChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    shortName: truncate(d.name, 18),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatTick}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip
          formatter={(value) => [formatPrice(Number(value)), "Revenue"]}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          }}
        />
        <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
