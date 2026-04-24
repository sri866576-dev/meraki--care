import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { signInWithPassword, getSignupLocked } from "@/lib/queries";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState(false);

  useEffect(() => {
    getSignupLocked().then((locked) => setSetupAvailable(!locked));
  }, []);

  useEffect(() => {
    if (!loading && session && role) {
      navigate({ to: "/billing" });
    }
  }, [session, role, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    setSubmitting(true);
    const { error } = await signInWithPassword(email, password);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/billing" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elegant border-0 overflow-hidden">
          <div className="gradient-primary h-2" />
          <CardContent className="pt-8 pb-8 px-8">
            <div className="flex justify-center mb-6">
              <Logo className="h-14 animate-float" />
            </div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-center mb-1 text-foreground"
            >
              Welcome back
            </motion.h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Sign in to your billing dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:text-primary-glow transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground border-0 shadow-elegant hover:shadow-glow transition-all"
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </motion.div>
            </form>

            {setupAvailable && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 p-3 rounded-lg bg-accent/10 border border-accent/30 text-center text-sm"
              >
                <p className="text-foreground/80 mb-2">No admin account exists yet.</p>
                <Link
                  to="/setup"
                  className="text-accent font-semibold hover:underline"
                >
                  Create the admin account →
                </Link>
              </motion.div>
            )}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-4">
          Meraki Care · Hospital Billing System
        </p>
      </motion.div>
    </div>
  );
}
