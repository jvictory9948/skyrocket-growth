import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import epikLogo from "@/assets/epik-logo.png";

const Terms = () => {
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

      {/* Content */}
      <section className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl font-bold text-foreground mb-6">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using Epik ("the Service"), you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please do not 
                  use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  Epik provides social media marketing services including but not limited to followers, likes, 
                  views, and engagement for various social media platforms. We act as an intermediary service 
                  connecting users with third-party providers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You must be at least 18 years old to use this service</li>
                  <li>You are responsible for maintaining the confidentiality of your account</li>
                  <li>You agree not to use the service for any illegal or unauthorized purpose</li>
                  <li>You must not violate any laws in your jurisdiction</li>
                  <li>You are responsible for all content posted and activity under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">4. Service Delivery</h2>
                <p className="text-muted-foreground">
                  We strive to deliver all orders in a timely manner. However, delivery times are estimates 
                  and may vary depending on demand and third-party factors. We do not guarantee specific 
                  delivery times unless explicitly stated.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">5. Payment Terms</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>All payments are processed securely through our payment partners</li>
                  <li>Funds added to your account are non-refundable</li>
                  <li>We reserve the right to change pricing at any time</li>
                  <li>You agree to pay for all orders placed through your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">6. Prohibited Activities</h2>
                <p className="text-muted-foreground">
                  You may not use our service for accounts that promote hate speech, violence, illegal 
                  activities, or content that violates the terms of service of the target social media 
                  platforms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  Epik shall not be liable for any indirect, incidental, special, consequential, or 
                  punitive damages resulting from your use of or inability to use the service. We are 
                  not responsible for any actions taken by social media platforms against your accounts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">8. Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. We will notify users of 
                  significant changes via email or through the platform. Continued use of the service 
                  after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact Information</h2>
                <p className="text-muted-foreground">
                  For any questions regarding these terms, please contact us through our support system 
                  or email us at support@epicsmm.com.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
