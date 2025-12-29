import { useState } from "react";
import { motion } from "framer-motion";
import { 
  RefreshCcw, 
  Search, 
  ArrowLeft,
  Calendar,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface RefundRequest {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  notes: string | null;
  orders?: {
    service: string;
    platform: string;
    quantity: number;
    external_order_id: string | null;
  };
  profiles?: {
    username: string | null;
    full_name: string | null;
  };
}

const AdminRefunds = () => {
  const { formatAmount } = useCurrency();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  // Fetch all refund requests
  const { data: refunds, isLoading } = useQuery({
    queryKey: ["admin-refunds"],
    queryFn: async () => {
      const { data: refundsData, error } = await supabase
        .from("refund_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related orders
      const orderIds = [...new Set(refundsData.map(r => r.order_id))];
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, service, platform, quantity, external_order_id")
        .in("id", orderIds);

      const ordersMap = new Map(ordersData?.map(o => [o.id, o]) || []);

      // Fetch profiles
      const userIds = [...new Set(refundsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return refundsData.map(refund => ({
        ...refund,
        orders: ordersMap.get(refund.order_id) || null,
        profiles: profilesMap.get(refund.user_id) || { username: null, full_name: null }
      })) as RefundRequest[];
    },
  });

  const approveRefund = async (refund: RefundRequest) => {
    setProcessing(refund.id);
    try {
      // Get current user balance
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", refund.user_id)
        .single();

      if (profileError) throw profileError;

      const newBalance = (profile?.balance || 0) + Number(refund.amount);

      // Update user balance
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", refund.user_id);

      if (balanceError) throw balanceError;

      // Create refund transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: refund.user_id,
          type: "refund",
          amount: Number(refund.amount),
          status: "completed",
          description: `Refund for cancelled order #${refund.order_id.slice(0, 8)}`,
          reference_id: refund.order_id,
        });

      if (transactionError) throw transactionError;

      // Update order status to refunded
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "refunded" })
        .eq("id", refund.order_id);

      if (orderError) throw orderError;

      // Update refund request status
      const { data: { user } } = await supabase.auth.getUser();
      const { error: refundError } = await supabase
        .from("refund_requests")
        .update({ 
          status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq("id", refund.id);

      if (refundError) throw refundError;

      toast({
        title: "Refund approved",
        description: `${formatAmount(refund.amount)} credited to user's balance.`,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelectedRefund(null);
    } catch (error: any) {
      toast({
        title: "Refund failed",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const rejectRefund = async (refund: RefundRequest) => {
    setProcessing(refund.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("refund_requests")
        .update({ 
          status: "rejected",
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          notes: refund.notes ? `${refund.notes}\n\nRejection reason: ${rejectionNote}` : `Rejection reason: ${rejectionNote}`
        })
        .eq("id", refund.id);

      if (error) throw error;

      toast({
        title: "Refund rejected",
        description: "The refund request has been rejected.",
      });

      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      setSelectedRefund(null);
      setRejectionNote("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject refund",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const filteredRefunds = refunds?.filter(refund => {
    const matchesSearch = 
      refund.orders?.service?.toLowerCase().includes(search.toLowerCase()) ||
      refund.orders?.platform?.toLowerCase().includes(search.toLowerCase()) ||
      refund.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
      refund.order_id.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge className="bg-secondary text-muted-foreground">{status}</Badge>;
    }
  };

  // Calculate stats
  const pendingRefunds = refunds?.filter(r => r.status === 'pending') || [];
  const totalPendingAmount = pendingRefunds.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
            <RefreshCcw className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Refund Requests</h1>
            <p className="text-muted-foreground text-sm">
              Review and approve refund requests for cancelled orders.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Requests</p>
          <p className="text-2xl font-bold text-foreground">{refunds?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-500">{pendingRefunds.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Pending Amount</p>
          <p className="text-2xl font-bold text-foreground">{formatAmount(totalPendingAmount)}</p>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingRefunds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Pending Refund Requests</p>
            <p className="text-sm text-muted-foreground">
              You have {pendingRefunds.length} refund request(s) waiting for approval totaling {formatAmount(totalPendingAmount)}.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by service, platform, user, order ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      {/* Refunds Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Order ID</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Service</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading refund requests...
                  </td>
                </tr>
              ) : filteredRefunds?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No refund requests found.
                  </td>
                </tr>
              ) : (
                filteredRefunds?.map((refund, index) => (
                  <motion.tr
                    key={refund.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border last:border-0 hover:bg-accent/30"
                  >
                    <td className="p-4">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{refund.order_id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">
                        {refund.profiles?.username || refund.profiles?.full_name || "Unknown"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground truncate max-w-[200px]">
                          {refund.orders?.service || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">{refund.orders?.platform || ""}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">{formatAmount(refund.amount)}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(refund.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(refund.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      {refund.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-500 border-green-500/20 hover:bg-green-500/10"
                            disabled={processing === refund.id}
                            onClick={() => approveRefund(refund)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => setSelectedRefund(refund)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          View Details
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Detail/Rejection Dialog */}
      <Dialog open={!!selectedRefund} onOpenChange={() => { setSelectedRefund(null); setRejectionNote(""); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedRefund?.status === 'pending' ? 'Reject Refund Request' : 'Refund Details'}
            </DialogTitle>
            {selectedRefund?.status === 'pending' && (
              <DialogDescription>
                Please provide a reason for rejecting this refund request.
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono text-foreground">{selectedRefund.order_id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-muted-foreground">External ID</p>
                  <p className="font-mono text-foreground">{selectedRefund.orders?.external_order_id || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium text-foreground">{selectedRefund.profiles?.username || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium text-foreground">{formatAmount(selectedRefund.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="text-foreground">{selectedRefund.orders?.service || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRefund.status)}
                </div>
              </div>

              {selectedRefund.notes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Notes</p>
                  <p className="text-sm text-foreground bg-secondary/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedRefund.notes}
                  </p>
                </div>
              )}

              {selectedRefund.status === 'pending' && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Rejection Reason</p>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    className="bg-card border-border"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="destructive"
                      disabled={processing === selectedRefund.id || !rejectionNote.trim()}
                      onClick={() => rejectRefund(selectedRefund)}
                      className="flex-1"
                    >
                      {processing === selectedRefund.id ? "Processing..." : "Confirm Rejection"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setSelectedRefund(null); setRejectionNote(""); }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {selectedRefund.approved_at && (
                <div className="text-sm text-muted-foreground">
                  {selectedRefund.status === 'approved' ? 'Approved' : 'Rejected'} on {new Date(selectedRefund.approved_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRefunds;
