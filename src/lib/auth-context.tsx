import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRole } from "@/lib/queries";
import type { Session, User } from "@supabase/supabase-js";

type Role = "admin" | "staff" | null;

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  role: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setRole(null);
      return;
    }
    try {
      const r = await getMyRole(uid);
      setRole(r);
    } catch {
      setRole(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    await loadRole(data.session?.user?.id);
  }, [loadRole]);

  useEffect(() => {
    // Subscribe FIRST, then getSession (per Supabase guidance)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // defer role fetch to avoid deadlock
      setTimeout(() => loadRole(newSession?.user?.id), 0);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      loadRole(data.session?.user?.id).finally(() => setLoading(false));
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadRole]);

  return (
    <AuthContext.Provider value={{ session, user, role, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
