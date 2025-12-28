import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { socialIcons } from "@/components/icons/SocialIcons";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

interface Order {
  id: string;
  created_at: string;
  platform: string;
  service: string;
  link: string;
  quantity: number;
  charge: number;
  status: OrderStatus;
  external_order_id: string | null;
}

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-accent text-accent-foreground animate-pulse",
  processing: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const Orders = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);

  const syncOrderStatus = async (order: Order) => {
    if (!order.external_order_id) {
      toast({
        title: "Cannot sync",
        description: "This order doesn't have an external ID to sync.",
        variant: "destructive",
      });
      return;
    }

    setSyncingOrderId(order.id);
    try {
      const { data, error } = await supabase.functions.invoke('sync-order-status', {
        body: { external_order_id: order.external_order_id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Update the order status in database
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: data.status })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, status: data.status } : o
      ));

      toast({
        title: "Status synced",
        description: `Order status updated to: ${data.status}`,
      });
    } catch (error: any) {
      toast({
        title: "Sync failed",
        description: error.message || "Failed to sync order status",
        variant: "destructive",
      });
    } finally {
      setSyncingOrderId(null);
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to realtime order updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Order update received:', payload);
          
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => 
              order.id === payload.new.id ? payload.new as Order : order
            ));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(order => order.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Order History</h1>
          <p className="text-muted-foreground mt-1">
            Track all your orders in real-time.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden"
      >
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No orders yet. Place your first order!</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">ID</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Platform</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Service</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Qty</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Charge</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => {
                    const PlatformIcon = socialIcons[order.platform];
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-t border-border hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-mono text-foreground">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {PlatformIcon && <PlatformIcon className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm text-foreground capitalize">{order.platform}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground max-w-[200px] truncate">
                          {order.service}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {order.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {formatAmount(Number(order.charge))}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              statusStyles[order.status]
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {order.external_order_id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => syncOrderStatus(order)}
                              disabled={syncingOrderId === order.id}
                            >
                              <RotateCcw className={`h-4 w-4 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {orders.map((order, index) => {
                const PlatformIcon = socialIcons[order.platform];
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-secondary/50 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-semibold text-foreground font-mono">
                          #{order.id.slice(0, 8)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            statusStyles[order.status]
                          }`}
                        >
                          {order.status}
                        </span>
                        {order.external_order_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => syncOrderStatus(order)}
                            disabled={syncingOrderId === order.id}
                          >
                            <RotateCcw className={`h-4 w-4 ${syncingOrderId === order.id ? 'animate-spin' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {PlatformIcon && <PlatformIcon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium text-foreground capitalize">{order.platform}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{order.service}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <div>
                        <span className="text-lg font-bold text-foreground">
                          {formatAmount(Number(order.charge))}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {order.quantity.toLocaleString()} units
                        </span>
                      </div>
                      <a
                        href={order.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary"
                      >
                        View Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Orders;
