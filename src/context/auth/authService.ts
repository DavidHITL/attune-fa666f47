
import { supabase } from "@/integrations/supabase/client";

export const authService = {
  signUp: async (email: string, password: string) => {
    try {
      console.log("Attempting to sign up user:", email);
      
      // Create the user in Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Registration failed:", error.message);
        return { error, success: false };
      }

      console.log("Auth account created successfully, user ID:", data.user?.id);
      
      // Check if the user was actually created in auth
      if (!data.user || !data.user.id) {
        console.error("User object is missing or invalid");
        return { 
          error: new Error("Failed to create user account properly"), 
          success: false 
        };
      }

      // Create a profile record directly, don't wait for the trigger
      try {
        // Generate a partner code directly
        const partnerCode = Math.random().toString(36).substring(2, 14);
        
        console.log("Creating profile for user:", data.user.id);
        const { error: profileError } = await supabase
          .from('users_profile')
          .insert({
            user_id: data.user.id,
            partner_code: partnerCode,
            message_count: 0
          });
          
        if (profileError) {
          console.error("Failed to create profile:", profileError.message);
          // Even if profile creation fails, the auth account was created
          return { data, success: true, profileError };
        }
        
        console.log("User profile created successfully");
        return { data, success: true };
      } catch (profileErr) {
        console.error("Error during profile creation:", profileErr);
        // Return success true since the auth account was created
        return { data, success: true, profileError: profileErr };
      }
    } catch (err) {
      console.error("An unexpected error occurred during signup:", err);
      return { error: err as Error, success: false };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in user:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login failed:", error.message);
        return { error, success: false };
      }

      console.log("Logged in successfully, user ID:", data.user?.id);
      
      // After successful login, check if user has a profile
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.warn("Error checking user profile:", profileError.message);
      } else if (!profileData) {
        console.log("No profile found, creating one now");
        // Create profile if it doesn't exist
        const partnerCode = Math.random().toString(36).substring(2, 14);
        await supabase
          .from('users_profile')
          .insert({
            user_id: data.user.id,
            partner_code: partnerCode,
            message_count: 0
          });
      }

      return { data, error: null, success: true };
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
