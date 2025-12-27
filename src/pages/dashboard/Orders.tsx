import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
}

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-accent text-accent-foreground",
  processing: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
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
    };

    fetchOrders();
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
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Order History</h1>
        <p className="text-muted-foreground mt-1">
          Track all your orders in one place.
        </p>
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
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
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
                      <td className="px-6 py-4 text-sm text-foreground capitalize">
                        {order.platform}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground max-w-[200px] truncate">
                        {order.service}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {order.quantity.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        ${Number(order.charge).toFixed(2)}
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
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {orders.map((order, index) => (
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
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        statusStyles[order.status]
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{order.platform}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.service}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <div>
                      <span className="text-lg font-bold text-foreground">
                        ${Number(order.charge).toFixed(2)}
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
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Orders;
