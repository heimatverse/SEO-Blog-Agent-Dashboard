import { sanityClient } from "@/sanity/lib/client"
import { topicsQuery, websitesQuery } from "@/sanity/lib/queries"
import { TopicsClient } from "./_client"
import type { Topic, Website } from "@/types"

export default async function TopicsPage() {
  let topics: Topic[] = []
  let websites: Website[] = []
  try {
    ;[topics, websites] = await Promise.all([
      sanityClient.fetch<Topic[]>(topicsQuery),
      sanityClient.fetch<Website[]>(websitesQuery),
    ])
  } catch {
    // Sanity not configured yet — show empty state
  }
  return <TopicsClient initialTopics={topics} websites={websites} />
}
