
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: () => boolean;
  signUp: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of admin emails - normally this would be in a database
const ADMIN_EMAILS = [
  "david@humaneintheloop.com"
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to check if current user is an admin
  const isAdmin = () => {
    if (!user) return false;
    return ADMIN_EMAILS.includes(user.email || '');
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          console.log("User signed out, navigating to landing page");
          navigate("/");
        } else if (event === "TOKEN_REFRESHED") {
          console.log("Token refreshed successfully");
        } else if (event === "USER_UPDATED") {
          console.log("User data updated");
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log("Existing session found:", existingSession.user.id);
          setSession(existingSession);
          setUser(existingSession.user);
          
          // Attempt to refresh the token if it's close to expiring
          const expiresAt = existingSession.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            // If token expires in less than 60 minutes, refresh it
            if (expiresIn < 3600) {
              console.log("Token expiring soon, refreshing...");
              const { data } = await supabase.auth.refreshSession();
              if (data.session) {
                console.log("Session refreshed successfully");
                setSession(data.session);
                setUser(data.session.user);
              }
            }
          }
        } else {
          console.log("No existing session found");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message,
        });
        return { error, success: false };
      }

      toast({
        title: "Account created",
        description: "You have successfully created an account!",
      });
      return { error: null, success: true };
    } catch (err) {
      toast({
        variant: "destructive",
        title: "An unexpected error occurred",
        description: "Please try again later.",
      });
      return { error: err as Error, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.message,
        });
        return { error, success: false };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      return { error: null, success: true };
    } catch (err) {
      toast({
        variant: "destructive",
        title: "An unexpected error occurred",
        description: "Please try again later.",
      });
      return { error: err as Error, success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "An error occurred while signing out.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        signUp,
        signIn,
        signOut,
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
