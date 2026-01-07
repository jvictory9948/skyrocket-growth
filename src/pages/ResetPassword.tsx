import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { Loader2, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import epikLogo from "@/assets/epik-logo.png";

const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score: 4, label: "Strong", color: "bg-green-500" };
  return { score: 5, label: "Very Strong", color: "bg-emerald-500" };
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No reset token provided. Please request a new password reset link.");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Verifying token...");
        const { data, error: fnError } = await supabase.functions.invoke("reset-password", {
          body: { token },
          headers: { "Content-Type": "application/json" },
        });

        // Add query param for verify action
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password?action=verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ token }),
          }
        );

        const result = await response.json();

        if (result.valid) {
          console.log("Token is valid");
          setIsValidToken(true);
        } else {
          console.log("Token is invalid:", result.error);
          setError(result.error || "Invalid or expired reset link. Please request a new one.");
        }
      } catch (err: any) {
        console.error("Token verification error:", err);
        setError("Failed to verify reset link. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ token, newPassword: password }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to update password");
      }

      setIsSuccess(true);
      toast({
        title: "Password updated",
        description: "Your password has been reset successfully. Please log in with your new password.",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (err: any) {
      console.error("Password update error:", err);
      setError(err.message || "Failed to update password. Please try again.");
      toast({
        title: "Error",
        description: err.message || "Failed to update password.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <a href="/" className="inline-block">
            <img src={epikLogo} alt="Epik" className="h-40 mx-auto" />
          </a>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground mt-3 text-sm"
          >
            {isLoading ? "Verifying reset link..." : isSuccess ? "Password updated!" : "Create a new password"}
          </motion.p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-6"
        >
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Verifying your reset link...</p>
            </div>
          ) : isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Password Updated</h2>
              <p className="text-sm text-muted-foreground">
                Redirecting you to login...
              </p>
            </motion.div>
          ) : !isValidToken && error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Invalid Reset Link</h2>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button
                variant="outline"
                onClick={() => navigate("/forgot-password")}
                className="rounded-xl"
              >
                Request New Reset Link
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-10 h-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Bar */}
                {password.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2"
                  >
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <motion.div
                          key={level}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: level * 0.05 }}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${passwordStrength.color.replace("bg-", "text-")}`}>
                      {passwordStrength.label}
                    </p>
                  </motion.div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-10 bg-secondary/50 border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20 text-sm rounded-xl"
                  />
                </div>
              </div>

              {error && isValidToken && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-xs"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                variant="hero"
                size="default"
                className="w-full h-10 text-sm font-medium rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
