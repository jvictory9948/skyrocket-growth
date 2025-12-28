import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingCart, 
  Search, 
  ArrowLeft,
  Calendar,
  ExternalLink,
  RotateCcw,
  Filter
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

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
  external_order_id: string | null;
  profiles?: {
    username: string | null;
    full_name: string | null;
  };
}

const AdminOrders = () => {
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Fetch all orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ["admin-orders"],
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
        .select("id, username, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return ordersData.map(order => ({
        ...order,
        profiles: profilesMap.get(order.user_id) || { username: null, full_name: null }
      })) as Order[];
    },
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Order status changed to ${newStatus}`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedOrder(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const syncAllOrders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sync-all-orders');
      
      if (error) throw error;

      toast({
        title: "Sync complete",
        description: `Synced ${data.synced} orders. ${data.errors} errors.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync orders",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.service.toLowerCase().includes(search.toLowerCase()) ||
      order.platform.toLowerCase().includes(search.toLowerCase()) ||
      order.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.external_order_id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
  const totalRevenue = filteredOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0;
  const totalOrders = filteredOrders?.length || 0;
  const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Manage Orders</h1>
              <p className="text-muted-foreground text-sm">
                View and manage all orders across the platform.
              </p>
            </div>
          </div>
          <Button onClick={syncAllOrders} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Sync All Statuses
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold text-foreground">{orders?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Pending/Processing</p>
          <p className="text-2xl font-bold text-amber-500">{pendingOrders}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">{formatAmount(orders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by service, platform, user, order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">External ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Charge</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No orders found.
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
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs text-muted-foreground">
                        {order.external_order_id || "-"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">
                        {order.profiles?.username || order.profiles?.full_name || "Unknown"}
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
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          Manage
                        </Button>
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono text-foreground">{selectedOrder.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-muted-foreground">External ID</p>
                  <p className="font-mono text-foreground">{selectedOrder.external_order_id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium text-foreground">{selectedOrder.profiles?.username || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Platform</p>
                  <p className="text-foreground capitalize">{selectedOrder.platform}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="text-foreground">{selectedOrder.service}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="text-foreground">{selectedOrder.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Charge</p>
                  <p className="font-medium text-foreground">{formatAmount(selectedOrder.charge)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="text-foreground">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">Link</p>
                <a 
                  href={selectedOrder.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm break-all"
                >
                  {selectedOrder.link}
                </a>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {["pending", "processing", "completed", "cancelled"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.status === status ? "default" : "outline"}
                      size="sm"
                      disabled={updatingStatus === selectedOrder.id}
                      onClick={() => updateOrderStatus(selectedOrder.id, status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
