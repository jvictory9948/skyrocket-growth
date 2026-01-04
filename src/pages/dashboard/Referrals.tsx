import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, DollarSign, Link2, Copy, Check, Loader2, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  totalEarnings: number;
  referralPercentage: number;
  recentReferrals: { id: string; username: string | null; created_at: string }[];
  recentEarnings: { id: string; amount: number; created_at: string }[];
}

const Referrals = () => {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: null,
    totalReferrals: 0,
    totalEarnings: 0,
    referralPercentage: 4,
    recentReferrals: [],
    recentEarnings: [],
  });

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get referral code
      const { data: codeData } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();

      let referralCode = codeData?.code;

      // Create referral code if doesn't exist
      if (!referralCode) {
        const newCode = `REF${user.id.slice(0, 8).toUpperCase()}`;
        const { data: newCodeData, error } = await supabase
          .from("referral_codes")
          .insert({ user_id: user.id, code: newCode })
          .select("code")
          .single();

        if (!error && newCodeData) {
          referralCode = newCodeData.code;
        }
      }

      // Get referral percentage
      const { data: settingsData } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "referral_percentage")
        .maybeSingle();

      const referralPercentage = settingsData?.setting_value ? parseFloat(settingsData.setting_value) : 4;

      // Get referrals
      const { data: referrals } = await supabase
        .from("referrals")
        .select("id, referred_id, created_at")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      // Get referred user profiles
      const referredIds = referrals?.map(r => r.referred_id) || [];
      let recentReferrals: { id: string; username: string | null; created_at: string }[] = [];
      
      if (referredIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", referredIds);

        recentReferrals = referrals?.slice(0, 5).map(r => ({
          id: r.id,
          username: profiles?.find(p => p.id === r.referred_id)?.username || "Anonymous",
          created_at: r.created_at,
        })) || [];
      }

      // Get earnings
      const { data: earnings } = await supabase
        .from("referral_earnings")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      const totalEarnings = earnings?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        referralCode,
        totalReferrals: referrals?.length || 0,
        totalEarnings,
        referralPercentage,
        recentReferrals,
        recentEarnings: earnings?.slice(0, 5).map(e => ({
          id: e.id,
          amount: Number(e.amount),
          created_at: e.created_at,
        })) || [],
      });
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const referralLink = stats.referralCode
    ? `${window.location.origin}/auth?ref=${stats.referralCode}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral link copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy link.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Referrals</h1>
        <p className="text-muted-foreground mt-1">
          Earn {stats.referralPercentage}% commission on every order from users you refer.
        </p>
      </div>

      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Your Referral Link</h2>
            <p className="text-sm text-muted-foreground">Share this link to earn commissions</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="bg-secondary" />
          <Button onClick={copyToClipboard} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-accent/50 rounded-xl">
          <p className="text-sm text-muted-foreground">
            <strong>How it works:</strong> When someone signs up using your link and places orders,
            you earn <span className="text-primary font-semibold">{stats.referralPercentage}%</span> of
            their order value as commission.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-foreground">{formatAmount(stats.totalEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-accent rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="text-2xl font-bold text-foreground">{stats.referralPercentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Referrals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentReferrals.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentReferrals.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{referral.username}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No referrals yet</p>
                  <p className="text-sm mt-1">Share your link to start earning!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Earnings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.recentEarnings.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentEarnings.map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-success/10 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-success" />
                        </div>
                        <span className="text-sm font-medium text-success">+{formatAmount(earning.amount)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(earning.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No earnings yet</p>
                  <p className="text-sm mt-1">You'll earn when your referrals place orders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Referrals;
