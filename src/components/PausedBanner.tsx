import { AlertTriangle, Mail } from "lucide-react";
import { motion } from "framer-motion";

export const PausedBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-500">Account Paused</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Your account has been paused by an administrator. You cannot place new orders.
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4 text-amber-500" />
            <span>Contact support@epic.com to get your account unpaused.</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
