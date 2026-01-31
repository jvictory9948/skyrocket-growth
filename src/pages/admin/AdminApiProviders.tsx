import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Server, ToggleLeft, ToggleRight, Star, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface ApiProvider {
  id: string;
  provider_id: string;
  name: string;
  api_url: string;
  is_enabled: boolean;
  is_primary: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const AdminApiProviders = () => {
  const queryClient = useQueryClient();
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["api-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_providers")
        .select("*")
        .order("display_order");

      if (error) throw error;
      return data as ApiProvider[];
    },
  });

  const toggleProviderMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      const { error } = await supabase
        .from("api_providers")
        .update({ is_enabled: isEnabled })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-providers"] });
      toast({
        title: "Provider updated",
        description: "API provider status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update provider",
        variant: "destructive",
      });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, set all providers to non-primary
      const { error: resetError } = await supabase
        .from("api_providers")
        .update({ is_primary: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (resetError) throw resetError;

      // Then set the selected provider as primary
      const { error } = await supabase
        .from("api_providers")
        .update({ is_primary: true, is_enabled: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-providers"] });
      toast({
        title: "Primary provider set",
        description: "The primary API provider has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set primary provider",
        variant: "destructive",
      });
    },
  });

  const handleTestProvider = async (provider: ApiProvider) => {
    setTestingProvider(provider.id);
    try {
      const { data, error } = await supabase.functions.invoke("get-services");

      if (error) throw error;

      const providerServices = Array.isArray(data) 
        ? data.filter((s: { provider_id?: string }) => s.provider_id === provider.provider_id)
        : [];

      toast({
        title: "Connection successful",
        description: `Found ${providerServices.length} services from ${provider.name}.`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTestingProvider(null);
    }
  };

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
        <Link to="/dashboard/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">API Providers</h1>
            <p className="text-muted-foreground">Manage SMM API providers and toggle them on/off.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 max-w-3xl">
        {providers?.map((provider, index) => (
          <motion.div
            key={provider.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">{provider.name}</h3>
                  {provider.is_primary && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Primary
                    </Badge>
                  )}
                  {provider.is_enabled ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Enabled
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                      Disabled
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  Provider ID: <code className="bg-secondary px-1 rounded">{provider.provider_id}</code>
                </p>
                <p className="text-sm text-muted-foreground">
                  API URL: <code className="bg-secondary px-1 rounded text-xs">{provider.api_url}</code>
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestProvider(provider)}
                  disabled={testingProvider === provider.id}
                >
                  {testingProvider === provider.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-1">Test</span>
                </Button>
                
                <Button
                  variant={provider.is_enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleProviderMutation.mutate({ 
                    id: provider.id, 
                    isEnabled: !provider.is_enabled 
                  })}
                  disabled={toggleProviderMutation.isPending}
                >
                  {provider.is_enabled ? (
                    <>
                      <ToggleRight className="h-4 w-4 mr-1" />
                      On
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 mr-1" />
                      Off
                    </>
                  )}
                </Button>
                
                {!provider.is_primary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPrimaryMutation.mutate(provider.id)}
                    disabled={setPrimaryMutation.isPending}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Set Primary
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 bg-secondary/50 rounded-xl p-6 max-w-3xl">
        <h3 className="font-semibold text-foreground mb-2">How it works</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• <strong>Enable/Disable:</strong> Toggle which providers are active. Services from disabled providers won't appear.</li>
          <li>• <strong>Primary Provider:</strong> The primary provider is used as the default when placing orders.</li>
          <li>• <strong>Multiple Providers:</strong> When multiple providers are enabled, services from all providers will be shown together.</li>
          <li>• <strong>Test:</strong> Click Test to verify the API connection and see how many services are available.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminApiProviders;
