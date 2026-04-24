import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { getSignupLocked, signUpFirstAdmin } from "@/lib/queries";
import { Loader2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const [locked, setLocked] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSignupLocked().then(setLocked);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await signUpFirstAdmin(email, password, fullName);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Admin account created! Please sign in.");
    navigate({ to: "/login" });
  };

  if (locked === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-elegant">
          <CardContent className="pt-8 pb-8 text-center">
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Admin already exists</h1>
            <p className="text-muted-foreground mb-4 text-sm">
              The admin account has been created. New users can only be added by an admin.
            </p>
            <Link to="/login">
              <Button className="gradient-primary text-primary-foreground border-0">
                Go to login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-elegant border-0 overflow-hidden">
          <div className="gradient-accent h-2" />
          <CardContent className="pt-8 pb-8 px-8">
            <div className="flex justify-center mb-4">
              <Logo className="h-14" />
            </div>
            <h1 className="text-2xl font-bold text-center mb-1">First-time setup</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Create the admin account for this system
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (this will be your user ID)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password (min 6 characters)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-accent text-accent-foreground border-0 shadow-elegant hover:shadow-glow"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create admin account"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Once created, signups will be locked. New staff can only be added from Settings.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
