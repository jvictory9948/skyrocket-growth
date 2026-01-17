import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import epikLogo from "@/assets/epik-logo.png";

const Privacy = () => {
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
            <h1 className="text-4xl font-bold text-foreground mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
                <p className="text-muted-foreground">
                  At Epik, we take your privacy seriously. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you use our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect</h2>
                <h3 className="text-xl font-medium text-foreground mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Email address</li>
                  <li>Username and password</li>
                  <li>Payment information (processed securely by third parties)</li>
                  <li>Social media profile links you provide for orders</li>
                </ul>

                <h3 className="text-xl font-medium text-foreground mt-4 mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Usage data and analytics</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Your Information</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>To provide and maintain our service</li>
                  <li>To process your transactions and orders</li>
                  <li>To send you updates and marketing communications</li>
                  <li>To respond to your inquiries and support requests</li>
                  <li>To detect and prevent fraud</li>
                  <li>To improve our service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures to protect your personal information. 
                  This includes encryption, secure servers, and regular security audits. However, no 
                  method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Services</h2>
                <p className="text-muted-foreground">
                  We may use third-party services for payment processing, analytics, and service delivery. 
                  These third parties have their own privacy policies and we encourage you to review them.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Cookies</h2>
                <p className="text-muted-foreground">
                  We use cookies and similar tracking technologies to enhance your experience. You can 
                  choose to disable cookies through your browser settings, but this may affect 
                  functionality.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Your Rights</h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your personal information for as long as your account is active or as needed 
                  to provide services. We may also retain data as required by law or for legitimate 
                  business purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any changes 
                  by posting the new policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us at 
                  privacy@epicsmm.com or through our support system.
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

export default Privacy;
