import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkIcon, Loader2, Minus, Plus, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { socialIcons } from "@/components/icons/SocialIcons";

interface ApiService {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  refill: boolean;
  cancel: boolean;
}

interface GroupedServices {
  [category: string]: ApiService[];
}

const platformKeywords: Record<string, string[]> = {
  instagram: ["instagram", "ig ", "insta"],
  tiktok: ["tiktok", "tik tok", "tt "],
  youtube: ["youtube", "yt ", "youtuber"],
  twitter: ["twitter", "tweet", "x "],
  facebook: ["facebook", "fb "],
  telegram: ["telegram", "tg "],
  discord: ["discord"],
  spotify: ["spotify"],
  linkedin: ["linkedin"],
};

const platforms = [
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter" },
  { id: "facebook", name: "Facebook" },
  { id: "telegram", name: "Telegram" },
  { id: "discord", name: "Discord" },
  { id: "spotify", name: "Spotify" },
];

const NewOrder = () => {
  const { user, profile, refreshProfile, userStatus } = useAuth();
  const { formatAmount } = useCurrency();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [quantity, setQuantity] = useState(1000);
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [allServices, setAllServices] = useState<ApiService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-services');
      
      if (error) throw error;
      
      if (Array.isArray(data)) {
        setAllServices(data);
      }
    } catch (error: any) {
      console.error('Failed to fetch services:', error);
      toast({
        title: "Failed to load services",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoadingServices(false);
    }
  };

  const getPlatformServices = (platformId: string): ApiService[] => {
    const keywords = platformKeywords[platformId] || [];
    return allServices.filter((service) => {
      const name = service.name.toLowerCase();
      const category = service.category.toLowerCase();
      return keywords.some((kw) => name.includes(kw) || category.includes(kw));
    });
  };

  // Group services by category for the selected platform
  const getGroupedCategories = (platformId: string): GroupedServices => {
    const services = getPlatformServices(platformId);
    return services.reduce((acc, service) => {
      const cat = service.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(service);
      return acc;
    }, {} as GroupedServices);
  };

  const platformServices = selectedPlatform ? getPlatformServices(selectedPlatform) : [];
  const groupedCategories = selectedPlatform ? getGroupedCategories(selectedPlatform) : {};
  const categoryList = Object.keys(groupedCategories);
  const servicesInCategory = selectedCategory ? groupedCategories[selectedCategory] || [] : [];

  const totalPrice = selectedService
    ? (parseFloat(selectedService.rate) * quantity) / 1000
    : 0;

  const minQuantity = selectedService ? parseInt(selectedService.min) : 100;
  const maxQuantity = selectedService ? parseInt(selectedService.max) : 100000;

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(minQuantity, Math.min(maxQuantity, quantity + delta)));
  };

  const handleServiceSelect = (service: ApiService) => {
    setSelectedService(service);
    setQuantity(parseInt(service.min));
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setSelectedCategory(null);
    setSelectedService(null);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedService(null);
  };

  const handleSubmit = async () => {
    if (!user || !selectedService || !selectedPlatform) return;

    // Check if user is paused
    if (userStatus === 'paused') {
      toast({
        title: "Account Paused",
        description: "Your account has been paused. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    if ((profile?.balance || 0) < totalPrice) {
      toast({
        title: "Insufficient balance",
        description: "Please add funds to your account.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Place order with external API
      const { data: apiResult, error: apiError } = await supabase.functions.invoke('place-order', {
        body: {
          service: selectedService.service,
          serviceName: selectedService.name,
          platform: selectedPlatform,
          charge: totalPrice,
          link,
          quantity,
        },
      });

      if (apiError) throw apiError;
      if (apiResult.error) {
        toast({
          title: "Notice",
          description: apiResult.error,
        });
        setIsLoading(false);
        return;
      }

      // Save order to database with status from API and external order ID
      const { error: orderError } = await supabase.from("orders").insert({
        user_id: user.id,
        platform: selectedPlatform,
        service: selectedService.name,
        link,
        quantity,
        charge: totalPrice,
        status: apiResult.status || "pending",
        external_order_id: apiResult.orderId?.toString() || null,
      });

      if (orderError) throw orderError;

      // Update balance
      const newBalance = (profile?.balance || 0) - totalPrice;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (balanceError) throw balanceError;

      await refreshProfile();

      toast({
        title: "Order placed!",
        description: `Your order for ${quantity.toLocaleString()} has been submitted.`,
      });

      setOrderPlaced(true);
      setTimeout(() => {
        setOrderPlaced(false);
        setSelectedPlatform(null);
        setSelectedService(null);
        setQuantity(1000);
        setLink("");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">New Order</h1>
          <p className="text-muted-foreground mt-1">
            Select your platform and service to get started.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchServices}
          disabled={loadingServices}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loadingServices ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl bg-card rounded-2xl shadow-card border border-border p-6 lg:p-8"
      >
        {/* Platform Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-4">
            1. Select Platform
          </label>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {platforms.map((platform) => {
              const Icon = socialIcons[platform.id];
              const serviceCount = getPlatformServices(platform.id).length;
              return (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlatformSelect(platform.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all relative ${
                    selectedPlatform === platform.id
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "bg-secondary hover:bg-accent"
                  }`}
                >
                  {Icon && <Icon className="h-6 w-6 mb-1" />}
                  <span className="text-xs font-medium text-muted-foreground hidden md:block">
                    {platform.name}
                  </span>
                  {serviceCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                      {serviceCount}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {loadingServices && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading services...</span>
          </div>
        )}

        {/* Category Selection */}
        <AnimatePresence>
          {selectedPlatform && !loadingServices && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <label className="block text-sm font-medium text-foreground mb-3">
                2. Choose Category ({categoryList.length} available)
              </label>
              {categoryList.length === 0 ? (
                <p className="text-muted-foreground text-sm">No categories found for this platform.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-2">
                  {categoryList.map((category) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategorySelect(category)}
                      className={`flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        selectedCategory === category
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "bg-secondary hover:bg-accent"
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground truncate pr-2">
                        {category}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {groupedCategories[category].length} services
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Selection */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <label className="block text-sm font-medium text-foreground mb-3">
                3. Choose Service ({servicesInCategory.length} available)
              </label>
              <select
                value={selectedService?.service || ""}
                onChange={(e) => {
                  const service = servicesInCategory.find(
                    (s) => s.service === parseInt(e.target.value)
                  );
                  if (service) handleServiceSelect(service);
                }}
                className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a service...</option>
                {servicesInCategory.map((service) => (
                  <option key={service.service} value={service.service}>
                    {service.name} - ₦{service.rate}/1k (Min: {service.min})
                  </option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Link & Quantity */}
        <AnimatePresence>
          {selectedService && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 mb-8"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  4. Enter URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Enter your post/profile URL..."
                    className="pl-12 h-12 bg-secondary border-border focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  5. Set Quantity (Min: {minQuantity.toLocaleString()} - Max: {maxQuantity.toLocaleString()})
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleQuantityChange(-1000)}
                    className="rounded-full h-12 w-12"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQuantity(Math.max(minQuantity, Math.min(maxQuantity, val)));
                      }}
                      className="text-center text-2xl font-bold h-14 bg-secondary border-border"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleQuantityChange(1000)}
                    className="rounded-full h-12 w-12"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <input
                  type="range"
                  min={minQuantity}
                  max={maxQuantity}
                  step={100}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full mt-4 accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{minQuantity.toLocaleString()}</span>
                  <span>{maxQuantity.toLocaleString()}</span>
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-secondary/50 rounded-xl p-4 text-sm">
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <span>Rate:</span>
                  <span className="text-foreground">₦{selectedService.rate} per 1000</span>
                  <span>Refill:</span>
                  <span className="text-foreground">{selectedService.refill ? "Yes ✓" : "No"}</span>
                  <span>Cancel:</span>
                  <span className="text-foreground">{selectedService.cancel ? "Yes ✓" : "No"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Price & Submit */}
        <div className="flex flex-col sm:flex-row items-stretch gap-4 pt-6 border-t border-border">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">Total Charge</div>
            <div className="text-3xl font-bold text-foreground">
              {formatAmount(totalPrice)}
            </div>
            {selectedService && (
              <div className="text-xs text-muted-foreground mt-1">
                {selectedService.name}
              </div>
            )}
          </div>
          <Button
            variant="hero"
            size="xl"
            disabled={!selectedService || !link || isLoading || userStatus === 'paused'}
            onClick={handleSubmit}
            className="min-w-[180px]"
          >
            {userStatus === 'paused' ? (
              "Account Paused"
            ) : isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : orderPlaced ? (
              <>
                <Check className="h-5 w-5 mr-2" /> Placed!
              </>
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NewOrder;
