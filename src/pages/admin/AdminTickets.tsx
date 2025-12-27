import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Search, 
  ArrowLeft,
  Calendar,
  MessageCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string | null;
  };
}

const AdminTickets = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Fetch all tickets
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data: ticketsData, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      return ticketsData.map(ticket => ({
        ...ticket,
        profiles: profilesMap.get(ticket.user_id) || { username: null }
      })) as SupportTicket[];
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      toast({ title: "Ticket status updated" });
      setSelectedTicket(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update ticket", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredTickets = tickets?.filter(ticket => 
    ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
    ticket.message.toLowerCase().includes(search.toLowerCase()) ||
    ticket.profiles?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-secondary text-muted-foreground">Closed</Badge>;
      default:
        return <Badge className="bg-secondary text-muted-foreground">{status}</Badge>;
    }
  };

  const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

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
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Support Tickets</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage support requests from users.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-sm text-muted-foreground">Open Tickets</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{openTickets}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm text-muted-foreground">Resolved</p>
          </div>
          <p className="text-2xl font-bold text-foreground">{resolvedTickets}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
            Loading tickets...
          </div>
        ) : filteredTickets?.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
            No tickets found.
          </div>
        ) : (
          filteredTickets?.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(ticket.status)}
                    <span className="text-xs text-muted-foreground">
                      from {ticket.profiles?.username || "Unknown"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                  <Calendar className="h-4 w-4" />
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              From {selectedTicket?.profiles?.username || "Unknown"} • {selectedTicket && new Date(selectedTicket.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{selectedTicket?.message}</p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {selectedTicket?.status !== 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedTicket && updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: 'in_progress' })}
                >
                  Mark In Progress
                </Button>
              )}
              {selectedTicket?.status !== 'resolved' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-500 border-green-500/20 hover:bg-green-500/10"
                  onClick={() => selectedTicket && updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: 'resolved' })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              )}
              {selectedTicket?.status !== 'closed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedTicket && updateStatusMutation.mutate({ ticketId: selectedTicket.id, status: 'closed' })}
                >
                  Close Ticket
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTickets;
