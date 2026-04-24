import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { sendPasswordReset } from "@/lib/queries";
import { ArrowLeft, Loader2, Mail } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setSubmitting(true);
    const { error } = await sendPasswordReset(email);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("If that email exists, a reset link has been sent.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elegant border-0 overflow-hidden">
          <div className="gradient-primary h-2" />
          <CardContent className="pt-8 pb-8 px-8">
            <div className="flex justify-center mb-4">
              <Logo className="h-12" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-1">Forgot password?</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Enter your email (your user ID) and we'll send a reset link.
            </p>
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <Mail className="h-12 w-12 text-primary mx-auto mb-3" />
                <p className="font-semibold">Check your inbox</p>
                <p className="text-sm text-muted-foreground mt-2">
                  If <span className="font-medium text-foreground">{email}</span> exists, you'll
                  receive a password reset email shortly.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gradient-primary text-primary-foreground border-0 shadow-elegant hover:shadow-glow"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
            )}
            <Link
              to="/login"
              className="mt-6 flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
