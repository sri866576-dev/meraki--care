import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/lib/queries";
import { LogOut, Receipt, Settings, Loader2, Menu } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, role, loading, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

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

  const NavLinks = () => (
    <>
      <Link to="/billing" onClick={() => setOpen(false)}>
        <Button
          variant={pathname.startsWith("/billing") ? "default" : "ghost"}
          size={isMobile ? "sm" : "sm"}
          className={`w-full justify-start ${
            pathname.startsWith("/billing")
              ? "gradient-primary text-primary-foreground border-0"
              : ""
          }`}
        >
          <Receipt className="h-4 w-4 mr-2" />
          Billing
        </Button>
      </Link>
      {role === "admin" && (
        <Link to="/settings" onClick={() => setOpen(false)}>
          <Button
            variant={pathname.startsWith("/settings") ? "default" : "ghost"}
            size={isMobile ? "sm" : "sm"}
            className={`w-full justify-start ${
              pathname.startsWith("/settings")
                ? "gradient-primary text-primary-foreground border-0"
                : ""
            }`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40 shadow-sm"
      >
        <div className="w-full px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo */}
            <Link to="/billing" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Logo className="h-8 sm:h-9" />
            </Link>

            {/* Desktop Navigation */}
            {!isMobile && (
              <nav className="flex items-center gap-1 flex-1">
                <NavLinks />
              </nav>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-1 sm:gap-3 ml-auto">
              {/* User Info - Hidden on Mobile */}
              <div className="hidden sm:flex flex-col items-end min-w-0">
                <span className="text-xs sm:text-sm font-medium truncate">{user?.email}</span>
                <Badge
                  variant="outline"
                  className={`${
                    role === "admin"
                      ? "border-accent text-accent text-[10px]"
                      : "border-primary text-primary text-[10px]"
                  } mt-0.5`}
                >
                  {role?.toUpperCase()}
                </Badge>
              </div>

              {/* Mobile Menu */}
              {isMobile && (
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <div className="mt-6 space-y-3">
                      <div className="px-2 py-3 border-b">
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <Badge variant="outline" className="text-[10px] mt-2">
                          {role?.toUpperCase()}
                        </Badge>
                      </div>
                      <nav className="space-y-2">
                        <NavLinks />
                      </nav>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full justify-start"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Desktop Logout */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sign out"
                  className="h-9 w-9"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 w-full overflow-hidden">
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
