import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, User, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "./ui/button";

const navLinks = [
  { name: "Dashboard", href: "#dashboard" },
  { name: "Services", href: "#services" },
  { name: "Mass Order", href: "#mass-order" },
  { name: "API", href: "#api" },
  { name: "Support", href: "#support" },
];

export const Navigation = () => {
  const [activeLink, setActiveLink] = useState("Dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 h-20 glass border-b border-border/50"
    >
      <div className="container mx-auto h-full flex items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 group">
          <div className="relative">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              E<span className="text-primary">p</span>ic
            </span>
            <motion.div
              className="absolute -bottom-1 left-0 h-0.5 bg-primary"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 0.3 }}
            />
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setActiveLink(link.name)}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
              {activeLink === link.name && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                />
              )}
            </a>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Balance Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-accent rounded-full pl-4 pr-1 py-1">
            <span className="text-sm font-semibold text-foreground">$45.00</span>
            <Button variant="icon" size="icon" className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent-foreground flex items-center justify-center text-primary-foreground font-semibold hover:shadow-glow transition-shadow"
            >
              <User className="h-5 w-5" />
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-14 w-48 bg-card rounded-xl shadow-card border border-border overflow-hidden"
                >
                  <div className="p-2">
                    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Settings</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-destructive transition-colors">
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-b border-border/50"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    setActiveLink(link.name);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeLink === link.name
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex items-center gap-2 mt-2 bg-accent rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-foreground">Balance: $45.00</span>
                <Button variant="default" size="sm" className="ml-auto">
                  <Plus className="h-4 w-4 mr-1" /> Add Funds
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
