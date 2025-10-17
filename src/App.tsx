"use client"

import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { SignInForm } from "@/components/SignInForm"
import { SignUpForm } from "@/components/SignUpForm"
import { Home } from "@/pages/Home"
import { GamePage } from "@/pages/GamePage"
import { Button } from "@/components/ui/button"

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/game/:gameId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function Header() {
  const { isAuthenticated } = useConvexAuth()
  const { signOut } = useAuthActions()

  return (
    <header className="sticky top-0 z-10 bg-card border-b px-4 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="font-bold text-xl">Texas Hold'em Chip Manager</div>
        {isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void signOut()}
          >
            Sign Out
          </Button>
        )}
      </div>
    </header>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>{children}</Authenticated>
      <Unauthenticated>
        <Navigate to="/auth" replace />
      </Unauthenticated>
    </>
  )
}

function AuthPage() {
  const { isAuthenticated } = useConvexAuth()
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn")
  const [error, setError] = useState<string | null>(null)

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSignIn = async (data: { email: string; password: string }) => {
    setError(null)
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    formData.append("flow", "signIn")

    try {
      await signIn("password", formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
      throw err
    }
  }

  const handleSignUp = async (data: { email: string; password: string }) => {
    setError(null)
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    formData.append("flow", "signUp")

    try {
      await signIn("password", formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
      throw err
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {flow === "signIn" ? (
        <SignInForm
          onSubmit={handleSignIn}
          onSwitchToSignUp={() => {
            setFlow("signUp")
            setError(null)
          }}
          error={error || undefined}
        />
      ) : (
        <SignUpForm
          onSubmit={handleSignUp}
          onSwitchToSignIn={() => {
            setFlow("signIn")
            setError(null)
          }}
          error={error || undefined}
        />
      )}
    </div>
  )
}
