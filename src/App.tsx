import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/hooks/useCurrency";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Suspended from "./pages/Suspended";
import { DashboardLayout } from "./layouts/DashboardLayout";
import NewOrder from "./pages/dashboard/NewOrder";
import Orders from "./pages/dashboard/Orders";
import Transactions from "./pages/dashboard/Transactions";
import Funds from "./pages/dashboard/Funds";
import Support from "./pages/dashboard/Support";
import Settings from "./pages/dashboard/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminTickets from "./pages/admin/AdminTickets";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/suspended" element={<Suspended />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<NewOrder />} />
                <Route path="orders" element={<Orders />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="funds" element={<Funds />} />
                <Route path="support" element={<Support />} />
                <Route path="settings" element={<Settings />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="admin/users" element={<AdminUsers />} />
                <Route path="admin/transactions" element={<AdminTransactions />} />
                <Route path="admin/tickets" element={<AdminTickets />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
