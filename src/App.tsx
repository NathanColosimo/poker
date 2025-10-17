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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">♠♥ Poker ♣♦</h1>
          <p className="text-green-200">Chip Manager</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-green-900 mb-6">
            {flow === "signIn" ? "Sign In" : "Sign Up"}
          </h2>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set("flow", flow);
              void signIn("password", formData).catch((error) => {
                setError(error.message);
              });
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                type="email"
                name="email"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </div>

            {flow === "signUp" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                />
              </div>
            )}

            <button
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition-colors"
              type="submit"
            >
              {flow === "signIn" ? "Sign In" : "Sign Up"}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
                onClick={() => {
                  setFlow(flow === "signIn" ? "signUp" : "signIn");
                  setError(null);
                }}
              >
                {flow === "signIn"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
