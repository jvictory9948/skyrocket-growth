import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/hooks/useAuth";
import { PausedBanner } from "@/components/PausedBanner";

export const DashboardLayout = () => {
  const { user, loading, userStatus, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Redirect suspended users to suspended page
    if (!loading && user && userStatus === 'suspended') {
      navigate("/suspended");
    }
  }, [user, loading, userStatus, navigate]);

  // Protect admin routes
  useEffect(() => {
    if (!loading && user && location.pathname.startsWith("/dashboard/admin") && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, location.pathname, navigate]);

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

  // Suspended users should be redirected
  if (userStatus === 'suspended') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-0">
          {userStatus === 'paused' && (
            <div className="px-6 lg:px-8 pt-6 lg:pt-8">
              <PausedBanner />
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
};
