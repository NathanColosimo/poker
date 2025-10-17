"use client";

import {
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRoute, parseRoute } from "./pages/router";
import Home from "./pages/Home";
import GameLobby from "./pages/GameLobby";
import PlayerOrdering from "./pages/PlayerOrdering";
import GameTable from "./pages/GameTable";
import { Id } from "../convex/_generated/dataModel";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export default function App() {
  const route = useRoute();
  const { path, params } = parseRoute(route);

  return (
    <>
      <Authenticated>
        <AuthenticatedContent path={path} params={params} />
      </Authenticated>
      <Unauthenticated>
        <SignInForm />
      </Unauthenticated>
    </>
  );
}

function AuthenticatedContent({
  path,
  params,
}: {
  path: string;
  params: Record<string, string>;
}) {
  // Route to appropriate page
  if (path === "/lobby" && params.gameId) {
    return <GameLobby gameId={params.gameId as Id<"games">} />;
  }

  if (path === "/ordering" && params.gameId) {
    return <PlayerOrdering gameId={params.gameId as Id<"games">} />;
  }

  if (path === "/game" && params.gameId) {
    return <GameTable gameId={params.gameId as Id<"games">} />;
  }

  // Default to home
  return <Home />;
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const handleSignIn = async (values: z.infer<typeof signInSchema>) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", values.email);
      formData.set("password", values.password);
      formData.set("flow", "signIn");
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.set("email", values.email);
      formData.set("password", values.password);
      formData.set("name", values.name);
      formData.set("flow", "signUp");
      await signIn("password", formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">♠♥ Poker ♣♦</h1>
          <p className="text-green-200">Chip Manager</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {flow === "signIn" ? "Sign In" : "Sign Up"}
            </CardTitle>
            <CardDescription>
              {flow === "signIn"
                ? "Welcome back! Sign in to your account"
                : "Create a new account to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {flow === "signIn" ? (
              <Form {...signInForm}>
                <form onSubmit={(e) => void signInForm.handleSubmit(handleSignIn)(e)} className="space-y-4">
                  <FormField
                    control={signInForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="your@email.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signInForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={signInForm.formState.isSubmitting}
                  >
                    {signInForm.formState.isSubmitting ? "Signing In..." : "Sign In"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setFlow("signUp");
                        setError(null);
                      }}
                    >
                      Don't have an account? Sign up
                    </Button>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </Form>
            ) : (
              <Form {...signUpForm}>
                <form onSubmit={(e) => void signUpForm.handleSubmit(handleSignUp)(e)} className="space-y-4">
                  <FormField
                    control={signUpForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="your@email.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="••••••••" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Must be at least 6 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={signUpForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your Name" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This is how other players will see you
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={signUpForm.formState.isSubmitting}
                  >
                    {signUpForm.formState.isSubmitting ? "Signing Up..." : "Sign Up"}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setFlow("signIn");
                        setError(null);
                      }}
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
