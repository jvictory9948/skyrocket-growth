import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Mail, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const faqs = [
  {
    question: "How long does it take for my order to start?",
    answer:
      "Most orders start within 0-5 minutes. Some services may take up to 1 hour during peak times. You can always check your order status in the dashboard.",
  },
  {
    question: "Are the followers/likes/views real?",
    answer:
      "We offer a mix of services. Our 'Real' labeled services come from active accounts. Standard services use high-quality profiles. Check each service description for details.",
  },
  {
    question: "What if my order doesn't complete?",
    answer:
      "We offer automatic refunds for incomplete orders. If your order is marked 'partial' or 'cancelled', your balance will be refunded within 24 hours.",
  },
  {
    question: "Is it safe to use this service?",
    answer:
      "Yes! We use safe delivery methods that comply with platform guidelines. We've never had a customer account suspended due to our services.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "We offer refunds for orders that fail to deliver. Completed orders are non-refundable. Contact support if you have any issues.",
  },
  {
    question: "Do you offer refills?",
    answer:
      "Yes! Services marked with [Refill] include free replacement of dropped followers/likes for up to 30 days.",
  },
];

const Support = () => {
  const { user } = useAuth();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
      });

      if (error) throw error;

      toast({
        title: "Ticket submitted!",
        description: "We'll get back to you within 24 hours.",
      });
      setSubject("");
      setMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit ticket.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Support</h1>
        <p className="text-muted-foreground mt-1">
          Find answers or reach out to our 24/7 support team.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl">
        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-accent/30 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground pr-4">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-4 border-l-2 border-primary ml-5">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Submit a Ticket
          </h2>
          <div className="bg-card rounded-2xl border border-border p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's your issue about?"
                  className="h-12 bg-secondary border-border"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="min-h-[150px] bg-secondary border-border"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                variant="hero" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Or reach out directly:
              </p>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                support@epic.com
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary rounded-full shadow-glow flex items-center justify-center text-primary-foreground z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default Support;
