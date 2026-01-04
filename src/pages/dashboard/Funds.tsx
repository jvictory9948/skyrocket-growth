import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Bitcoin, Wallet, Loader2, Banknote, Copy, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

declare global {
  interface Window {
    Korapay?: {
      initialize: (config: KorapayConfig) => void;
      close: () => void;
    };
  }
}

interface KorapayConfig {
  key: string;
  reference: string;
  amount: number;
  currency: string;
  customer: {
    name: string;
    email: string;
  };
  notification_url?: string;
  onClose?: () => void;
  onSuccess?: (data: { reference: string; status: string }) => void;
  onFailed?: (data: { reference: string; status: string }) => void;
}

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
  details: ManualDetails;
}

const Funds = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { formatAmount } = useCurrency();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [korapayLoaded, setKorapayLoaded] = useState(false);

  const { data: paymentMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("is_enabled", true)
        .order("display_order");
      if (error) throw error;
      return data as PaymentMethod[];
    },
  });

  const { data: korapaySettings } = useQuery({
    queryKey: ["korapay-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["korapay_public_key"]);
      if (error) throw error;
      const settings: Record<string, string> = {};
      data.forEach((s) => {
        settings[s.setting_key] = s.setting_value || "";
      });
      return settings;
    },
  });

  // Load Korapay script
  useEffect(() => {
    if (document.getElementById("korapay-script")) {
      setKorapayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "korapay-script";
    script.src = "https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js";
    script.async = true;
    script.onload = () => setKorapayLoaded(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (paymentMethods && paymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(paymentMethods[0].method_id);
    }
  }, [paymentMethods, selectedMethod]);

  const effectiveAmount = Number(customAmount) || 0;

  const selectedPaymentMethod = paymentMethods?.find(m => m.method_id === selectedMethod);
  const manualDetails = selectedPaymentMethod?.method_id === "manual" 
    ? (selectedPaymentMethod.details as ManualDetails) 
    : null;

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: "Copied!", description: `${field} copied to clipboard.` });
  };

  const handleAddFunds = async () => {
    if (!user || effectiveAmount <= 0) return;

    if (selectedMethod === "manual") {
      toast({
        title: "Manual Transfer",
        description: "Please complete the bank transfer using the details shown. Your funds will be credited after confirmation.",
      });
      return;
    }

    if (selectedMethod === "korapay") {
      if (!korapaySettings?.korapay_public_key) {
        toast({
          title: "Configuration Error",
          description: "Korapay is not configured. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      if (!korapayLoaded || !window.Korapay) {
        toast({
          title: "Loading...",
          description: "Payment gateway is loading. Please try again.",
        });
        return;
      }

      // Reference format: KP-{fullUserId}-{shortTimestamp} (max 50 chars)
      // UUID is 36 chars, prefix is 3, separator is 1, leaving 10 for timestamp suffix
      const reference = `KP-${user.id}-${Date.now().toString().slice(-8)}`;
      const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/korapay-webhook`;

      window.Korapay.initialize({
        key: korapaySettings.korapay_public_key,
        reference,
        amount: effectiveAmount,
        currency: "NGN",
        customer: {
          name: profile?.username || "Customer",
          email: user.email || "",
        },
        notification_url: webhookUrl,
        onClose: () => {
          console.log("Korapay modal closed");
        },
        onSuccess: async (data) => {
          console.log("Korapay success:", data);
          toast({
            title: "Payment Successful!",
            description: "Your funds will be credited shortly.",
          });
          // Refresh profile after a short delay to allow webhook to process
          setTimeout(() => refreshProfile(), 3000);
        },
        onFailed: (data) => {
          console.log("Korapay failed:", data);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive",
          });
        },
      });
      return;
    }

    setIsLoading(true);

    try {
      const newBalance = (profile?.balance || 0) + effectiveAmount;
      
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (error) throw error;

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: effectiveAmount,
        description: `Deposit of ${formatAmount(effectiveAmount)}`,
        status: "completed",
      });

      supabase.functions.invoke("send-telegram-notification", {
        body: {
          type: "deposit",
          userEmail: user.email,
          username: profile?.username,
          amount: effectiveAmount,
        },
      }).catch((err) => console.log("Notification error (non-blocking):", err));

      await refreshProfile();

      toast({
        title: "Funds added!",
        description: `${formatAmount(effectiveAmount)} has been added to your balance.`,
      });

      setCustomAmount("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add funds";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (methodsLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Add Funds</h1>
        <p className="text-muted-foreground mt-1">
          Top up your account. Get bonus credits on larger deposits!
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-soft border border-border p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Payment Method</h3>

          <div className="flex flex-wrap gap-2 mb-6">
            {paymentMethods?.map((method) => {
              const Icon = iconMap[method.icon] || CreditCard;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.method_id)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    selectedMethod === method.method_id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{method.name}</span>
                </button>
              );
            })}
          </div>

          {selectedMethod === "card" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Card Number
                </label>
                <Input
                  placeholder="1234 5678 9012 3456"
                  className="h-12 bg-secondary border-border focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expiry Date
                  </label>
                  <Input
                    placeholder="MM/YY"
                    className="h-12 bg-secondary border-border focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    CVC
                  </label>
                  <Input
                    placeholder="123"
                    className="h-12 bg-secondary border-border focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedMethod === "korapay" && (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                Pay securely with your card or bank transfer via Korapay.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Supports Nigerian Naira (NGN) payments.
              </p>
            </div>
          )}

          {selectedMethod === "crypto" && (
            <div className="text-center py-8">
              <Bitcoin className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                Send BTC, ETH, or USDT to complete your payment.
              </p>
            </div>
          )}

          {selectedMethod === "paypal" && (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">
                You'll be redirected to PayPal to complete your payment.
              </p>
            </div>
          )}

          {selectedMethod === "manual" && manualDetails && (
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-sm font-medium text-foreground mb-4">
                  Transfer to the following account:
                </p>
                {manualDetails.bank_name && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Bank Name</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{manualDetails.bank_name}</span>
                      <button
                        onClick={() => copyToClipboard(manualDetails.bank_name!, "Bank Name")}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {copiedField === "Bank Name" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {manualDetails.account_name && (
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Account Name</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{manualDetails.account_name}</span>
                      <button
                        onClick={() => copyToClipboard(manualDetails.account_name!, "Account Name")}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {copiedField === "Account Name" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                {manualDetails.account_number && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground font-mono">{manualDetails.account_number}</span>
                      <button
                        onClick={() => copyToClipboard(manualDetails.account_number!, "Account Number")}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {copiedField === "Account Number" ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {manualDetails.instructions && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-foreground">{manualDetails.instructions}</p>
                </div>
              )}
              {manualDetails.whatsapp_number && (
                <Button
                  variant="outline"
                  className="w-full gap-2 bg-green-500/10 border-green-500/30 text-green-600 hover:bg-green-500/20 hover:text-green-700"
                  onClick={() => window.open(`https://wa.me/${manualDetails.whatsapp_number?.replace(/\D/g, '')}?text=Hi, I just made a transfer and would like to send my receipt.`, '_blank')}
                >
                  <MessageCircle className="h-5 w-5" />
                  Send Receipt via WhatsApp
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {/* Amount Entry - Only show for non-manual methods */}
        {selectedMethod !== "manual" && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl shadow-soft border border-border p-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-6">Enter Amount</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount {selectedMethod === "korapay" ? "(NGN)" : "(USD)"}
              </label>
              <Input
                type="number"
                placeholder="Enter amount..."
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="h-12 bg-secondary border-border focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Summary */}
            <div className="bg-secondary/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Amount</span>
                <span className="text-lg font-bold text-foreground">
                  {formatAmount(effectiveAmount)}
                </span>
              </div>
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              disabled={effectiveAmount <= 0 || isLoading}
              onClick={handleAddFunds}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Add ${formatAmount(effectiveAmount)} to Balance`
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Funds;
