import { motion } from "framer-motion";
import { ShieldX, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Suspended = () => {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4 text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6"
        >
          <ShieldX className="h-10 w-10 text-destructive" />
        </motion.div>

        {/* Logo */}
        <span className="text-3xl font-extrabold text-foreground tracking-tight mb-4 block">
          E<span className="text-primary">p</span>ic
        </span>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Account Suspended
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Your account has been suspended by an administrator. If you believe this is a mistake, please contact our support team.
        </p>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card border border-border p-6 mb-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Contact Support</h3>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span>support@epic.com</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </motion.div>
    </div>
  );
};

export default Suspended;
