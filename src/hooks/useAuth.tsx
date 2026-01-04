import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserStatus = 'active' | 'suspended' | 'paused';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  balance: number;
  status: UserStatus;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  userStatus: UserStatus;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        id: data.id,
        username: data.username,
        avatar_url: data.avatar_url,
        balance: Number(data.balance),
        status: (data.status as UserStatus) || 'active',
      });
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetch to avoid deadlock
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    // Check if email is blocked
    const { data: blockedEmail } = await supabase
      .from("blocked_emails")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (blockedEmail) {
      return { error: new Error("This email address has been blocked and cannot be used for registration.") };
    }

    // Use an Edge Function that creates the user with the service role key
    // so the email is marked confirmed immediately.
    try {
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      console.log('create-user fnUrl:', fnUrl);
      console.log('create-user publishableKey present:', Boolean(publishableKey));

      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ email, password, username }),
      });
      const clone = resp.clone();
      let bodyText = '';
      try { bodyText = await clone.text(); } catch (e) { /* ignore */ }
      console.log('create-user response status:', resp.status, 'body:', bodyText);

      const json = await resp.json();
      if (!resp.ok) {
        return { error: new Error(json?.error || 'Failed to create user') };
      }

      // Sign the user in immediately after creation
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      return { error: signInError };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Signup failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Track user login with IP and location (fire and forget)
    if (!error) {
      supabase.functions.invoke("track-user-login").catch(console.error);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await checkAdminRole(user.id);
    }
  };

  const userStatus: UserStatus = profile?.status || 'active';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isAdmin,
        userStatus,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
