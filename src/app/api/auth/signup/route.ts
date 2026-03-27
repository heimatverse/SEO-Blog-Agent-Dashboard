import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/sanity/lib/client"
import { sendOtpEmail } from "@/lib/email"
import { groq } from "next-sanity"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    // Check if user already exists
    const existing = await sanityClient.fetch(
      groq`*[_type == "user" && email == $email][0]{ _id, isVerified }`,
      { email }
    )
    if (existing?.isVerified) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 })
    }

    // Hash password and create or update user
    const passwordHash = await bcrypt.hash(password, 12)
    if (existing) {
      // Unverified account — update it (allows retry after failed email send)
      await sanityClient.patch(existing._id).set({ name, passwordHash }).commit()
    } else {
      await sanityClient.create({
        _type: "user",
        email,
        name,
        passwordHash,
        isVerified: false,
        createdAt: new Date().toISOString(),
      })
    }

    // Generate and store OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const codeHash = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Delete any existing OTPs for this email
    const oldTokens = await sanityClient.fetch(
      groq`*[_type == "otpToken" && email == $email]{ _id }`,
      { email }
    )
    for (const t of oldTokens) {
      await sanityClient.delete(t._id)
    }

    await sanityClient.create({ _type: "otpToken", email, codeHash, expiresAt, type: "signup" })

    // Send OTP email
    try {
      await sendOtpEmail(email, code, name)
    } catch (emailErr) {
      console.error("[signup] email send failed:", emailErr)
      const msg = !process.env.RESEND_API_KEY
        ? "Email service not configured — add RESEND_API_KEY to Vercel env vars."
        : "Failed to send verification email. Please try again."
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[signup]", err)
    const msg = err instanceof Error ? err.message : "Signup failed. Please try again."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
