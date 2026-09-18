"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatPrice, splitPrice } from "@/lib/utils";

interface RevenueChartProps {
  data: { date: string; revenue: number }[];
}

const { symbol } = splitPrice(0);

function formatTick(value: number) {
  if (value === 0) return `${symbol}0`;
  if (value >= 100000) return `${symbol}${(value / 100000).toFixed(1)}k`;
  return `${symbol}${(value / 100).toFixed(0)}`;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={formatTick}
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          formatter={(value) => [formatPrice(Number(value)), "Revenue"]}
          labelStyle={{ fontSize: 12 }}
          contentStyle={{
            borderRadius: "3px",
            border: "1px solid var(--border)",
            backgroundColor: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="var(--signal-deep)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--signal-deep)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
