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
  Loader2
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

type UserStatus = 'active' | 'suspended' | 'paused';

interface UserProfile {
  id: string;
  username: string | null;
  balance: number;
  status: UserStatus;
  created_at: string;
  email?: string;
}

const AdminUsers = () => {
  const { formatAmount } = useCurrency();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [addFundsUser, setAddFundsUser] = useState<UserProfile | null>(null);
  const [fundsAmount, setFundsAmount] = useState("");

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

  // Update user status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update user status", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Add funds mutation
  const addFundsMutation = useMutation({
    mutationFn: async ({ userId, amount, currentBalance, username }: { userId: string; amount: number; currentBalance: number; username: string | null }) => {
      const newBalance = currentBalance + amount;
      const { error } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", userId);
      
      if (error) throw error;

      // Create a transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: userId,
          type: "deposit",
          amount: amount,
          description: "Account funded by admin",
          status: "completed",
        });
      
      if (txError) throw txError;

      return { newBalance };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ 
        title: "Funds added successfully",
        description: `New balance: ${formatAmount(data.newBalance)}`
      });
      setAddFundsUser(null);
      setFundsAmount("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to add funds", 
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

  const handleAddFunds = () => {
    const amount = parseFloat(fundsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid positive number.",
        variant: "destructive",
      });
      return;
    }

    if (addFundsUser) {
      addFundsMutation.mutate({
        userId: addFundsUser.id,
        amount,
        currentBalance: addFundsUser.balance,
        username: addFundsUser.username,
      });
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
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
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
                            Add Funds
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status !== 'active' && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'active' })}
                            >
                              <Play className="h-4 w-4 mr-2 text-green-500" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'suspended' && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'suspended' })}
                            >
                              <UserX className="h-4 w-4 mr-2 text-destructive" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'paused' && (
                            <DropdownMenuItem
                              onClick={() => updateStatusMutation.mutate({ userId: user.id, status: 'paused' })}
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

      {/* Add Funds Dialog */}
      <Dialog open={!!addFundsUser} onOpenChange={() => { setAddFundsUser(null); setFundsAmount(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Add funds to <strong>{addFundsUser?.username}</strong>'s account.
              <br />
              <span className="text-muted-foreground">
                Current balance: {formatAmount(addFundsUser?.balance || 0)}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Amount to Add (₦)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={fundsAmount}
              onChange={(e) => setFundsAmount(e.target.value)}
              placeholder="Enter amount..."
              className="h-12 bg-secondary border-border"
            />
            {fundsAmount && !isNaN(parseFloat(fundsAmount)) && parseFloat(fundsAmount) > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                New balance will be: {formatAmount((addFundsUser?.balance || 0) + parseFloat(fundsAmount))}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddFundsUser(null); setFundsAmount(""); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddFunds}
              disabled={addFundsMutation.isPending || !fundsAmount}
            >
              {addFundsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Add Funds
                </>
              )}
            </Button>
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
