import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, Shield, Clock, TrendingUp, Check, Star, Users, Globe, ChevronDown, Sparkles, MessageCircle, Award, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { socialIcons } from "@/components/icons/SocialIcons";
import { useAuth } from "@/hooks/useAuth";
import epikLogo from "@/assets/epik-logo.png";
import { useState } from "react";
import { cn } from "@/lib/utils";

const platforms = [
  { id: "instagram", name: "Instagram", color: "from-pink-500 to-purple-600" },
  { id: "tiktok", name: "TikTok", color: "from-cyan-500 to-pink-500" },
  { id: "youtube", name: "YouTube", color: "from-red-500 to-red-600" },
  { id: "twitter", name: "Twitter", color: "from-blue-400 to-blue-600" },
  { id: "linkedin", name: "LinkedIn", color: "from-blue-600 to-blue-800" },
  { id: "facebook", name: "Facebook", color: "from-blue-500 to-blue-700" },
];

const features = [
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Most orders start within minutes. Watch your engagement grow in real-time with our automated systems.",
  },
  {
    icon: Shield,
    title: "100% Safe & Secure",
    description: "We use safe delivery methods that comply with platform guidelines. Your account safety is our priority.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our support team is always available to help you with any questions. We're here whenever you need us.",
  },
  {
    icon: TrendingUp,
    title: "Real Growth",
    description: "High-quality services that deliver genuine, lasting engagement. No bots, no fake accounts.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Create Account",
    description: "Sign up in seconds with just your email. No complicated verification needed.",
  },
  {
    step: "02",
    title: "Add Funds",
    description: "Top up your wallet using your preferred payment method. Multiple options available.",
  },
  {
    step: "03",
    title: "Place Order",
    description: "Select your service, enter your link, and watch the magic happen instantly.",
  },
  {
    step: "04",
    title: "See Results",
    description: "Track your order in real-time and watch your engagement grow exponentially.",
  },
];

const testimonials = [
  {
    name: "Adaeze O.",
    role: "Content Creator",
    avatar: "AO",
    content: "Epik helped me grow my Instagram from 2k to 50k followers in just 3 months. The quality is amazing!",
    rating: 5,
  },
  {
    name: "Chinedu K.",
    role: "Business Owner",
    avatar: "CK",
    content: "Best SMM panel I've used in Nigeria. Fast delivery, real engagement, and amazing support team.",
    rating: 5,
  },
  {
    name: "Fatima A.",
    role: "Influencer",
    avatar: "FA",
    content: "I've tried many panels, but Epik stands out. The engagement is genuine and prices are unbeatable.",
    rating: 5,
  },
  {
    name: "Emeka N.",
    role: "Digital Marketer",
    avatar: "EN",
    content: "My clients love the results. Epik is now my go-to for all social media growth services.",
    rating: 5,
  },
];

const stats = [
  { value: "50K+", label: "Active Users", icon: Users },
  { value: "99.9%", label: "Uptime", icon: Zap },
  { value: "10M+", label: "Orders Delivered", icon: Globe },
  { value: "4.9/5", label: "User Rating", icon: Star },
];

const faqs = [
  {
    question: "How fast will I see results?",
    answer: "Most orders start within minutes of placing them. Depending on the service, you'll see full results within a few hours to 24 hours.",
  },
  {
    question: "Is it safe for my account?",
    answer: "Yes! We use organic delivery methods that comply with platform guidelines. Your account safety is our top priority.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept bank transfers, card payments, and various mobile money options including M-Pesa and MoMo.",
  },
  {
    question: "Can I get a refund?",
    answer: "Yes, if we can't deliver your order, you'll receive a full refund to your wallet balance. Check our refund policy for details.",
  },
  {
    question: "Do you offer bulk discounts?",
    answer: "Yes! We offer competitive rates for bulk orders. Contact our support team for custom pricing on large orders.",
  },
];

const whyChooseUs = [
  { title: "Trusted by Thousands", description: "Over 50,000 creators and businesses rely on us daily", icon: Users },
  { title: "Lightning Fast", description: "Most orders start delivering within minutes", icon: Zap },
  { title: "Always Available", description: "Our platform runs 24/7 with 99.9% uptime", icon: Globe },
  { title: "Award Winning", description: "Recognized for excellence in customer service", icon: Award },
];

