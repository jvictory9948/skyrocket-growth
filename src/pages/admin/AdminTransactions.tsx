import { useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Search, 
  ArrowLeft,
  Calendar,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  user_id: string;
  service: string;
  platform: string;
  quantity: number;
  charge: number;
  status: string;
  link: string;
  created_at: string;
  profiles?: {
    username: string | null;
  };
}

const AdminTransactions = () => {
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState("");

  // Fetch all orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(ordersData.map(o => o.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return ordersData.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || { username: null }
      })) as Order[];
    },
  });

  const filteredOrders = orders?.filter(order => 
    order.service.toLowerCase().includes(search.toLowerCase()) ||
    order.platform.toLowerCase().includes(search.toLowerCase()) ||
    order.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
    order.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
      default:
        return <Badge className="bg-secondary text-muted-foreground">{status}</Badge>;
    }
  };

  // Calculate totals
  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0;
  const totalOrders = orders?.length || 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">All Transactions</h1>
        </div>
        <p className="text-muted-foreground">
          View all orders and transactions across the platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">{formatAmount(totalRevenue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, platform, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Charge</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading transactions...
                  </td>
                </tr>
              ) : filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredOrders?.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border last:border-0 hover:bg-accent/30"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm text-muted-foreground">
                        {order.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">
                        {order.profiles?.username || "Unknown"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground truncate max-w-[200px]">{order.service}</p>
                        <p className="text-xs text-muted-foreground">{order.platform}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-foreground">{order.quantity.toLocaleString()}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">{formatAmount(order.charge)}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
