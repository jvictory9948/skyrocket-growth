import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkIcon, Loader2, Minus, Plus, Check, RefreshCw, Info, AlertCircle, CheckCircle2, Star, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { socialIcons } from "@/components/icons/SocialIcons";
import HowToOrderVideo from "@/components/HowToOrderVideo";
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
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ApiService | null>(null);
  const [quantity, setQuantity] = useState(1000);
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [allServices, setAllServices] = useState<ApiService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [priceMarkup, setPriceMarkup] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchPriceMarkup();
  }, []);

  const fetchPriceMarkup = async () => {
    try {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "price_markup_percentage")
        .maybeSingle();
      
      if (data?.setting_value) {
        setPriceMarkup(parseFloat(data.setting_value) || 0);
      }
    } catch (error) {
      console.error("Failed to fetch price markup:", error);
    }
  };

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

  // Apply markup to service rate
  const getMarkedUpRate = (rate: string) => {
    const baseRate = parseFloat(rate);
    return baseRate * (1 + priceMarkup / 100);
  };

  const totalPrice = selectedService
    ? (getMarkedUpRate(selectedService.rate) * quantity) / 1000
    : 0;

  const minQuantity = selectedService ? parseInt(selectedService.min) : 100;
  const maxQuantity = selectedService ? parseInt(selectedService.max) : 100000;

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(minQuantity, Math.min(maxQuantity, quantity + delta)));
  };

  const handleServiceSelect = (service: ApiService) => {
    setSelectedService(service);
    setQuantity(parseInt(service.min));
    setShowFavorites(false);
  };

  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId);
    setSelectedCategory(null);
    setSelectedService(null);
    setShowFavorites(false);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedService(null);
  };

  const handleFavoriteSelect = (fav: { service_id: string; service_name: string; platform: string }) => {
    const service = allServices.find(s => s.service.toString() === fav.service_id);
    if (service) {
      setSelectedPlatform(fav.platform);
      setSelectedService(service);
      setQuantity(parseInt(service.min));
      setShowFavorites(false);
    } else {
      toast({ title: "Service not available", description: "This service is no longer available.", variant: "destructive" });
    }
  };

  const toggleFavorite = () => {
    if (!selectedService || !selectedPlatform) return;
    
    const serviceId = selectedService.service.toString();
    if (isFavorite(serviceId)) {
      removeFavorite(serviceId);
    } else {
      addFavorite(serviceId, selectedService.name, selectedPlatform);
    }
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
      // Send base charge (no client-side markup) to server which will apply global markup and debit user
      const baseCharge = (parseFloat(selectedService.rate) * quantity) / 1000;

      // include the user's auth token in the request so the Edge Function can authenticate
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || null;

      const { data: apiResult, error: apiError } = await supabase.functions.invoke('place-order', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: {
          service: selectedService.service,
          serviceName: selectedService.name,
          platform: selectedPlatform,
          baseCharge,
          link,
          quantity,
        },
      });

      if (apiError) throw apiError;
      if (apiResult?.error) {
        toast({
          title: "Notice",
          description: apiResult.error,
        });
        setIsLoading(false);
        return;
      }

      // Refresh profile to pick up server-side debit
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

      <div className="flex flex-row gap-8 items-start">
        {/* Main Order Form */}
        <div className="flex-1 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl bg-card rounded-2xl shadow-card border border-border p-6 lg:p-8"
          >
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-foreground">
                Quick Access - Favorites
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
                className="text-xs"
              >
                {showFavorites ? "Hide" : "Show"} ({favorites.length})
              </Button>
            </div>
            <AnimatePresence>
              {showFavorites && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 gap-2 mb-4"
                >
                  {favorites.slice(0, 5).map((fav) => {
                    const Icon = socialIcons[fav.platform];
                    return (
                      <motion.button
                        key={fav.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleFavoriteSelect(fav)}
                        className="flex items-center gap-3 p-3 bg-secondary/50 hover:bg-accent rounded-xl text-left transition-all"
                      >
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          {Icon && <Icon className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{fav.service_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{fav.platform}</p>
                        </div>
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Platform Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-4">
            1. Select Platform
          </label>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2">
            {platforms.map((platform) => {
              const Icon = socialIcons[platform.id];
              const serviceCount = getPlatformServices(platform.id).length;
              return (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handlePlatformSelect(platform.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    selectedPlatform === platform.id
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "bg-secondary hover:bg-accent"
                  }`}
                >
                  <div className="h-10 w-10 bg-background rounded-lg flex items-center justify-center shrink-0">
                    {Icon && <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 text-left">
                    {platform.name}
                  </span>
                  {serviceCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
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
                    {service.name} - ₦{getMarkedUpRate(service.rate).toFixed(2)}/1k (Min: {service.min})
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
                      type="text"
                      inputMode="numeric"
                      value={quantity === 0 ? '' : quantity.toString()}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '').replace(/^0+/, '');
                        const val = rawValue === '' ? 0 : Number(rawValue);
                        if (!isNaN(val)) {
                          setQuantity(Math.min(maxQuantity, val));
                        }
                      }}
                      onBlur={() => {
                        if (quantity < minQuantity) {
                          setQuantity(minQuantity);
                        }
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
                  <span className="text-foreground">₦{getMarkedUpRate(selectedService.rate).toFixed(2)} per 1000</span>
                  <span>Refill:</span>
                  <span className="text-foreground">{selectedService.refill ? "Yes ✓" : "No"}</span>
                  <span>Cancel:</span>
                  <span className="text-foreground">{selectedService.cancel ? "Yes ✓" : "No"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFavorite}
                  className={`w-full mt-3 ${isFavorite(selectedService.service.toString()) ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Star className={`h-4 w-4 mr-2 ${isFavorite(selectedService.service.toString()) ? "fill-primary" : ""}`} />
                  {isFavorite(selectedService.service.toString()) ? "Remove from Favorites" : "Save to Favorites"}
                </Button>
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

      {/* How to Order Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mt-6 bg-card rounded-2xl shadow-card border border-border p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-foreground">How to Place an Order</h3>
            <p className="text-sm text-muted-foreground mt-1">Follow these simple steps to boost your social media</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <div>
              <p className="text-sm font-medium text-foreground">Select your platform</p>
              <p className="text-xs text-muted-foreground">Choose Instagram, TikTok, YouTube, or any other platform you want to boost.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <div>
              <p className="text-sm font-medium text-foreground">Pick a category & service</p>
              <p className="text-xs text-muted-foreground">Browse through categories like Followers, Likes, Views, Comments, etc. and select the service that fits your needs.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
            <div>
              <p className="text-sm font-medium text-foreground">Enter the correct URL</p>
              <p className="text-xs text-muted-foreground">Paste the direct link to your post or profile. Make sure it's the full URL and your account is set to public.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
            <div>
              <p className="text-sm font-medium text-foreground">Set quantity & place order</p>
              <p className="text-xs text-muted-foreground">Choose how many followers/likes/views you want and click "Place Order". Your order will start processing immediately!</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Important: Use the Correct Link!</p>
              <ul className="text-xs text-amber-600 dark:text-amber-500 mt-1 space-y-1">
                <li>• Your account/post must be <strong>public</strong>, not private</li>
                <li>• Copy the full URL directly from your browser or app</li>
                <li>• For profile services, use your profile URL (e.g., instagram.com/username)</li>
                <li>• For post services, use the specific post URL</li>
                <li>• Wrong links cannot be refunded once the order starts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Pro Tips</p>
              <ul className="text-xs text-green-600 dark:text-green-500 mt-1 space-y-1">
                <li>• Start with smaller orders to test the quality</li>
                <li>• Spread large orders across multiple days for natural growth</li>
                <li>• Check your order history to track delivery progress</li>
                <li>• Contact support if your order takes longer than expected</li>
              </ul>
            </div>
          </div>
        </div>
          </motion.div>
        </div>
        
        {/* Video Sidebar - Desktop only */}
        <div className="hidden xl:block w-[480px] flex-shrink-0">
          <div className="sticky top-8">
            <HowToOrderVideo variant="sidebar" />
          </div>
        </div>
      </div>

      {/* Video - Mobile/Tablet (below form, matches card styling) */}
      <div className="xl:hidden mt-6 max-w-2xl">
        <HowToOrderVideo variant="sidebar" />
      </div>
    </div>
  );
};

export default NewOrder;
