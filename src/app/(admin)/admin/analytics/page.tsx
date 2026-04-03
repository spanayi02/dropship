import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { CategoryPieChart } from "@/components/admin/category-pie-chart";
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Analytics",
};

type RangeKey = "7d" | "30d" | "90d";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
];

function getDateRange(range: string, from?: string, to?: string) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (range === "custom" && from && to) {
    return {
      start: new Date(from),
      end: new Date(to),
      days: Math.ceil(
        (new Date(to).getTime() - new Date(from).getTime()) / 86400000
      ),
    };
  }

  const days = range === "90d" ? 90 : range === "30d" ? 30 : 7;
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  return { start, end, days };
}

interface PageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rangeKey = (params.range ?? "30d") as string;
  const { start, end, days } = getDateRange(rangeKey, params.from, params.to);

  // Fetch orders in range with items
  const orders = await db.order.findMany({
    where: {
      status: { in: ["PROCESSING", "SHIPPED", "DELIVERED"] },
      createdAt: { gte: start, lte: end },
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              categoryId: true,
              category: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // --- Aggregate metrics ---
  let totalRevenue = 0;
  let totalCost = 0;

  for (const order of orders) {
    totalRevenue += order.total;
    for (const item of order.orderItems) {
      totalCost += (item.costAtPurchase ?? 0) * item.quantity;
    }
  }

  const totalProfit = totalRevenue - totalCost;
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  // --- Daily chart data ---
  const dailyMap = new Map<
    string,
    { date: string; revenue: number; profit: number }
  >();

  // Pre-fill all days
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: 0,
      profit: 0,
    });
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (dailyMap.has(key)) {
      const entry = dailyMap.get(key)!;
      let orderCost = 0;
      for (const item of order.orderItems) {
        orderCost += (item.costAtPurchase ?? 0) * item.quantity;
      }
      entry.revenue += order.total;
      entry.profit += order.total - orderCost;
    }
  }

  const chartData = Array.from(dailyMap.values());

  // --- Category breakdown ---
  const categoryMap = new Map<string, { name: string; value: number }>();
  for (const order of orders) {
    for (const item of order.orderItems) {
      const catName = item.product.category.name;
      const existing = categoryMap.get(catName) ?? { name: catName, value: 0 };
      existing.value += item.priceAtPurchase * item.quantity;
      categoryMap.set(catName, existing);
    }
  }
  const categoryData = Array.from(categoryMap.values()).sort(
    (a, b) => b.value - a.value
  );

  // --- Top 10 products by revenue ---
  const productRevenueMap = new Map<
    string,
    { id: string; title: string; revenue: number; profit: number; units: number }
  >();
  for (const order of orders) {
    for (const item of order.orderItems) {
      const existing = productRevenueMap.get(item.productId) ?? {
        id: item.productId,
        title: item.product.title,
        revenue: 0,
        profit: 0,
        units: 0,
      };
      const lineRevenue = item.priceAtPurchase * item.quantity;
      const lineCost = (item.costAtPurchase ?? 0) * item.quantity;
      existing.revenue += lineRevenue;
      existing.profit += lineRevenue - lineCost;
      existing.units += item.quantity;
      productRevenueMap.set(item.productId, existing);
    }
  }

  const topByRevenue = Array.from(productRevenueMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const topByProfit = Array.from(productRevenueMap.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            —{" "}
            {end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Range selector */}
        <div className="flex items-center gap-1 flex-wrap">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                rangeKey === r.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Revenue"
          value={formatPrice(totalRevenue)}
          icon={<DollarSign className="size-4" />}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-50 dark:bg-emerald-950/30"
        />
        <MetricCard
          label="Total Profit"
          value={formatPrice(totalProfit)}
          icon={
            totalProfit >= 0 ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )
          }
          color={
            totalProfit >= 0
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-red-600 dark:text-red-400"
          }
          bgColor={
            totalProfit >= 0
              ? "bg-indigo-50 dark:bg-indigo-950/30"
              : "bg-red-50 dark:bg-red-950/30"
          }
        />
        <MetricCard
          label="Orders"
          value={orderCount.toString()}
          icon={<ShoppingBag className="size-4" />}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-950/30"
        />
        <MetricCard
          label="Avg Order Value"
          value={formatPrice(avgOrderValue)}
          icon={<DollarSign className="size-4" />}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-50 dark:bg-amber-950/30"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue vs Profit */}
        <div className="rounded-xl border p-4 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-4">Revenue vs Profit</h2>
          <AnalyticsChart data={chartData} />
        </div>

        {/* Category pie */}
        <div className="rounded-xl border p-4">
          <h2 className="font-semibold text-sm mb-4">Sales by Category</h2>
          <CategoryPieChart data={categoryData} />
        </div>
      </div>

      {/* Top products tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopProductsTable
          title="Top 10 by Revenue"
          products={topByRevenue}
          valueKey="revenue"
          valueLabel="Revenue"
        />
        <TopProductsTable
          title="Top 10 by Profit"
          products={topByProfit}
          valueKey="profit"
          valueLabel="Profit"
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  color,
  bgColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className={`rounded-lg p-1.5 ${bgColor} ${color}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function TopProductsTable({
  title,
  products,
  valueKey,
  valueLabel,
}: {
  title: string;
  products: Array<{
    id: string;
    title: string;
    revenue: number;
    profit: number;
    units: number;
  }>;
  valueKey: "revenue" | "profit";
  valueLabel: string;
}) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="px-4 py-3 border-b">
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {products.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No data
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground w-8">
                #
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                Product
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                Units
              </th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p.id}
                className="border-b last:border-0 hover:bg-muted/20"
              >
                <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                  {i + 1}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="hover:text-primary hover:underline line-clamp-1"
                  >
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {p.units}
                </td>
                <td
                  className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                    p[valueKey] >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatPrice(p[valueKey])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
