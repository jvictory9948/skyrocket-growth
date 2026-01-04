import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, ShoppingCart, DollarSign, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface OrderStats {
  totalOrders: number;
  totalSpent: number;
  platformStats: { platform: string; count: number; spent: number }[];
  serviceStats: { service: string; count: number }[];
  monthlyData: { month: string; orders: number; spent: number }[];
}

const COLORS = [
  "hsl(270, 80%, 60%)",
  "hsl(200, 85%, 55%)",
  "hsl(142, 76%, 36%)",
  "hsl(0, 84%, 60%)",
  "hsl(45, 93%, 47%)",
  "hsl(280, 70%, 50%)",
  "hsl(180, 70%, 45%)",
  "hsl(320, 70%, 50%)",
];

const Analytics = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    totalSpent: 0,
    platformStats: [],
    serviceStats: [],
    monthlyData: [],
  });

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalSpent = orders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0;

      // Platform stats
      const platformMap = new Map<string, { count: number; spent: number }>();
      orders?.forEach((order) => {
        const existing = platformMap.get(order.platform) || { count: 0, spent: 0 };
        platformMap.set(order.platform, {
          count: existing.count + 1,
          spent: existing.spent + Number(order.charge),
        });
      });
      const platformStats = Array.from(platformMap.entries())
        .map(([platform, data]) => ({ platform, ...data }))
        .sort((a, b) => b.count - a.count);

      // Service stats (top 5)
      const serviceMap = new Map<string, number>();
      orders?.forEach((order) => {
        serviceMap.set(order.service, (serviceMap.get(order.service) || 0) + 1);
      });
      const serviceStats = Array.from(serviceMap.entries())
        .map(([service, count]) => ({ service: service.slice(0, 30) + (service.length > 30 ? "..." : ""), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly data (last 6 months)
      const monthlyMap = new Map<string, { orders: number; spent: number }>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthlyMap.set(monthKey, { orders: 0, spent: 0 });
      }

      orders?.forEach((order) => {
        const date = new Date(order.created_at);
        const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        if (monthlyMap.has(monthKey)) {
          const existing = monthlyMap.get(monthKey)!;
          monthlyMap.set(monthKey, {
            orders: existing.orders + 1,
            spent: existing.spent + Number(order.charge),
          });
        }
      });

      const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        ...data,
      }));

      setStats({ totalOrders, totalSpent, platformStats, serviceStats, monthlyData });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const chartConfig = {
    orders: { label: "Orders", color: "hsl(270, 80%, 60%)" },
    spent: { label: "Spent", color: "hsl(200, 85%, 55%)" },
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your order history and spending.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-tertiary/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-tertiary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-foreground">{formatAmount(stats.totalSpent)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platforms Used</p>
                  <p className="text-2xl font-bold text-foreground">{stats.platformStats.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg per Order</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalOrders > 0 ? formatAmount(stats.totalSpent / stats.totalOrders) : formatAmount(0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders Over Time */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Orders Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.monthlyData}>
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="orders" fill="hsl(270, 80%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No order data yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Spending by Platform */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Spending by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.platformStats.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-4">
                  <div className="h-[200px] w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.platformStats}
                          dataKey="spent"
                          nameKey="platform"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={false}
                        >
                          {stats.platformStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {stats.platformStats.map((platform, index) => (
                      <div key={platform.platform} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm capitalize text-foreground">{platform.platform}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{formatAmount(platform.spent)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No platform data yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Most Ordered Services */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Most Ordered Services</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.serviceStats.length > 0 ? (
                <div className="space-y-4">
                  {stats.serviceStats.map((service, index) => (
                    <div key={service.service} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-muted-foreground w-6">#{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-foreground">{service.service}</span>
                          <span className="text-sm font-medium text-foreground">{service.count} orders</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(service.count / stats.serviceStats[0].count) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center text-muted-foreground">
                  No service data yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
