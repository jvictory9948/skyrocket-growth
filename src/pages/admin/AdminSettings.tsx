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
  TestTube,
  Percent,
  UserPlus,
  Shield,
  Trash2,
  AlertTriangle,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminSettings = () => {
  const { formatAmount } = useCurrency();
  const queryClient = useQueryClient();
  
  // Main notifications
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  
  // Signup notifications
  const [signupBotToken, setSignupBotToken] = useState("");
  const [signupChatId, setSignupChatId] = useState("");
  
  // Admin action notifications
  const [adminActionBotToken, setAdminActionBotToken] = useState("");
  const [adminActionChatId, setAdminActionChatId] = useState("");
  
  // Other settings
  const [priceMarkup, setPriceMarkup] = useState("0");
  const [referralPercentage, setReferralPercentage] = useState("4");
  const [usdToNgnRate, setUsdToNgnRate] = useState("1600");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [reallySimpleApiKey, setReallySimpleApiKey] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [isCleaningData, setIsCleaningData] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);

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

      // All time revenue
      const { data: allTimeOrders } = await supabase
        .from("orders")
        .select("charge");

      return {
        daily: dailyOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0,
        monthly: monthlyOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0,
        allTime: allTimeOrders?.reduce((sum, o) => sum + Number(o.charge), 0) || 0,
      };
    },
  });

  // Fetch old data stats for cleanup based on cleanupDays
  const { data: oldDataStats, isLoading: oldDataLoading, refetch: refetchOldData } = useQuery({
    queryKey: ["admin-old-data-stats", cleanupDays],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);

      const [ordersRes, transactionsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact" })
          .lt("created_at", cutoffDate.toISOString()),
        supabase
          .from("transactions")
          .select("id", { count: "exact" })
          .lt("created_at", cutoffDate.toISOString()),
      ]);

      return {
        oldOrders: ordersRes.count || 0,
        oldTransactions: transactionsRes.count || 0,
        cutoffDate,
      };
    },
  });

  // Set initial values
  useEffect(() => {
    if (settings) {
      setTelegramBotToken(settings.find(s => s.setting_key === "telegram_bot_token")?.setting_value || "");
      setTelegramChatId(settings.find(s => s.setting_key === "telegram_chat_id")?.setting_value || "");
      setSignupBotToken(settings.find(s => s.setting_key === "telegram_signup_bot_token")?.setting_value || "");
      setSignupChatId(settings.find(s => s.setting_key === "telegram_signup_chat_id")?.setting_value || "");
      setAdminActionBotToken(settings.find(s => s.setting_key === "telegram_admin_action_bot_token")?.setting_value || "");
      setAdminActionChatId(settings.find(s => s.setting_key === "telegram_admin_action_chat_id")?.setting_value || "");
      setPriceMarkup(settings.find(s => s.setting_key === "price_markup_percentage")?.setting_value || "0");
      setReferralPercentage(settings.find(s => s.setting_key === "referral_percentage")?.setting_value || "4");
      setUsdToNgnRate(settings.find(s => s.setting_key === "usd_to_ngn_rate")?.setting_value || "1600");
      setTurnstileSiteKey(settings.find(s => s.setting_key === "turnstile_site_key")?.setting_value || "");
      setReallySimpleApiKey(settings.find(s => s.setting_key === "reallysimplesocial_api_key")?.setting_value || "");
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updates = [
        { setting_key: "telegram_bot_token", setting_value: telegramBotToken },
        { setting_key: "telegram_chat_id", setting_value: telegramChatId },
        { setting_key: "telegram_signup_bot_token", setting_value: signupBotToken },
        { setting_key: "telegram_signup_chat_id", setting_value: signupChatId },
        { setting_key: "telegram_admin_action_bot_token", setting_value: adminActionBotToken },
        { setting_key: "telegram_admin_action_chat_id", setting_value: adminActionChatId },
        { setting_key: "price_markup_percentage", setting_value: priceMarkup },
        { setting_key: "referral_percentage", setting_value: referralPercentage },
        { setting_key: "usd_to_ngn_rate", setting_value: usdToNgnRate },
        { setting_key: "turnstile_site_key", setting_value: turnstileSiteKey },
        { setting_key: "reallysimplesocial_api_key", setting_value: reallySimpleApiKey },
      ];

      // Use upsert to create or update settings by key
      for (const update of updates) {
        const { error } = await supabase
          .from("admin_settings")
          .upsert([{ setting_key: update.setting_key, setting_value: update.setting_value }], { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "All settings have been updated.",
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

  const handleTestTelegram = async (type: 'main' | 'signup' | 'admin_action') => {
    let botToken, chatId;
    if (type === 'main') {
      botToken = telegramBotToken;
      chatId = telegramChatId;
    } else if (type === 'signup') {
      botToken = signupBotToken;
      chatId = signupChatId;
    } else {
      botToken = adminActionBotToken;
      chatId = adminActionChatId;
    }

    if (!botToken || !chatId) {
      toast({
        title: "Missing configuration",
        description: "Please enter both bot token and chat ID first.",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(type);
    try {
      const payload = type === 'signup' 
        ? { type: "signup", username: "Test User", userEmail: "test@example.com" }
        : type === 'admin_action'
        ? { type: "admin_action", action: "Test Action", adminEmail: "admin@example.com", details: "This is a test notification" }
        : { type: "deposit", username: "Test User", amount: 100.00 };

      const { error } = await supabase.functions.invoke("send-telegram-notification", {
        body: payload,
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
      setIsTesting(null);
    }
  };

  const handleResetRevenue = async () => {
    try {
      // Delete all orders to reset revenue
      const { error } = await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all orders

      if (error) throw error;

      toast({
        title: "Revenue reset",
        description: "All orders have been deleted. Revenue is now reset to zero.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset revenue",
        variant: "destructive",
      });
    }
  };

  const handleCleanOldData = async () => {
    setIsCleaningData(true);
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);

      // Delete old orders
      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (ordersError) throw ordersError;

      // Delete old transactions
      const { error: transactionsError } = await supabase
        .from("transactions")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (transactionsError) throw transactionsError;

      toast({
        title: "Data cleaned",
        description: `All orders and transactions older than ${cleanupDays} days have been deleted.`,
      });
      
      refetchOldData();
      queryClient.invalidateQueries({ queryKey: ["admin-revenue-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clean old data",
        variant: "destructive",
      });
    } finally {
      setIsCleaningData(false);
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
            <p className="text-muted-foreground">Configure notifications, security, and manage revenue tracking.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-6xl">
        {/* Price Markup Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Percent className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Price Markup</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="priceMarkup">Markup Percentage (%)</Label>
              <Input
                id="priceMarkup"
                type="number"
                min="0"
                max="500"
                step="0.1"
                placeholder="e.g., 10"
                value={priceMarkup}
                onChange={(e) => setPriceMarkup(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This percentage will be added to all service prices.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Example:</strong> If a service costs ₦100 and markup is {priceMarkup || 0}%, 
                users will see <strong>₦{(100 * (1 + (parseFloat(priceMarkup) || 0) / 100)).toFixed(2)}</strong>
              </p>
            </div>
          </div>
        </motion.div>

        {/* USD to NGN Conversion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">USD to NGN Conversion</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="usdToNgnRate">Conversion Rate (₦ per $1)</Label>
              <Input
                id="usdToNgnRate"
                type="number"
                min="1"
                step="1"
                placeholder="e.g., 1600"
                value={usdToNgnRate}
                onChange={(e) => setUsdToNgnRate(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used to convert USD prices from ResellerProvider API to NGN.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Example:</strong> If a service costs $0.20 and rate is ₦{usdToNgnRate || 1600}, 
                base price is <strong>₦{(0.20 * (parseFloat(usdToNgnRate) || 1600)).toFixed(2)}</strong> per 1000
              </p>
            </div>
          </div>
        </motion.div>

        {/* Referral Commission Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.025 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Referral Program</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="referralPercentage">Commission Percentage (%)</Label>
              <Input
                id="referralPercentage"
                type="number"
                min="0"
                max="50"
                step="0.5"
                placeholder="e.g., 4"
                value={referralPercentage}
                onChange={(e) => setReferralPercentage(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Referrers earn this percentage of each order placed by users they referred.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Example:</strong> If a referred user places a ₦1000 order and commission is {referralPercentage || 0}%, 
                the referrer earns <strong>₦{(1000 * (parseFloat(referralPercentage) || 0) / 100).toFixed(2)}</strong>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Turnstile Captcha Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border border-border p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Captcha Protection</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="turnstileSiteKey">Cloudflare Turnstile Site Key</Label>
              <Input
                id="turnstileSiteKey"
                placeholder="Enter your Turnstile site key"
                value={turnstileSiteKey}
                onChange={(e) => setTurnstileSiteKey(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get this from Cloudflare dashboard → Turnstile. Leave empty to disable captcha.
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Turnstile protects your signup form from bots without annoying puzzles.
              </p>
            </div>
          </div>
        </motion.div>

        {/* External API Keys */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border border-border p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <TestTube className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">External API Keys</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rssApiKey">ReallySimpleSocial API Key</Label>
              <Input
                id="rssApiKey"
                placeholder="Enter your ReallySimpleSocial API key"
                value={reallySimpleApiKey}
                onChange={(e) => setReallySimpleApiKey(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stored in `admin_settings` as <strong>reallysimplesocial_api_key</strong>.
                Note: Edge Functions read the environment variable <strong>REALLYSIMPLESOCIAL_API_KEY</strong> —
                update the function secret or redeploy functions to pick up this DB value if needed.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Telegram Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Telegram Notifications</h2>
          </div>

          <Tabs defaultValue="main" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 h-auto">
              <TabsTrigger value="main" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Orders & Deposits</span>
                <span className="sm:hidden">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
                <UserPlus className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">User Signups</span>
                <span className="sm:hidden">Signups</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-2">
                <Shield className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Admin Actions</span>
                <span className="sm:hidden">Admin</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Receive notifications when users place orders or make deposits.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
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
                </div>
              </div>
              <Button variant="outline" onClick={() => handleTestTelegram('main')} disabled={isTesting === 'main'}>
                {isTesting === 'main' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                Test
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Receive notifications when new users sign up.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="signupBotToken">Bot Token</Label>
                  <Input
                    id="signupBotToken"
                    type="password"
                    placeholder="Enter your Telegram bot token"
                    value={signupBotToken}
                    onChange={(e) => setSignupBotToken(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="signupChatId">Chat ID</Label>
                  <Input
                    id="signupChatId"
                    placeholder="Enter your chat or group ID"
                    value={signupChatId}
                    onChange={(e) => setSignupChatId(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={() => handleTestTelegram('signup')} disabled={isTesting === 'signup'}>
                {isTesting === 'signup' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                Test
              </Button>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Receive notifications for admin actions like refunds, deposits, and balance changes.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adminActionBotToken">Bot Token</Label>
                  <Input
                    id="adminActionBotToken"
                    type="password"
                    placeholder="Enter your Telegram bot token"
                    value={adminActionBotToken}
                    onChange={(e) => setAdminActionBotToken(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="adminActionChatId">Chat ID</Label>
                  <Input
                    id="adminActionChatId"
                    placeholder="Enter your chat or group ID"
                    value={adminActionChatId}
                    onChange={(e) => setAdminActionChatId(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={() => handleTestTelegram('admin_action')} disabled={isTesting === 'admin_action'}>
                {isTesting === 'admin_action' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
                Test
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-6 border-t border-border mt-6">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save All Settings
            </Button>
          </div>
        </motion.div>

        {/* Revenue Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border p-6 lg:col-span-2"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Revenue Tracking</h2>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Reset ALL Revenue?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>Warning:</strong> This will permanently delete ALL orders from the database. 
                    All revenue (daily, monthly, and all-time) will be reset to zero. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetRevenue} className="bg-destructive hover:bg-destructive/90">
                    Yes, Delete All Orders
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
            <div className="grid md:grid-cols-3 gap-4">
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
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">All Time</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatAmount(revenueStats?.allTime || 0)}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Data Cleanup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-xl border border-border p-6 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Data Cleanup</h2>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                  Manual & Automatic Cleanup
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Orders and transactions older than the selected duration can be cleaned manually. 
                  Users are notified that data older than 30 days may be cleared automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Duration selector */}
          <div className="mb-6">
            <Label htmlFor="cleanupDays" className="text-sm font-medium">Data older than (days)</Label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
              <Input
                id="cleanupDays"
                type="number"
                min="1"
                max="365"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(Math.max(1, parseInt(e.target.value) || 30))}
                className="w-24"
              />
              <div className="flex flex-wrap gap-2">
                {[7, 14, 30, 60, 90].map((days) => (
                  <Button
                    key={days}
                    variant={cleanupDays === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCleanupDays(days)}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {oldDataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Old Orders ({cleanupDays}+ days)</p>
                  <p className="text-2xl font-bold text-foreground">{oldDataStats?.oldOrders || 0}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Old Transactions ({cleanupDays}+ days)</p>
                  <p className="text-2xl font-bold text-foreground">{oldDataStats?.oldTransactions || 0}</p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10"
                    disabled={(oldDataStats?.oldOrders || 0) === 0 && (oldDataStats?.oldTransactions || 0) === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Old Data ({(oldDataStats?.oldOrders || 0) + (oldDataStats?.oldTransactions || 0)} records)
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <Trash2 className="h-5 w-5 text-amber-500" />
                      Clean Old Data?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li><strong>{oldDataStats?.oldOrders || 0}</strong> orders older than {cleanupDays} days</li>
                        <li><strong>{oldDataStats?.oldTransactions || 0}</strong> transactions older than {cleanupDays} days</li>
                      </ul>
                      <p className="mt-2">This action cannot be undone.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleCleanOldData}
                      disabled={isCleaningData}
                      className="bg-amber-500 hover:bg-amber-600"
                    >
                      {isCleaningData ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Cleaning...
                        </>
                      ) : (
                        "Yes, Clean Old Data"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminSettings;
