import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TwitterXIcon, InstagramIcon, DiscordIcon, TelegramIcon, FacebookIcon, YouTubeIcon, TikTokIcon, LinkedInIcon } from "@/components/icons/SocialIcons";

const platformIcons: Record<string, React.FC<{ className?: string }>> = {
  twitter: TwitterXIcon,
  instagram: InstagramIcon,
  discord: DiscordIcon,
  telegram: TelegramIcon,
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
};

const platformLabels: Record<string, string> = {
  twitter: "Twitter/X",
  instagram: "Instagram",
  discord: "Discord",
  telegram: "Telegram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

interface SocialLink {
  id: string;
  platform: string;
  url: string | null;
  is_enabled: boolean;
  display_order: number;
}

const AdminSocialLinks = () => {
  const queryClient = useQueryClient();
  const [links, setLinks] = useState<SocialLink[]>([]);

  const { data: socialLinks, isLoading } = useQuery({
    queryKey: ["social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as SocialLink[];
    },
  });

  useEffect(() => {
    if (socialLinks) {
      setLinks(socialLinks);
    }
  }, [socialLinks]);

  const saveMutation = useMutation({
    mutationFn: async (linksToSave: SocialLink[]) => {
      for (const link of linksToSave) {
        const { error } = await supabase
          .from("social_links")
          .update({ url: link.url, is_enabled: link.is_enabled })
          .eq("id", link.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-links"] });
      toast({ title: "Saved", description: "Social links updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUrlChange = (id: string, url: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, url } : l));
  };

  const handleToggle = (id: string, enabled: boolean) => {
    setLinks(links.map(l => l.id === id ? { ...l, is_enabled: enabled } : l));
  };

  const handleSave = () => {
    saveMutation.mutate(links);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Social Links</h1>
        <p className="text-muted-foreground mt-1">
          Manage social media links displayed in the footer.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-soft border border-border p-6 max-w-2xl"
      >
        <div className="space-y-6">
          {links.map((link) => {
            const Icon = platformIcons[link.platform];
            return (
              <div key={link.id} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  {Icon && <Icon className="h-5 w-5 text-foreground" />}
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {platformLabels[link.platform] || link.platform}
                  </label>
                  <Input
                    type="url"
                    placeholder={`https://${link.platform}.com/yourprofile`}
                    value={link.url || ""}
                    onChange={(e) => handleUrlChange(link.id, e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={link.is_enabled}
                    onCheckedChange={(checked) => handleToggle(link.id, checked)}
                  />
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminSocialLinks;
