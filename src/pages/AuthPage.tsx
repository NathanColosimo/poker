import { useState } from "react"
import { useConvexAuth } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { Navigate } from "react-router-dom"
import { SignInForm } from "@/components/SignInForm"
import { SignUpForm } from "@/components/SignUpForm"

export function AuthPage() {
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

  const handleSignUp = async (data: { name: string; email: string; password: string }) => {
    setError(null)
    const formData = new FormData()
    formData.append("name", data.name)
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

