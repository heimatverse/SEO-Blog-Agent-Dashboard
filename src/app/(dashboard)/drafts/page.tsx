import { sanityClient } from "@/sanity/lib/client"
import { draftsQuery } from "@/sanity/lib/queries"
import { DraftsClient } from "./_client"
import type { BlogPost } from "@/types"

export default async function DraftsPage() {
  let drafts: BlogPost[] = []
  try {
    drafts = await sanityClient.fetch<BlogPost[]>(draftsQuery)
  } catch {
    // Sanity not configured yet — show empty state
  }
  return <DraftsClient initialDrafts={drafts} />
}
