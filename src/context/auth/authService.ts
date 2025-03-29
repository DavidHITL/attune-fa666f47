
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const authService = {
  signUp: async (email: string, password: string) => {
    try {
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
    }
  },

  signIn: async (email: string, password: string) => {
    try {
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
    }
  },

  signOut: async () => {
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
    }
  }
};
