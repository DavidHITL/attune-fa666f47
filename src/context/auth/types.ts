
import { Session, User } from "@supabase/supabase-js";

export type AuthResult = {
  error: Error | null;
  success: boolean;
  data?: { user: User | null; session: Session | null };
  profileError?: Error | null;
};

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: () => boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

// List of admin emails - normally this would be in a database
export const ADMIN_EMAILS = [
  "david@humaneintheloop.com"
];
