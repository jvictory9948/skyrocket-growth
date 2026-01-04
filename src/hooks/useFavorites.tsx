import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface FavoriteService {
  id: string;
  service_id: string;
  service_name: string;
  platform: string;
  created_at: string;
}

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("favorite_services")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (serviceId: string, serviceName: string, platform: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("favorite_services").insert({
        user_id: user.id,
        service_id: serviceId,
        service_name: serviceName,
        platform: platform,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already saved", description: "This service is already in your favorites." });
          return;
        }
        throw error;
      }

      toast({ title: "Saved!", description: "Service added to favorites." });
      fetchFavorites();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add favorite.", variant: "destructive" });
    }
  };

  const removeFavorite = async (serviceId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("favorite_services")
        .delete()
        .eq("user_id", user.id)
        .eq("service_id", serviceId);

      if (error) throw error;

      toast({ title: "Removed", description: "Service removed from favorites." });
      fetchFavorites();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove favorite.", variant: "destructive" });
    }
  };

  const isFavorite = (serviceId: string) => {
    return favorites.some((f) => f.service_id === serviceId);
  };

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refreshFavorites: fetchFavorites,
  };
};
