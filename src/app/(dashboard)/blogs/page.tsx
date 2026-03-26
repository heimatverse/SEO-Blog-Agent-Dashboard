import { sanityClient } from "@/sanity/lib/client"
import { blogPostsQuery } from "@/sanity/lib/queries"
import { BlogsClient } from "./_client"
import type { BlogPost } from "@/types"

export default async function BlogsPage() {
  let blogs: BlogPost[] = []
  try {
    blogs = await sanityClient.fetch<BlogPost[]>(blogPostsQuery)
  } catch {
    // Sanity not configured yet — show empty state
  }
  return <BlogsClient initialBlogs={blogs} />
}
