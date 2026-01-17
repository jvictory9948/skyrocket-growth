import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import epikLogo from "@/assets/epik-logo.png";

const benefits = [
  "Competitive salary & equity",
  "Remote-first culture",
  "Unlimited PTO",
  "Health insurance",
  "Learning & development budget",
  "Latest tech equipment",
];

const Careers = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-20 border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={epikLogo} alt="Epik" className="h-10 md:h-12 w-auto" />
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Join the <span className="text-primary">Epik</span> Team
            </h1>
            <p className="text-lg text-muted-foreground">
              We're building the future of social media growth. Come help us empower creators worldwide.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Why Join Epik?</h2>
            <p className="text-muted-foreground text-center mb-10">
              We offer competitive benefits and a culture that values work-life balance.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 bg-card rounded-xl border border-border p-4"
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* No Open Positions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">Open Positions</h2>
            <div className="bg-card rounded-2xl border border-border p-8 mt-8">
              <p className="text-muted-foreground text-lg mb-2">
                There are no open positions at the moment.
              </p>
              <p className="text-sm text-muted-foreground">
                Check back later or send us your resume for future opportunities.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">Want to join when we're hiring?</h2>
            <p className="text-muted-foreground mb-6">
              Send us your resume and we'll keep you in mind for future opportunities.
            </p>
            <a href="mailto:clyde@proton.me?subject=Job Application - Epik">
              <Button>
                <Mail className="mr-2 h-4 w-4" /> Send Resume
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
