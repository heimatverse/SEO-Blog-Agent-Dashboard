import { sanityClient } from "@/sanity/lib/client"
import { websitesQuery } from "@/sanity/lib/queries"
import { WebsitesClient } from "./_client"
import type { Website } from "@/types"

export default async function WebsitesPage() {
  let websites: Website[] = []
  try {
    websites = await sanityClient.fetch<Website[]>(websitesQuery)
  } catch {
    // Sanity not configured yet — show empty state
  }
  return <WebsitesClient initialWebsites={websites} />
}
