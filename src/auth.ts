import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@seoblog.ai" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const demoEmail = process.env.DEMO_EMAIL ?? "demo@seoblog.ai"
        const demoHash = process.env.DEMO_PASSWORD_HASH ?? "$2b$10$cpnKFcQ4nK8VzA42rYHm/uU7/cNTPdC73XMi.TMZsdno2jW1y0LSC"
        const demoName = process.env.DEMO_NAME ?? "Demo User"

        if (credentials.email !== demoEmail) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          demoHash
        )
        if (!isValid) return null

        return { id: "1", email: demoEmail, name: demoName }
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
