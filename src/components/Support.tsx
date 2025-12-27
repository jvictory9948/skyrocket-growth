import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";

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

export const Support = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="support" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Need Help?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions or reach out to our 24/7 support team.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-accent/30 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">
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
                      <div className="px-6 pb-4 border-l-2 border-primary ml-6">
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
      </div>

      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 h-14 w-14 bg-primary rounded-full shadow-glow flex items-center justify-center text-primary-foreground z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </section>
  );
};
