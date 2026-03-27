"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Bot, Mail } from "lucide-react"

function VerifyOtpForm() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get("email") ?? ""
  const type = params.get("type") ?? "login"

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    setError("")

    // Verify OTP
    const verifyRes = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })
    const verifyData = await verifyRes.json()

    if (!verifyRes.ok) {
      setError(verifyData.error ?? "Verification failed.")
      setLoading(false)
      return
    }

    // Sign in with loginToken
    const result = await signIn("credentials", {
      email,
      loginToken: verifyData.loginToken,
      redirect: false,
    })

    if (result?.error) {
      setError("Sign-in failed. Please try again.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  async function handleResend() {
    setResending(true)
    setError("")

    // For resend, we just hit send-otp without password (uses stored session context)
    // On resend, we don't have the password — show a message to go back to login
    setError("To get a new code, please go back and sign in again.")
    setResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Bot className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SEO Blog Agent</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Check your email</CardTitle>
            </div>
            <CardDescription>
              We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
              {type === "signup" ? " Enter it to verify your account." : " Enter it to sign in."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="text-center text-2xl font-mono tracking-widest h-14"
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify code
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : resending
                  ? "Sending..."
                  : "Didn't receive a code?"}
              </button>
            </div>
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Wrong email?{" "}
              <a href="/login" className="font-medium text-foreground hover:underline">
                Go back
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  )
}
