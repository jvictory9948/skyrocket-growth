import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Loader2, Search, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getPlatformIcon } from "@/components/icons/PlatformIcons";

interface Platform {
  id: string;
  platform_key: string;
  name: string;
  keywords: string[];
  is_enabled: boolean;
  display_order: number;
  icon_key: string | null;
}

const AdminPlatforms = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: platforms, isLoading } = useQuery({
    queryKey: ["admin-platforms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platforms")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Platform[];
    },
  });

  // Fetch services to know which platforms have API services
  const { data: allServices } = useQuery({
    queryKey: ["all-services-for-platforms"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-services");
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from("platforms")
        .update({ is_enabled: isEnabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-platforms"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getPlatformServiceCount = (platform: Platform): number => {
    if (!allServices) return 0;
    return allServices.filter((s: { name: string; category: string }) => {
      const name = s.name.toLowerCase();
      const category = s.category.toLowerCase();
      return platform.keywords.some(
        (kw) => name.includes(kw.toLowerCase()) || category.includes(kw.toLowerCase())
      );
    }).length;
  };

  const filtered = platforms?.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.platform_key.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <Link
          to="/dashboard/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Manage Platforms
            </h1>
            <p className="text-muted-foreground">
              Enable or disable platforms shown on the order page.
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search platforms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="max-w-3xl space-y-1">
        {filtered?.map((platform, index) => {
          const Icon = getPlatformIcon(platform.platform_key);
          const serviceCount = getPlatformServiceCount(platform);
          const hasServices = serviceCount > 0;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.5) }}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                platform.is_enabled
                  ? "bg-card border-border"
                  : "bg-muted/30 border-transparent"
              }`}
            >
              <Checkbox
                checked={platform.is_enabled}
                onCheckedChange={(checked) =>
                  toggleMutation.mutate({
                    id: platform.id,
                    isEnabled: !!checked,
                  })
                }
              />

              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    platform.is_enabled
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {platform.name}
                </p>
              </div>

              {hasServices ? (
                <span className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {serviceCount} services
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No services
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 bg-secondary/50 rounded-xl p-6 max-w-3xl">
        <h3 className="font-semibold text-foreground mb-2">How it works</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>
            • <strong>Checked:</strong> Platform is visible on the New Order
            page for users.
          </li>
          <li>
            • <strong>Unchecked:</strong> Platform is hidden from users even if
            API services exist.
          </li>
          <li>
            • <strong>Services count:</strong> Shows how many services are
            available from the API for each platform.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPlatforms;
