import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, Loader2, Minus, Plus, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const platforms = [
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "youtube", name: "YouTube", icon: "▶️" },
  { id: "twitter", name: "Twitter", icon: "𝕏" },
  { id: "facebook", name: "Facebook", icon: "👥" },
  { id: "telegram", name: "Telegram", icon: "✈️" },
  { id: "discord", name: "Discord", icon: "🎮" },
  { id: "spotify", name: "Spotify", icon: "🎧" },
];

const services: Record<string, { id: string; name: string; price: number }[]> = {
  instagram: [
    { id: "ig-followers", name: "Followers [Refill] - $0.50/1k", price: 0.5 },
    { id: "ig-likes", name: "Likes [Real HQ] - $0.20/1k", price: 0.2 },
    { id: "ig-views", name: "Story Views [Instant] - $0.10/1k", price: 0.1 },
    { id: "ig-comments", name: "Custom Comments - $2.00/1k", price: 2.0 },
  ],
  tiktok: [
    { id: "tt-followers", name: "Followers [No Drop] - $0.80/1k", price: 0.8 },
    { id: "tt-likes", name: "Likes [Instant] - $0.15/1k", price: 0.15 },
    { id: "tt-views", name: "Views [Real] - $0.01/1k", price: 0.01 },
  ],
  youtube: [
    { id: "yt-subs", name: "Subscribers [Real] - $3.00/1k", price: 3.0 },
    { id: "yt-views", name: "Views [High Retention] - $1.50/1k", price: 1.5 },
    { id: "yt-likes", name: "Likes [Fast] - $0.80/1k", price: 0.8 },
  ],
  twitter: [
    { id: "tw-followers", name: "Followers [Quality] - $1.00/1k", price: 1.0 },
    { id: "tw-likes", name: "Likes - $0.30/1k", price: 0.3 },
    { id: "tw-retweets", name: "Retweets - $0.50/1k", price: 0.5 },
  ],
  facebook: [
    { id: "fb-likes", name: "Page Likes - $1.50/1k", price: 1.5 },
    { id: "fb-followers", name: "Followers - $1.20/1k", price: 1.2 },
  ],
  telegram: [
    { id: "tg-members", name: "Channel Members - $0.60/1k", price: 0.6 },
    { id: "tg-views", name: "Post Views - $0.05/1k", price: 0.05 },
  ],
  discord: [
    { id: "dc-members", name: "Server Members - $2.00/1k", price: 2.0 },
  ],
  spotify: [
    { id: "sp-plays", name: "Plays [Premium] - $1.00/1k", price: 1.0 },
    { id: "sp-followers", name: "Followers - $0.70/1k", price: 0.7 },
  ],
};

export const NewOrder = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [quantity, setQuantity] = useState(1000);
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const selectedServiceData = selectedPlatform
    ? services[selectedPlatform]?.find((s) => s.id === selectedService)
    : null;

  const totalPrice = selectedServiceData
    ? (selectedServiceData.price * quantity) / 1000
    : 0;

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(100, Math.min(100000, quantity + delta)));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    setOrderPlaced(true);
    setTimeout(() => setOrderPlaced(false), 3000);
  };

  return (
    <section id="services" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Place New Order</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Select your platform, choose a service, and watch your engagement grow instantly.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto bg-card rounded-2xl shadow-glow border border-border p-6 md:p-8"
        >
          {/* Platform Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-foreground mb-4">
              1. Select Platform
            </label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {platforms.map((platform) => (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedPlatform(platform.id);
                    setSelectedService("");
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
                    selectedPlatform === platform.id
                      ? "bg-primary/10 ring-2 ring-primary"
                      : "bg-secondary hover:bg-accent"
                  }`}
                >
                  <span className="text-2xl mb-1">{platform.icon}</span>
                  <span className="text-xs font-medium text-muted-foreground hidden md:block">
                    {platform.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          <AnimatePresence>
            {selectedPlatform && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <label className="block text-sm font-medium text-foreground mb-3">
                  2. Choose Service
                </label>
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select a service...</option>
                  {services[selectedPlatform]?.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
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
                {/* Link Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    3. Enter URL
                  </label>
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="url"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="Enter your post/profile URL..."
                      className="pl-12 h-12 bg-secondary border-border focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    4. Set Quantity
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
                        onChange={(e) => setQuantity(Number(e.target.value))}
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
                    min={100}
                    max={100000}
                    step={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full mt-4 accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>100</span>
                    <span>100,000</span>
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
                ${totalPrice.toFixed(2)}
              </div>
              {selectedServiceData && (
                <div className="text-xs text-muted-foreground mt-1">
                  Start: Instant • Speed: 5k/day
                </div>
              )}
            </div>
            <Button
              variant="hero"
              size="xl"
              disabled={!selectedService || !link || isLoading}
              onClick={handleSubmit}
              className="min-w-[180px]"
            >
              {isLoading ? (
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
    </section>
  );
};
