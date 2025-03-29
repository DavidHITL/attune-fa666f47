
import { Session, User } from "@supabase/supabase-js";

export type AuthContextType = {
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

// List of admin emails - normally this would be in a database
export const ADMIN_EMAILS = [
  "david@humaneintheloop.com"
];
