import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { createClient } from "@sanity/client"
import { groq } from "next-sanity"

function getSanityClient() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET ?? "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        loginToken: { label: "Login Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.loginToken) return null

        const email = credentials.email as string
        const loginToken = credentials.loginToken as string

        try {
          const client = getSanityClient()

          // Find OTP record with loginToken for this email
          const tokenRecord = await client.fetch(
            groq`*[_type == "otpToken" && email == $email && defined(loginToken)] | order(_createdAt desc)[0]{
              _id, loginToken, expiresAt
            }`,
            { email }
          )

          if (!tokenRecord) return null

          // Check expiry
          if (new Date(tokenRecord.expiresAt) < new Date()) {
            await client.delete(tokenRecord._id)
            return null
          }

          // Verify loginToken (bcrypt compare)
          const isValid = await bcrypt.compare(loginToken, tokenRecord.loginToken)
          if (!isValid) return null

          // Delete token — single use
          await client.delete(tokenRecord._id)

          // Look up user in Sanity
          const user = await client.fetch(
            groq`*[_type == "user" && email == $email][0]{ _id, email, name }`,
            { email }
          )

          if (user) {
            return { id: user._id, email: user.email, name: user.name }
          }

          // Fall back to demo user (keeps backward compat)
          const demoEmail = process.env.DEMO_EMAIL ?? "demo@seoblog.ai"
          const demoName = process.env.DEMO_NAME ?? "Demo User"
          if (email === demoEmail) {
            return { id: "demo", email: demoEmail, name: demoName }
          }

          return null
        } catch (err) {
          console.error("[auth] authorize error:", err)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
