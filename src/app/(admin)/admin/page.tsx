import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { TopProductsChart } from "@/components/admin/top-products-chart";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Package,
} from "lucide-react";

export const dynamic = 'force-dynamic';

// ─── helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

function startOfWeek(d: Date) {
  const t = new Date(d);
  t.setDate(t.getDate() - t.getDay());
  t.setHours(0, 0, 0, 0);
  return t;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ─── data fetching ────────────────────────────────────────────────────────────

async function fetchDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [
    revenueToday,
    revenueWeek,
    revenueMonth,
    revenueAll,
    orderCount,
    pendingCount,
    topProductsRaw,
    recentOrdersRaw,
    last30DaysOrders,
    outOfStockSuppliers,
  ] = await Promise.all([
    // Revenue today
    db.order.aggregate({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: todayStart } },
      _sum: { total: true },
    }),
    // Revenue this week
    db.order.aggregate({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: weekStart } },
      _sum: { total: true },
    }),
    // Revenue this month
    db.order.aggregate({
      where: { status: { not: "CANCELLED" }, createdAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    // Revenue all time
    db.order.aggregate({
      where: { status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { id: true },
    }),
    // Total orders
    db.order.count(),
    // Pending orders
    db.order.count({ where: { status: "PENDING" } }),
    // Top 5 products by revenue
    db.orderItem.groupBy({
      by: ["productId"],
      _sum: { priceAtPurchase: true, quantity: true },
      orderBy: { _sum: { priceAtPurchase: "desc" } },
      take: 5,
    }),
    // Last 10 orders
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        guestEmail: true,
        user: { select: { name: true, email: true } },
      },
    }),
    // Last 30 days orders (for chart)
    db.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, total: true },
    }),
    // Out of stock supplier records grouped by product
    db.productSupplier.findMany({
      where: { inStock: false },
      select: {
        productId: true,
        product: { select: { title: true } },
      },
      distinct: ["productId"],
      take: 20,
    }),
  ]);

  // Resolve top product titles
  const productIds = topProductsRaw.map((r) => r.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.title]));

  const topProducts = topProductsRaw.map((r) => ({
    name: productMap.get(r.productId) ?? "Unknown",
    revenue: (r._sum.priceAtPurchase ?? 0) * (r._sum.quantity ?? 1),
  }));

  // Build last 30 days chart data
  const revenueByDay = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    revenueByDay.set(key, 0);
  }
  for (const order of last30DaysOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + order.total);
    }
  }
  const chartData = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
    date: date.slice(5), // MM-DD
    revenue,
  }));

  // Average order value
  const totalRevenue = revenueAll._sum.total ?? 0;
  const totalOrderCount = revenueAll._count.id;
  const avgOrderValue = totalOrderCount > 0 ? Math.round(totalRevenue / totalOrderCount) : 0;

  return {
    revenueToday: revenueToday._sum.total ?? 0,
    revenueMonth: revenueMonth._sum.total ?? 0,
    revenueWeek: revenueWeek._sum.total ?? 0,
    orderCount,
    pendingCount,
    avgOrderValue,
    topProducts,
    chartData,
    recentOrders: recentOrdersRaw,
    lowStockProducts: outOfStockSuppliers,
  };
}

// ─── status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PROCESSING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── metric card ──────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="rounded-lg bg-emerald-500/10 p-2">
          <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const {
    revenueToday,
    revenueMonth,
    orderCount,
    pendingCount,
    avgOrderValue,
    topProducts,
    chartData,
    recentOrders,
    lowStockProducts,
  } = await fetchDashboardData();

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's Revenue"
          value={formatPrice(revenueToday)}
          icon={DollarSign}
        />
        <MetricCard
          label="This Month's Revenue"
          value={formatPrice(revenueMonth)}
          icon={TrendingUp}
        />
        <MetricCard
          label="Total Orders"
          value={orderCount.toString()}
          sub={`${pendingCount} pending`}
          icon={ShoppingCart}
        />
        <MetricCard
          label="Avg Order Value"
          value={formatPrice(avgOrderValue)}
          icon={DollarSign}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2 rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Revenue — Last 30 Days</h2>
          <RevenueChart data={chartData} />
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Top 5 Products by Revenue</h2>
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-900/40 dark:bg-yellow-900/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400" />
            <h2 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
              Low Stock / Out of Stock ({lowStockProducts.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.map((s) => (
              <span
                key={s.productId}
                className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              >
                <Package className="size-3" />
                {s.product.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-5 py-3 text-left font-medium">Order #</th>
                <th className="px-5 py-3 text-left font-medium">Customer</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.map((order) => {
                const customer = order.user?.name ?? order.user?.email ?? order.guestEmail ?? "Guest";
                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="px-5 py-3 text-muted-foreground">{customer}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {order.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
