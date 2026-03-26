import { createClient, type SanityClient } from "@sanity/client"

function getSanityClient(): SanityClient {
  const projectId = process.env.SANITY_PROJECT_ID
  if (!projectId) {
    throw new Error(
      "SANITY_PROJECT_ID is not set. Configure it in .env.local or Settings → Sanity CMS."
    )
  }
  return createClient({
    projectId,
    dataset: process.env.SANITY_DATASET ?? "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })
}

export const sanityClient = new Proxy({} as SanityClient, {
  get(_target, prop: string) {
    const client = getSanityClient()
    return (client as any)[prop]
  },
})
