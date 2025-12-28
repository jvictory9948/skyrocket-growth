import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, CreditCard, Bitcoin, Wallet, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  CreditCard,
  Bitcoin,
  Wallet,
  Banknote,
};

interface ManualDetails {
  bank_name?: string;
  account_name?: string;
  account_number?: string;
  instructions?: string;
  whatsapp_number?: string;
}

interface PaymentMethod {
  id: string;
  method_id: string;
  name: string;
  icon: string;
  is_enabled: boolean;
  display_order: number;
  details: ManualDetails;
}

const AdminPaymentMethods = () => {
  const queryClient = useQueryClient();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [manualDetails, setManualDetails] = useState<ManualDetails>({});

  const { data: paymentMethods, isLoading } = useQuery({
    queryKey: ["payment-methods-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  useEffect(() => {
    if (paymentMethods) {
      setMethods(paymentMethods);
      const manual = paymentMethods.find(m => m.method_id === "manual");
      if (manual?.details) {
        setManualDetails(manual.details as ManualDetails);
      }
    }
  }, [paymentMethods]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const method of methods) {
        const updateData: Record<string, unknown> = {
          is_enabled: method.is_enabled,
        };
        if (method.method_id === "manual") {
          updateData.details = manualDetails as Record<string, string>;
        }
        const { error } = await supabase
          .from("payment_methods")
          .update(updateData)
          .eq("id", method.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods-admin"] });
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast({ title: "Saved", description: "Payment methods updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleToggle = (id: string, enabled: boolean) => {
    setMethods(methods.map(m => m.id === id ? { ...m, is_enabled: enabled } : m));
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const manualMethod = methods.find(m => m.method_id === "manual");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Payment Methods</h1>
        <p className="text-muted-foreground mt-1">
          Toggle payment methods on/off and configure manual transfer details.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
        {/* Payment Methods Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-soft border border-border p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Available Methods</h3>
          <div className="space-y-4">
            {methods.map((method) => {
              const Icon = iconMap[method.icon] || CreditCard;
              return (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{method.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {method.is_enabled ? "Visible to users" : "Hidden from users"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={method.is_enabled}
                    onCheckedChange={(checked) => handleToggle(method.id, checked)}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Manual Transfer Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-soft border border-border p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Manual Transfer Details
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These details will be shown to users when they select Manual Transfer.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bank Name
              </label>
              <Input
                placeholder="e.g., First Bank"
                value={manualDetails.bank_name || ""}
                onChange={(e) =>
                  setManualDetails({ ...manualDetails, bank_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Account Name
              </label>
              <Input
                placeholder="e.g., Epic SMM Panel"
                value={manualDetails.account_name || ""}
                onChange={(e) =>
                  setManualDetails({ ...manualDetails, account_name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Account Number
              </label>
              <Input
                placeholder="e.g., 1234567890"
                value={manualDetails.account_number || ""}
                onChange={(e) =>
                  setManualDetails({ ...manualDetails, account_number: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                WhatsApp Number
              </label>
              <Input
                placeholder="e.g., +2348012345678"
                value={manualDetails.whatsapp_number || ""}
                onChange={(e) =>
                  setManualDetails({ ...manualDetails, whatsapp_number: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Users will click this to send their payment receipt via WhatsApp.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Additional Instructions
              </label>
              <Textarea
                placeholder="e.g., Use your email as payment reference. Funds will be credited within 24 hours after confirmation."
                value={manualDetails.instructions || ""}
                onChange={(e) =>
                  setManualDetails({ ...manualDetails, instructions: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-8">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save All Changes
        </Button>
      </div>
    </div>
  );
};

export default AdminPaymentMethods;
