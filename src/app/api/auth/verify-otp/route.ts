import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/sanity/lib/client"
import { groq } from "next-sanity"
import { randomUUID } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 })
    }

    // Find OTP token
    const token = await sanityClient.fetch(
      groq`*[_type == "otpToken" && email == $email] | order(_createdAt desc)[0]{ _id, codeHash, expiresAt }`,
      { email }
    )

    if (!token) {
      return NextResponse.json({ error: "No pending verification. Please request a new code." }, { status: 400 })
    }

    // Check expiry
    if (new Date(token.expiresAt) < new Date()) {
      await sanityClient.delete(token._id)
      return NextResponse.json({ error: "Code expired. Please request a new one." }, { status: 400 })
    }

    // Verify code
    const isValid = await bcrypt.compare(code.trim(), token.codeHash)
    if (!isValid) {
      return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 })
    }

    // Generate a short-lived login token (2 min TTL)
    const loginToken = randomUUID()
    const loginTokenHash = await bcrypt.hash(loginToken, 10)
    const loginExpiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()

    // Update OTP record with login token (mark as verified)
    await sanityClient
      .patch(token._id)
      .set({ loginToken: loginTokenHash, expiresAt: loginExpiresAt })
      .commit()

    // Mark user as verified if signup flow
    const user = await sanityClient.fetch(
      groq`*[_type == "user" && email == $email][0]{ _id, isVerified }`,
      { email }
    )
    if (user && !user.isVerified) {
      await sanityClient.patch(user._id).set({ isVerified: true }).commit()
    }

    return NextResponse.json({ success: true, loginToken })
  } catch (err) {
    console.error("[verify-otp]", err)
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 500 })
  }
}
