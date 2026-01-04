import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { Button } from "@/components/ui/button";

type TransactionType = "deposit" | "charge" | "refund";

interface Transaction {
  id: string;
  created_at: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  status: string;
}

const typeStyles: Record<TransactionType, { bg: string; icon: typeof ArrowDownLeft; color: string }> = {
  deposit: { bg: "bg-success/10", icon: ArrowDownLeft, color: "text-success" },
  charge: { bg: "bg-destructive/10", icon: ArrowUpRight, color: "text-destructive" },
  refund: { bg: "bg-info/10", icon: ArrowDownLeft, color: "text-info" },
};

const Transactions = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground mt-1">
            View all your deposits, charges, and refunds.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransactions}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertDescription className="text-amber-700 dark:text-amber-400">
          Transactions older than 30 days are automatically cleared from history. Please save any important records before this period.
        </AlertDescription>
      </Alert>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden"
      >
        {transactions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Date</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Description</th>
                    <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Amount</th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => {
                    const style = typeStyles[tx.type];
                    const Icon = style.icon;
                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="border-t border-border hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${style.bg}`}>
                              <Icon className={`h-4 w-4 ${style.color}`} />
                            </div>
                            <span className="text-sm font-medium text-foreground capitalize">{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {tx.description || "-"}
                        </td>
                        <td className={`px-6 py-4 text-sm font-semibold text-right ${tx.type === 'charge' ? 'text-destructive' : 'text-success'}`}>
                          {tx.type === 'charge' ? '-' : '+'}{formatAmount(Math.abs(tx.amount))}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            tx.status === 'completed' ? 'bg-success/10 text-success' :
                            tx.status === 'pending' ? 'bg-accent text-accent-foreground' :
                            'bg-destructive/10 text-destructive'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {transactions.map((tx, index) => {
                const style = typeStyles[tx.type];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-secondary/50 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${style.bg}`}>
                          <Icon className={`h-4 w-4 ${style.color}`} />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-foreground capitalize">{tx.type}</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${tx.type === 'charge' ? 'text-destructive' : 'text-success'}`}>
                        {tx.type === 'charge' ? '-' : '+'}{formatAmount(Math.abs(tx.amount))}
                      </span>
                    </div>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-border">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        tx.status === 'completed' ? 'bg-success/10 text-success' :
                        tx.status === 'pending' ? 'bg-accent text-accent-foreground' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Transactions;