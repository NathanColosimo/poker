"use client"

import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Home } from "@/pages/Home"
import { GamePage } from "@/pages/GamePage"
import { AuthPage } from "@/pages/AuthPage"
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
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
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
