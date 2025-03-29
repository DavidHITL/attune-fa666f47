
import { supabase } from "@/integrations/supabase/client";

export const authService = {
  signUp: async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Registration failed:", error.message);
        return { error, success: false };
      }

      console.log("Account created successfully");
      return { error: null, success: true };
    } catch (err) {
      console.error("An unexpected error occurred during signup:", err);
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
        console.error("Login failed:", error.message);
        return { error, success: false };
      }

      console.log("Logged in successfully");
      return { error: null, success: true };
    } catch (err) {
      console.error("An unexpected error occurred during signin:", err);
      return { error: err as Error, success: false };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      console.log("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }
};
