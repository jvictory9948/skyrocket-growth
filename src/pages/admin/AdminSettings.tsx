import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Settings, 
  Send, 
  RefreshCw, 
  DollarSign,
  Calendar,
  TrendingUp,
  Loader2,
  Save,
  TestTube
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminSettings = () => {
  const { formatAmount } = useCurrency();
  const queryClient = useQueryClient();
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value");

      if (error) throw error;
      return data;
    },
  });

  // Fetch revenue stats
  const { data: revenueStats, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue-stats"],
    queryFn: async () => {
      const { data: settingsData } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .eq("setting_key", "revenue_reset_date")
        .single();

      const resetDate = settingsData?.setting_value 
        ? new Date(settingsData.setting_value) 
        : null;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Daily revenue
      const { data: dailyOrders } = await supabase
        .from("orders")
        .select("charge")
        .gte("created_at", startOfDay.toISOString());

      // Monthly revenue
      const { data: monthlyOrders } = await supabase
        .from("orders")
        .select("charge")
        .gte("created_at", startOfMonth.toISOString());

      // Overall revenue (since reset or all time)
      let overallQuery = supabase.from("orders").select("charge");
      if (resetDate) {
        overallQuery = overallQuery.gte("created_at", resetDate.toISOString());
      }
      const { data: overallOrders } = await overallQuery;

      // All time revenue
      const { data: allTimeOrders } = await supabase
        .from("orders")
        .select("charge");

      return {
        daily: dailyOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0,
        monthly: monthlyOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0,
        overall: overallOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0,
        allTime: allTimeOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0,
        resetDate,
      };
    },
  });

  // Set initial values
  useEffect(() => {
    if (settings) {
      const botToken = settings.find(s => s.setting_key === "telegram_bot_token")?.setting_value || "";
      const chatId = settings.find(s => s.setting_key === "telegram_chat_id")?.setting_value || "";
      setTelegramBotToken(botToken);
      setTelegramChatId(chatId);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { setting_key: "telegram_bot_token", setting_value: telegramBotToken },
        { setting_key: "telegram_chat_id", setting_value: telegramChatId },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);
        
        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Telegram settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!telegramBotToken || !telegramChatId) {
      toast({
        title: "Missing configuration",
        description: "Please enter both bot token and chat ID first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-telegram-notification", {
        body: {
          type: "deposit",
          username: "Test User",
          amount: 100.00,
        },
      });

      if (error) throw error;

      toast({
        title: "Test sent!",
        description: "Check your Telegram for the test message.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test message",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetRevenue = async () => {
    try {
      const { error } = await supabase
        .from("admin_settings")
        .update({ setting_value: new Date().toISOString() })
        .eq("setting_key", "revenue_reset_date");

      if (error) throw error;

      toast({
        title: "Revenue reset",
        description: "Overall revenue counter has been reset.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset revenue",
        variant: "destructive",
      });
    }
  };

  if (settingsLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <Link to="/dashboard/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Settings</h1>
            <p className="text-muted-foreground">Configure notifications and manage revenue tracking.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Telegram Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Telegram Notifications</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                type="password"
                placeholder="Enter your Telegram bot token"
                value={telegramBotToken}
                onChange={(e) => setTelegramBotToken(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get this from @BotFather on Telegram
              </p>
            </div>

            <div>
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                placeholder="Enter your chat or group ID"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your personal chat ID or group ID for notifications
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
              <Button variant="outline" onClick={handleTestTelegram} disabled={isTesting}>
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                Test
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Revenue Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Revenue Tracking</h2>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Revenue Counter?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset the "overall" revenue counter to start from now. Daily and monthly stats are calculated automatically. All time revenue will remain unchanged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetRevenue}>
                    Reset Revenue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {revenueLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Today</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatAmount(revenueStats?.daily || 0)}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatAmount(revenueStats?.monthly || 0)}
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Since Last Reset</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {formatAmount(revenueStats?.overall || 0)}
                </p>
                {revenueStats?.resetDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Reset on {new Date(revenueStats.resetDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">All Time</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatAmount(revenueStats?.allTime || 0)}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;
