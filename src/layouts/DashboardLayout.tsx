import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";

export const DashboardLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};
