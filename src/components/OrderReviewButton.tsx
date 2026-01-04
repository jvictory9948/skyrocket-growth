import { useState } from "react";
import { Star, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceReviewDialog } from "./ServiceReviewDialog";
import { useServiceReviews, ServiceReview } from "@/hooks/useServiceReviews";
import { cn } from "@/lib/utils";

interface OrderReviewButtonProps {
  orderId: string;
  serviceId: string;
  serviceName: string;
  platform: string;
  orderStatus: string;
  existingReview?: ServiceReview | null;
  variant?: "default" | "compact";
}

export const OrderReviewButton = ({
  orderId,
  serviceId,
  serviceName,
  platform,
  orderStatus,
  existingReview,
  variant = "default",
}: OrderReviewButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { submitReview, updateReview } = useServiceReviews();

  // Only allow reviews for completed orders
  if (orderStatus !== "completed") {
    return null;
  }

  const handleSubmit = async (rating: number, comment: string) => {
    if (existingReview) {
      await updateReview(existingReview.id, rating, comment);
    } else {
      await submitReview(orderId, serviceId, serviceName, platform, rating, comment);
    }
  };

  if (existingReview) {
    return (
      <>
        <button
          onClick={() => setDialogOpen(true)}
          className={cn(
            "flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors",
            variant === "compact" ? "text-xs" : "text-sm"
          )}
        >
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  variant === "compact" ? "h-3 w-3" : "h-4 w-4",
                  star <= existingReview.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                )}
              />
            ))}
          </div>
          <Pencil className={variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </button>

        <ServiceReviewDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          serviceName={serviceName}
          platform={platform}
          initialRating={existingReview.rating}
          initialComment={existingReview.comment || ""}
          isEditing
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          variant === "compact" && "h-7 px-2 text-xs"
        )}
      >
        <Star className={variant === "compact" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1"} />
        Rate
      </Button>

      <ServiceReviewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        serviceName={serviceName}
        platform={platform}
        onSubmit={handleSubmit}
      />
    </>
  );
};
