import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  FileText, 
  CreditCard, 
  ShieldCheck,
  TrendingUp,
  UserX,
  Pause,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/hooks/useCurrency";

const AdminDashboard = () => {
  const { formatAmount } = useCurrency();

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersRes, ordersRes, ticketsRes] = await Promise.all([
        supabase.from("profiles").select("id, status", { count: "exact" }),
        supabase.from("orders").select("id, charge", { count: "exact" }),
        supabase.from("support_tickets").select("id, status", { count: "exact" }),
      ]);

      const totalUsers = usersRes.count || 0;
      const suspendedUsers = usersRes.data?.filter(u => u.status === 'suspended').length || 0;
      const pausedUsers = usersRes.data?.filter(u => u.status === 'paused').length || 0;
      const activeUsers = usersRes.data?.filter(u => u.status === 'active').length || 0;
      const totalOrders = ordersRes.count || 0;
      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + Number(o.charge), 0) || 0;
      const openTickets = ticketsRes.data?.filter(t => t.status === 'open').length || 0;

      return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        pausedUsers,
        totalOrders,
        totalRevenue,
        openTickets,
      };
    },
  });

  const statCards = [
    { 
      title: "Total Users", 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: "bg-primary/10 text-primary",
      href: "/dashboard/admin/users"
    },
    { 
      title: "Active Users", 
      value: stats?.activeUsers || 0, 
      icon: Activity, 
      color: "bg-green-500/10 text-green-500",
      href: "/dashboard/admin/users"
    },
    { 
      title: "Suspended", 
      value: stats?.suspendedUsers || 0, 
      icon: UserX, 
      color: "bg-destructive/10 text-destructive",
      href: "/dashboard/admin/users"
    },
    { 
      title: "Paused", 
      value: stats?.pausedUsers || 0, 
      icon: Pause, 
      color: "bg-amber-500/10 text-amber-500",
      href: "/dashboard/admin/users"
    },
    { 
      title: "Total Orders", 
      value: stats?.totalOrders || 0, 
      icon: CreditCard, 
      color: "bg-blue-500/10 text-blue-500",
      href: "/dashboard/admin/orders"
    },
    { 
      title: "Total Revenue", 
      value: formatAmount(stats?.totalRevenue || 0), 
      icon: TrendingUp, 
      color: "bg-emerald-500/10 text-emerald-500",
      href: "/dashboard/admin/orders"
    },
    { 
      title: "Open Tickets", 
      value: stats?.openTickets || 0, 
      icon: FileText, 
      color: "bg-orange-500/10 text-orange-500",
      href: "/dashboard/admin/tickets"
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage users, view transactions, and handle support tickets.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <Link key={stat.title} to={stat.href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className={`h-10 w-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/dashboard/admin/users">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <Users className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Manage Users</h3>
            <p className="text-sm text-muted-foreground">
              View, suspend, pause, or delete user accounts.
            </p>
          </motion.div>
        </Link>

        <Link to="/dashboard/admin/orders">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <CreditCard className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Manage Orders</h3>
            <p className="text-sm text-muted-foreground">
              View, update status, and sync all orders.
            </p>
          </motion.div>
        </Link>

        <Link to="/dashboard/admin/tickets">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors cursor-pointer"
          >
            <FileText className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Support Tickets</h3>
            <p className="text-sm text-muted-foreground">
              Respond to and manage support requests.
            </p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
