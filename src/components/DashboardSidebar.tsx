import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  History,
  Wallet,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ShieldCheck,
  Receipt,
  BarChart3,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { ThemeToggle } from "./ThemeToggle";
import epikLogo from "@/assets/epik-logo.png";

const navItems = [
  { name: "New Order", href: "/dashboard", icon: ShoppingCart },
  { name: "Orders", href: "/dashboard/orders", icon: History },
  { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "Referrals", href: "/dashboard/referrals", icon: Users },
  { name: "Add Funds", href: "/dashboard/funds", icon: Wallet },
  { name: "Support", href: "/dashboard/support", icon: HelpCircle },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const DashboardSidebar = () => {
  const location = useLocation();
  const { profile, signOut, isAdmin } = useAuth();
  const { formatAmount } = useCurrency();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={epikLogo} alt="Epik" className="h-14 w-auto" />
        </Link>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-accent rounded-full pl-3 pr-1 py-1">
            <span className="text-sm font-semibold text-foreground">
              {formatAmount(profile?.balance || 0)}
            </span>
            <Link to="/dashboard/funds">
              <Button variant="icon" size="icon" className="h-7 w-7 bg-primary text-primary-foreground">
                <Plus className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            {isMobileOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <motion.aside
        initial={{ x: "-100%" }}
        animate={{ x: isMobileOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 20 }}
        className="lg:hidden fixed top-16 left-0 bottom-0 w-64 bg-card border-r border-border z-50 p-4"
      >
        {/* Logout at top */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/dashboard/admin"
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname.startsWith("/dashboard/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
              Admin
            </Link>
          )}
        </nav>
      </motion.aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border flex-col z-40">
        {/* Logo & Logout */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={epikLogo} alt="Epik" className="h-16 w-auto" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Balance */}
        <div className="p-4 border-b border-border">
          <div className="bg-accent rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">
                {formatAmount(profile?.balance || 0)}
              </span>
              <Link to="/dashboard/funds">
                <Button variant="default" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {isActive(item.href) && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"
                />
              )}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/dashboard/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname.startsWith("/dashboard/admin")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-5 w-5" />
              Admin
              {location.pathname.startsWith("/dashboard/admin") && (
                <motion.div
                  layoutId="sidebar-indicator-admin"
                  className="ml-auto w-1.5 h-1.5 bg-primary rounded-full"
                />
              )}
            </Link>
          )}
        </nav>

        {/* User Info & Theme */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {profile?.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.username || "User"}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
};
