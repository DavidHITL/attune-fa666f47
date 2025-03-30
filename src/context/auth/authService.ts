
import { supabase } from "@/integrations/supabase/client";
import { AuthResult } from "./types";
import { v4 as uuidv4 } from "uuid";

export const authService = {
  signUp: async (email: string, password: string): Promise<AuthResult> => {
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

      // Verify if profile creation was already handled by the trigger
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
        
      if (profileCheckError) {
        console.warn("Error checking if profile exists:", profileCheckError.message);
      }
        
      // Only create a profile if it doesn't already exist
      if (!existingProfile) {
        try {
          console.log("No existing profile found, creating one manually");
          // Generate a partner code with UUID (more reliable than Math.random)
          const partnerCode = uuidv4().replace(/-/g, '').substring(0, 12);
          
          console.log("Creating profile for user:", data.user.id);
          const { error: profileError } = await supabase
            .from('users_profile')
            .insert({
              user_id: data.user.id,
              partner_code: partnerCode,
              message_count: 0
            });
            
          if (profileError) {
            console.error("Failed to create profile manually:", profileError.message);
            // Even if profile creation fails, the auth account was created
            return { data, success: true, profileError, error: null };
          }
          
          console.log("User profile created successfully");
        } catch (profileErr) {
          console.error("Error during manual profile creation:", profileErr);
          // Return success true since the auth account was created
          return { data, success: true, profileError: profileErr as Error, error: null };
        }
      } else {
        console.log("Profile already exists for this user");
      }
      
      return { data, success: true, error: null };
    } catch (err) {
      console.error("An unexpected error occurred during signup:", err);
      return { error: err as Error, success: false };
    }
  },

  signIn: async (email: string, password: string): Promise<AuthResult> => {
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
      
      // Always check if user has a profile after signin
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.warn("Error checking user profile:", profileError.message);
      } 
      
      // Create profile if it doesn't exist (defensive coding)
      if (!profileData) {
        console.log("No profile found during sign-in, creating one now");
        try {
          // Generate a partner code with UUID (more reliable than Math.random)
          const partnerCode = uuidv4().replace(/-/g, '').substring(0, 12);
          
          await supabase
            .from('users_profile')
            .insert({
              user_id: data.user.id,
              partner_code: partnerCode,
              message_count: 0
            });
            
          console.log("Created missing profile during sign-in");
        } catch (createErr) {
          console.error("Failed to create profile during sign-in:", createErr);
          // Continue login process despite profile creation failure
        }
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
