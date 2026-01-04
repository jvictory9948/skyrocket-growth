import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ServiceReview {
  id: string;
  user_id: string;
  order_id: string;
  service_id: string;
  service_name: string;
  platform: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export const useServiceReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserReviews = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("service_reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else {
      setReviews(data as ServiceReview[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);

  const hasReviewedOrder = useCallback(
    (orderId: string) => {
      return reviews.some((review) => review.order_id === orderId);
    },
    [reviews]
  );

  const getReviewForOrder = useCallback(
    (orderId: string) => {
      return reviews.find((review) => review.order_id === orderId);
    },
    [reviews]
  );

  const submitReview = async (
    orderId: string,
    serviceId: string,
    serviceName: string,
    platform: string,
    rating: number,
    comment?: string
  ) => {
    if (!user) return { success: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("service_reviews")
      .insert({
        user_id: user.id,
        order_id: orderId,
        service_id: serviceId,
        service_name: serviceName,
        platform,
        rating,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review");
      return { success: false, error: error.message };
    }

    setReviews((prev) => [data as ServiceReview, ...prev]);
    toast.success("Review submitted successfully!");
    return { success: true, data };
  };

  const updateReview = async (reviewId: string, rating: number, comment?: string) => {
    if (!user) return { success: false, error: "Not authenticated" };

    const { data, error } = await supabase
      .from("service_reviews")
      .update({ rating, comment: comment || null })
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
      return { success: false, error: error.message };
    }

    setReviews((prev) =>
      prev.map((review) => (review.id === reviewId ? (data as ServiceReview) : review))
    );
    toast.success("Review updated successfully!");
    return { success: true, data };
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("service_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
      return { success: false, error: error.message };
    }

    setReviews((prev) => prev.filter((review) => review.id !== reviewId));
    toast.success("Review deleted successfully!");
    return { success: true };
  };

  return {
    reviews,
    loading,
    hasReviewedOrder,
    getReviewForOrder,
    submitReview,
    updateReview,
    deleteReview,
    refreshReviews: fetchUserReviews,
  };
};
