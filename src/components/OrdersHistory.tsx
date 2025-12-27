import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

interface Order {
  id: string;
  date: string;
  service: string;
  link: string;
  charge: number;
  status: OrderStatus;
}

const orders: Order[] = [
  {
    id: "#12345",
    date: "2024-12-27",
    service: "Instagram Followers [Refill]",
    link: "instagram.com/user123",
    charge: 5.0,
    status: "completed",
  },
  {
    id: "#12344",
    date: "2024-12-26",
    service: "TikTok Views [Real]",
    link: "tiktok.com/@creator",
    charge: 2.5,
    status: "processing",
  },
  {
    id: "#12343",
    date: "2024-12-25",
    service: "YouTube Subscribers [Real]",
    link: "youtube.com/channel/xyz",
    charge: 15.0,
    status: "pending",
  },
  {
    id: "#12342",
    date: "2024-12-24",
    service: "Twitter Likes",
    link: "twitter.com/handle",
    charge: 3.0,
    status: "completed",
  },
  {
    id: "#12341",
    date: "2024-12-23",
    service: "Instagram Likes [Real HQ]",
    link: "instagram.com/p/abc123",
    charge: 1.0,
    status: "cancelled",
  },
];

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-accent text-accent-foreground",
  processing: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export const OrdersHistory = () => {
  return (
    <section id="dashboard" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Order History</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Track all your orders in one place. Real-time status updates included.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden"
        >
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Service</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Link</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Charge</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t border-border hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{order.id}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{order.service}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <a
                        href={`https://${order.link}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                      >
                        {order.link.length > 25 ? order.link.substring(0, 25) + "..." : order.link}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      ${order.charge.toFixed(2)}
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-secondary/50 rounded-xl p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{order.id}</span>
                    <p className="text-xs text-muted-foreground">{order.date}</p>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      statusStyles[order.status]
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-foreground">{order.service}</p>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-lg font-bold text-foreground">${order.charge.toFixed(2)}</span>
                  <a
                    href={`https://${order.link}`}
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

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 py-6 border-t border-border">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                className={`h-8 w-8 rounded-full text-sm font-medium transition-all ${
                  page === 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
