import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";

const Refund = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-20 border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              E<span className="text-primary">p</span>ik
            </span>
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
            <h1 className="text-4xl font-bold text-foreground mb-6">Refund Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: January 1, 2025</p>

            <div className="prose prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
                <p className="text-muted-foreground">
                  At Epik, we want you to be completely satisfied with our services. This policy 
                  outlines the conditions under which refunds may be granted.
                </p>
              </section>

              {/* Eligible for Refund */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Eligible for Refund
                </h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Order not started within 24 hours (unless otherwise specified)</li>
                  <li>Significant under-delivery (less than 80% of ordered quantity)</li>
                  <li>Wrong service delivered</li>
                  <li>Technical error causing duplicate charges</li>
                  <li>Account suspension before order completion (case by case)</li>
                </ul>
              </section>

              {/* Not Eligible for Refund */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <XCircle className="h-6 w-6 text-red-500" />
                  Not Eligible for Refund
                </h2>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Order already completed or in progress</li>
                  <li>Private account or incorrect link provided</li>
                  <li>Account deleted or username changed during order</li>
                  <li>Drops after delivery (natural drop rates apply)</li>
                  <li>Services explicitly marked as non-refundable</li>
                  <li>Violation of platform terms of service</li>
                </ul>
              </section>

              {/* Important Notes */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                  Important Notes
                </h2>
                <div className="bg-card rounded-xl border border-border p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Refill vs Refund</h3>
                    <p className="text-muted-foreground text-sm">
                      Many of our services come with refill guarantees. Before requesting a refund, 
                      please consider using the refill option which can restore dropped followers/likes.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Processing Time</h3>
                    <p className="text-muted-foreground text-sm">
                      Approved refunds are processed within 24-48 hours as account balance. Cash 
                      refunds to original payment method may take 5-10 business days.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Partial Refunds</h3>
                    <p className="text-muted-foreground text-sm">
                      If an order is partially completed, you may be eligible for a partial refund 
                      for the undelivered portion.
                    </p>
                  </div>
                </div>
              </section>

              {/* How to Request */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">How to Request a Refund</h2>
                <ol className="list-decimal list-inside text-muted-foreground space-y-2">
                  <li>Log into your Epik account</li>
                  <li>Navigate to the Support section</li>
                  <li>Open a new ticket with subject "Refund Request"</li>
                  <li>Provide your order ID and reason for refund</li>
                  <li>Our team will review and respond within 24 hours</li>
                </ol>
              </section>

              {/* Balance Refunds */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Account Balance</h2>
                <p className="text-muted-foreground">
                  Funds added to your Epik account balance are generally non-refundable. We 
                  encourage users to add only the amount they intend to use. In exceptional 
                  circumstances, balance refunds may be considered at our discretion.
                </p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this refund policy or need assistance with a 
                  refund request, please contact our support team through the dashboard or 
                  email us at support@epicsmm.com.
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

export default Refund;
