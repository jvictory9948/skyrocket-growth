import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Bitcoin, Wallet, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const paymentMethods = [
  { id: "card", name: "Credit Card", icon: CreditCard },
  { id: "crypto", name: "Crypto", icon: Bitcoin },
  { id: "paypal", name: "PayPal", icon: Wallet },
];

const presetAmounts = [
  { value: 10, bonus: 0 },
  { value: 25, bonus: 3 },
  { value: 50, bonus: 5 },
  { value: 100, bonus: 10 },
  { value: 250, bonus: 15 },
  { value: 500, bonus: 20 },
];

const Funds = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const effectiveAmount = selectedAmount || Number(customAmount) || 0;
  const selectedPreset = presetAmounts.find((a) => a.value === selectedAmount);
  const bonus = selectedPreset?.bonus || 0;
  const totalCredit = effectiveAmount * (1 + bonus / 100);

  const handleAddFunds = async () => {
    if (!user || effectiveAmount <= 0) return;

    setIsLoading(true);

    try {
      // Demo: Just add funds directly (in production, this would go through Stripe)
      const newBalance = (profile?.balance || 0) + totalCredit;
      
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: "Funds added!",
        description: `$${totalCredit.toFixed(2)} has been added to your balance.`,
      });

      setSelectedAmount(null);
      setCustomAmount("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add funds",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

          <div className="flex gap-2 mb-6">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                    selectedMethod === method.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{method.name}</span>
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
        </motion.div>

        {/* Amount Selection */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-soft border border-border p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Select Amount</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {presetAmounts.map((amount) => (
              <motion.button
                key={amount.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedAmount(amount.value);
                  setCustomAmount("");
                }}
                className={`relative p-4 rounded-xl border-2 transition-all ${
                  selectedAmount === amount.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {selectedAmount === amount.value && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="text-2xl font-bold text-foreground">${amount.value}</div>
                {amount.bonus > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2 text-xs font-semibold text-primary">
                    <Sparkles className="h-3 w-3" />
                    +{amount.bonus}% Bonus
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Or enter custom amount
            </label>
            <Input
              type="number"
              placeholder="Enter amount..."
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="h-12 bg-secondary border-border focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Summary */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-sm font-medium text-foreground">
                ${effectiveAmount.toFixed(2)}
              </span>
            </div>
            {bonus > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Bonus ({bonus}%)</span>
                <span className="text-sm font-medium text-primary">
                  +${((effectiveAmount * bonus) / 100).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-semibold text-foreground">Total Credit</span>
              <span className="text-lg font-bold text-foreground">
                ${totalCredit.toFixed(2)}
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
              `Add $${effectiveAmount.toFixed(2)} to Balance`
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Funds;
