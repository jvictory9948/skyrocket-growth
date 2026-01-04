import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  MoreVertical, 
  UserX, 
  Pause, 
  Play, 
  Trash2,
  ArrowLeft,
  Calendar,
  Wallet,
  Loader2,
  KeyRound,
  Globe,
  MapPin
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type UserStatus = 'active' | 'suspended' | 'paused';

interface UserProfile {
  id: string;
  username: string | null;
  balance: number;
  status: UserStatus;
  created_at: string;
  email?: string;
  last_ip?: string | null;
  last_location?: string | null;
  last_login_at?: string | null;
}

const AdminUsers = () => {
  const { formatAmount } = useCurrency();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [addFundsUser, setAddFundsUser] = useState<UserProfile | null>(null);
  const [fundsAmount, setFundsAmount] = useState("");
  
  // Confirmation code state
  const [pendingCodeKey, setPendingCodeKey] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  // Fetch users with their auth data
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Helper function to send admin action notification
  const sendAdminActionNotification = async (action: string, targetUser: UserProfile | null, amount?: number, details?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.functions.invoke("send-telegram-notification", {
        body: {
          type: "admin_action",
          action,
          adminEmail: user?.email || profile?.username || "Unknown Admin",
          username: targetUser?.username,
          userEmail: targetUser?.id,
          amount,
          details,
        },
      });
    } catch (error) {
      console.error("Failed to send admin action notification:", error);
    }
  };

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, username }: { userId: string; status: UserStatus; username: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);
      
      if (error) throw error;
      return { status, username };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User status updated successfully" });
      // Send notification
      sendAdminActionNotification(
        `User ${data.status}`,
        { id: "", username: data.username, balance: 0, status: data.status, created_at: "" },
        undefined,
        `User status changed to ${data.status}`
      );
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update user status", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Add funds mutation (also handles debit with negative amounts)
  const addFundsMutation = useMutation({
    mutationFn: async ({ userId, amount, currentBalance, username }: { userId: string; amount: number; currentBalance: number; username: string | null }) => {
      const newBalance = currentBalance + amount;
      
      // Don't allow balance to go negative
      if (newBalance < 0) {
        throw new Error("Insufficient balance. Cannot debit more than available balance.");
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", userId);
      
      if (error) throw error;

      // Create a transaction record
      const isDebit = amount < 0;
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: isDebit ? "charge" : "deposit",
          amount: Math.abs(amount),
          description: isDebit ? "Account debited by admin" : "Account funded by admin",
          status: "completed",
        });
      
      if (txError) throw txError;

      return { newBalance, isDebit, amount, username, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ 
        title: "Balance updated successfully",
        description: `New balance: ${formatAmount(data.newBalance)}`
      });
      // Send admin action notification
      sendAdminActionNotification(
        data.isDebit ? "Account Debited" : "Account Funded",
        { id: data.userId, username: data.username, balance: data.newBalance, status: "active", created_at: "" },
        Math.abs(data.amount),
        data.isDebit 
          ? `Debited ${formatAmount(Math.abs(data.amount))} from user's account` 
          : `Deposited ${formatAmount(data.amount)} to user's account`
      );
      resetFundsDialog();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update balance", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (user: UserProfile) => {
      const { error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);
      
      if (deleteError) throw deleteError;

      if (user.username) {
        await supabase
          .from("blocked_emails")
          .insert({ email: `${user.username}@blocked.local`, reason: "Account deleted by admin" })
          .select();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User deleted successfully" });
      setDeleteUserId(null);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete user", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetFundsDialog = () => {
    setAddFundsUser(null);
    setFundsAmount("");
    setPendingCodeKey(null);
    setConfirmationCode("");
    setAwaitingConfirmation(false);
    setSendingCode(false);
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(fundsAmount);
    if (isNaN(amount) || amount === 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid number (use minus for debit).",
        variant: "destructive",
      });
      return;
    }

    if (!addFundsUser) return;

    // Check if amount is positive (deposit) and above 5000
    if (amount > 5000) {
      // Need Telegram confirmation
      setSendingCode(true);
      try {
        const { data, error } = await supabase.functions.invoke('send-deposit-confirmation', {
          body: {
            userId: addFundsUser.id,
            username: addFundsUser.username,
            amount: amount,
            adminUsername: profile?.username || 'Unknown Admin'
          }
        });

        if (error) throw error;

        if (data?.codeKey) {
          setPendingCodeKey(data.codeKey);
          setAwaitingConfirmation(true);
          toast({
            title: "Confirmation code sent",
            description: "Check Telegram for the confirmation code.",
          });
        }
      } catch (error) {
        console.error('Error sending confirmation:', error);
        toast({
          title: "Failed to send confirmation",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      } finally {
        setSendingCode(false);
      }
      return;
    }

    // For amounts <= 5000 or debits, proceed directly
    addFundsMutation.mutate({
      userId: addFundsUser.id,
      amount,
      currentBalance: addFundsUser.balance,
      username: addFundsUser.username,
    });
  };

  const handleVerifyCode = async () => {
    if (!pendingCodeKey || !confirmationCode || !addFundsUser) return;

    setSendingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-deposit-code', {
        body: {
          codeKey: pendingCodeKey,
          code: confirmationCode
        }
      });

      if (error) throw error;

      if (data?.valid) {
        // Code verified, proceed with deposit
        addFundsMutation.mutate({
          userId: addFundsUser.id,
          amount: parseFloat(fundsAmount),
          currentBalance: addFundsUser.balance,
          username: addFundsUser.username,
        });
      } else {
        toast({
          title: "Invalid code",
          description: data?.error || "The confirmation code is invalid or expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const filteredUsers = users?.filter(user => 
    user.username?.toLowerCase().includes(search.toLowerCase()) ||
    user.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Suspended</Badge>;
      case 'paused':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Paused</Badge>;
    }
  };

  const parsedAmount = parseFloat(fundsAmount);
  const isDebit = !isNaN(parsedAmount) && parsedAmount < 0;
  const isLargeDeposit = !isNaN(parsedAmount) && parsedAmount > 5000;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Manage Users</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage all registered users.
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by username or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Balance</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">IP / Location</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border last:border-0 hover:bg-accent/30"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.username || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-foreground">{formatAmount(user.balance)}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {user.last_ip ? (
                          <>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <span className="font-mono">{user.last_ip}</span>
                            </div>
                            {user.last_location && user.last_location !== "Unknown" && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{user.last_location}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not tracked</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setAddFundsUser(user)}
                          >
                            <Wallet className="h-4 w-4 mr-2 text-primary" />
                            Manage Funds
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status !== 'active' && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'active', username: user.username })}
                            >
                              <Play className="h-4 w-4 mr-2 text-green-500" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'suspended' && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'suspended', username: user.username })}
                            >
                              <UserX className="h-4 w-4 mr-2 text-destructive" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'paused' && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'paused', username: user.username })}
                            >
                              <Pause className="h-4 w-4 mr-2 text-amber-500" />
                              Pause
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteUserId(user.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Debit Funds Dialog */}
      <Dialog open={!!addFundsUser} onOpenChange={() => resetFundsDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Funds</DialogTitle>
            <DialogDescription>
              {awaitingConfirmation ? (
                <>Enter the confirmation code from Telegram to approve this deposit.</>
              ) : (
                <>
                  Add or debit funds for <strong>{addFundsUser?.username}</strong>'s account.
                  <br />
                  <span className="text-muted-foreground">
                    Current balance: {formatAmount(addFundsUser?.balance || 0)}
                  </span>
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Use a negative number (e.g., -500) to debit the account.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {awaitingConfirmation ? (
            <div className="py-4 space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-primary">
                  <KeyRound className="h-5 w-5" />
                  <span className="font-medium">Enter Confirmation Code</span>
                </div>
                <InputOTP
                  maxLength={6}
                  value={confirmationCode}
                  onChange={setConfirmationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-sm text-muted-foreground text-center">
                  Depositing {formatAmount(parseFloat(fundsAmount))} to {addFundsUser?.username}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Amount (₦) {isDebit && <span className="text-destructive">(Debit)</span>}
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={fundsAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow minus sign, digits, and decimal
                  if (/^-?\d*\.?\d*$/.test(value)) {
                    setFundsAmount(value);
                  }
                }}
                placeholder="Enter amount (use - for debit)..."
                className={`h-12 bg-secondary border-border ${isDebit ? 'text-destructive' : ''}`}
              />
              {fundsAmount && !isNaN(parsedAmount) && parsedAmount !== 0 && (
                <p className={`text-sm mt-2 ${isDebit ? 'text-destructive' : 'text-muted-foreground'}`}>
                  New balance will be: {formatAmount((addFundsUser?.balance || 0) + parsedAmount)}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={resetFundsDialog}>
              Cancel
            </Button>
            {awaitingConfirmation ? (
              <Button 
                onClick={handleVerifyCode}
                disabled={sendingCode || confirmationCode.length !== 6}
              >
                {sendingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Verify & Deposit
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleAddFunds}
                disabled={addFundsMutation.isPending || sendingCode || !fundsAmount || parsedAmount === 0}
                variant={isDebit ? "destructive" : "default"}
              >
                {addFundsMutation.isPending || sendingCode ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {sendingCode ? 'Sending code...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    {isDebit ? 'Debit Funds' : isLargeDeposit ? 'Send Confirmation' : 'Add Funds'}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.username}</strong>? This action cannot be undone. The user will be permanently removed and their email will be blocked from future registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;
