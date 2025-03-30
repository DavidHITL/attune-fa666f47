
import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LandingNavBar from "@/components/LandingNavBar";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type FormData = z.infer<typeof formSchema>;

const SignIn: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Get the redirect path from location state or default to "/you"
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/you";

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log("Attempting to sign in with:", data.email);
      const { success, error, data: authData } = await signIn(data.email, data.password);
      
      if (success) {
        console.log("Login successful, navigating to:", from);
        toast({
          title: "Welcome back",
          description: "You have successfully signed in",
        });
        navigate(from, { replace: true });
      } else if (error) {
        console.error("Login error:", error.message);

        if (error.message.includes("Invalid login credentials")) {
          // Special case for when a user just created an account but the database trigger failed
          toast({
            title: "Login failed",
            description: "If you just created your account, please wait a moment and try again. Otherwise, check your credentials.",
            variant: "destructive"
          });
        } else {
          setError(error.message);
        }
      }
    } catch (err) {
      console.error("Unexpected error during sign in:", err);
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a dependency to uuid
  React.useEffect(() => {
    // Check URL parameters for any signup success indicators
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'success') {
      toast({
        title: "Account created",
        description: "Your account was created successfully. Please sign in.",
        variant: "default",
      });
    }
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen">
      <LandingNavBar />
      <Toaster />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-gray-500 mt-2">Sign in to your account</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        {...field}
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="•••••••••••"
                        type="password"
                        {...field}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full px-8 py-6 text-lg bg-black hover:bg-gray-800 rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-gray-500 border-t border-gray-200">
        Attune<br />
        Napkin LLC — Zurich
      </footer>
    </div>
  );
};

export default SignIn;
