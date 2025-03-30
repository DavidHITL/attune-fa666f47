
import { supabase } from "@/integrations/supabase/client";

export const authService = {
  signUp: async (email: string, password: string) => {
    try {
      // Create the user in Supabase auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Registration failed:", error.message);
        return { error, success: false };
      }

      // User created successfully in auth.users
      // Now manually create a profile if the trigger failed
      try {
        // Allow more time for auth changes to propagate
        setTimeout(async () => {
          try {
            const { data: userData } = await supabase.auth.getUser();
            if (userData && userData.user) {
              // Check if profile exists
              const { data: existingProfile } = await supabase
                .from('users_profile')
                .select('*')
                .eq('user_id', userData.user.id)
                .single();
                
              // Only create a profile if it doesn't exist
              if (!existingProfile) {
                // Generate a random partner code using a safer method
                const partnerCode = Array(12)
                  .fill(0)
                  .map(() => Math.floor(Math.random() * 36).toString(36))
                  .join('');
                
                const { error: profileError } = await supabase
                  .from('users_profile')
                  .insert({
                    user_id: userData.user.id,
                    partner_code: partnerCode,
                    message_count: 0
                  });
                  
                if (profileError) {
                  console.warn("Failed to create user profile, but auth account was created:", profileError.message);
                } else {
                  console.log("Successfully created fallback user profile");
                }
              }
            }
          } catch (delayedProfileErr) {
            console.warn("Error in delayed profile creation:", delayedProfileErr);
          }
        }, 2000); // Increased timeout to give more time for database operations
      } catch (profileErr) {
        // Even if profile creation fails, the user's auth account is created
        console.warn("Error creating user profile, but auth account was created:", profileErr);
      }

      console.log("Account created successfully");
      return { data, error: null, success: true };
    } catch (err) {
      console.error("An unexpected error occurred during signup:", err);
      return { error: err as Error, success: false };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login failed:", error.message);
        return { error, success: false };
      }

      console.log("Logged in successfully");
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