const FAQItem = ({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="border border-border rounded-2xl overflow-hidden bg-card"
  >
    <button
      onClick={onClick}
      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
    >
      <span className="font-heading font-semibold text-foreground">{question}</span>
      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
    </button>
    <motion.div
      initial={false}
      animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
      className="overflow-hidden"
    >
      <p className="px-6 pb-5 text-muted-foreground">{answer}</p>
    </motion.div>
  </motion.div>
);

const Landing = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Global purple glow background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[80px]" />
      </div>
      {/* Navigation */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="fixed top-0 left-0 right-0 z-50 h-20 glass border-b border-border/50"
      >
        <div className="container mx-auto h-full flex items-center justify-between px-4 lg:px-8">
          <a href="/" className="flex items-center gap-2">
            <img src={epikLogo} alt="Epik" className="h-16 w-auto" />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#platforms" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Platforms
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button variant="default" size="sm">
                  Dashboard <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    Get Started <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            style={{ y: y1 }}
            className="absolute top-1/4 left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"
          />
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-1/4 right-[15%] w-96 h-96 bg-tertiary/15 rounded-full blur-3xl animate-pulse"
          />
          <div className="absolute top-[60%] left-[60%] w-64 h-64 bg-accent/30 rounded-full blur-3xl animate-float-slow" />
        </div>

        {/* Floating decorative shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ y: [-20, 20, -20], rotate: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[20%] w-16 h-16 border-2 border-primary/30 rounded-xl"
          />
          <motion.div
            animate={{ y: [20, -20, 20], rotate: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-[40%] left-[10%] w-12 h-12 bg-tertiary/20 rounded-full"
          />
          <motion.div
            animate={{ y: [-15, 15, -15], x: [-10, 10, -10] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[30%] right-[10%] w-20 h-20 border-2 border-tertiary/20 rounded-full"
          />
        </div>

        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-accent/80 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8 border border-primary/20"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-accent font-medium text-foreground">#1 Trusted SMM Panel • Fast & Reliable</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[9vw] sm:text-5xl md:text-7xl lg:text-8xl font-display font-extrabold tracking-tight mb-6 leading-tight px-2 sm:px-0"
            >
              <span className="text-foreground block">Supercharge</span>
              <span className="text-gradient block">Your Social</span>
              <span className="text-gradient-secondary block">Presence</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-body"
            >
              The most automated, safe, and instant social media boosting panel.
              Get authentic followers, likes, and engagement from a trusted platform
              designed to help influencers, brands, and businesses scale up fast!
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button variant="hero" size="xl" className="group">
                  {user ? "Go to Dashboard" : "Start Growing Now"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="font-heading">
                  See How It Works
                </Button>
              </a>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 mb-16"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">Best Prices Guaranteed</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">24/7 Support</span>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-glow transition-all duration-300"
                >
                  <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-display font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 font-accent">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-xs font-accent">Scroll to explore</span>
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* Platforms Marquee */}
      <section id="platforms" className="py-16 bg-secondary/30 border-y border-border overflow-hidden">
        <div className="container mx-auto px-4 mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm text-muted-foreground font-accent"
          >
            Boost engagement on all major platforms
          </motion.p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 px-4 max-w-4xl mx-auto">
          {platforms.map((platform, index) => {
            const Icon = socialIcons[platform.id];
            return (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -3 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-card transition-all duration-300 cursor-pointer group"
              >
                <div className={cn("p-3 rounded-xl bg-gradient-to-br opacity-90 group-hover:opacity-100 transition-opacity", platform.color)}>
                  {Icon && <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />}
                </div>
                <span className="text-sm font-heading font-medium text-foreground">{platform.name}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent rounded-full text-sm font-accent font-medium text-primary mb-4">
              Why Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Why <span className="text-gradient">Epik</span> Stands Out
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              We've helped thousands of creators and businesses grow their audience with our reliable, fast, and affordable services.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-card rounded-2xl border border-border p-6 hover:shadow-card-hover hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground font-body">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent rounded-full text-sm font-accent font-medium text-primary mb-4">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Get started in just a few simple steps. It's never been easier to grow your social media presence.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="relative"
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="bg-card border border-border rounded-2xl p-6 relative z-10 hover:border-primary/30 hover:shadow-card transition-all">
                  <div className="text-6xl font-display font-bold text-primary/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground font-body">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-tertiary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/4 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent rounded-full text-sm font-accent font-medium text-primary mb-4">
              Why Choose Us
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Built for <span className="text-gradient-secondary">Success</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              We're committed to helping you grow your social media presence with the best tools and support available.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-primary mb-4">
                  <item.icon className="h-7 w-7 text-white" />
                </div>
                <h4 className="font-heading font-semibold text-foreground mb-2">{item.title}</h4>
                <p className="text-sm text-muted-foreground font-body">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent rounded-full text-sm font-accent font-medium text-primary mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Loved by <span className="text-gradient">Thousands</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Don't just take our word for it. Here's what our customers have to say about Epik.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-card-hover hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-foreground mb-6 font-body">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-foreground">{testimonial.name}</h4>
                    <span className="text-sm text-muted-foreground font-accent">{testimonial.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 bg-accent rounded-full text-sm font-accent font-medium text-primary mb-4">
              FAQ
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Got questions? We've got answers. If you can't find what you're looking for, reach out to our support team.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaq === index}
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/20 mb-8"
            >
              <Heart className="h-8 w-8 text-white" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">
              Ready to Grow Your<br />Social Presence?
            </h2>
            <p className="text-lg text-white/80 mb-10 font-body max-w-xl mx-auto">
              Join over 50,000 creators and businesses who trust Epik to boost their social media engagement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button size="xl" className="group font-heading bg-white text-primary hover:bg-white/90">
                  {user ? "Go to Dashboard" : "Start Your Journey"}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" className="font-heading bg-transparent text-white border-2 border-white/40 hover:bg-white/10 hover:border-white/60">
                  Learn More About Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;