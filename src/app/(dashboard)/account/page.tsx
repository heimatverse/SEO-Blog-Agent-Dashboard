import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AccountClient } from "./_client"

export default async function AccountPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <AccountClient
      user={{
        name: session.user?.name ?? "User",
        email: session.user?.email ?? "",
      }}
    />
  )
}
