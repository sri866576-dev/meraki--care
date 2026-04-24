import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/queries";
import { LogOut, Receipt, Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, role, loading, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/login" });
    }
  }, [session, loading, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/billing" className="flex items-center gap-3">
            <Logo className="h-9" />
          </Link>
          <nav className="flex items-center gap-1">
            <Link to="/billing">
              <Button
                variant={pathname.startsWith("/billing") ? "default" : "ghost"}
                size="sm"
                className={
                  pathname.startsWith("/billing")
                    ? "gradient-primary text-primary-foreground border-0"
                    : ""
                }
              >
                <Receipt className="h-4 w-4 mr-2" />
                Billing
              </Button>
            </Link>
            {role === "admin" && (
              <Link to="/settings">
                <Button
                  variant={pathname.startsWith("/settings") ? "default" : "ghost"}
                  size="sm"
                  className={
                    pathname.startsWith("/settings")
                      ? "gradient-primary text-primary-foreground border-0"
                      : ""
                  }
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium leading-tight">{user?.email}</span>
              <Badge
                variant="outline"
                className={
                  role === "admin"
                    ? "border-accent text-accent text-[10px] mt-0.5"
                    : "border-primary text-primary text-[10px] mt-0.5"
                }
              >
                {role?.toUpperCase()}
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
