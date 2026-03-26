import { groq } from "next-sanity"

// ── Websites ──────────────────────────────────────────────────────────────────
export const websitesQuery = groq`
  *[_type == "website"] | order(_createdAt desc) {
    "id": _id,
    domain,
    niche,
    targetAudience,
    toneOfVoice,
    language,
    status,
    blogsGenerated,
    avgScore,
    "createdAt": _createdAt
  }
`

export const websiteByIdQuery = groq`
  *[_type == "website" && _id == $id][0] {
    "id": _id,
    domain,
    niche,
    targetAudience,
    toneOfVoice,
    language,
    status,
    blogsGenerated,
    avgScore,
    "createdAt": _createdAt
  }
`

// ── Topics ────────────────────────────────────────────────────────────────────
export const topicsQuery = groq`
  *[_type == "topic"] | order(proposedAt desc) {
    "id": _id,
    title,
    status,
    proposedAt,
    approvedAt,
    "websiteId": website->_id,
    "clusterId": cluster->_id
  }
`

export const topicsByWebsiteQuery = groq`
  *[_type == "topic" && website._ref == $websiteId] | order(proposedAt desc) {
    "id": _id,
    title,
    status,
    proposedAt,
    approvedAt
  }
`

export const topicsByStatusQuery = groq`
  *[_type == "topic" && status == $status] | order(proposedAt desc) {
    "id": _id,
    title,
    status,
    proposedAt,
    approvedAt,
    "websiteId": website->_id
  }
`

// ── Blog Posts ────────────────────────────────────────────────────────────────
export const blogPostsQuery = groq`
  *[_type == "blogPost"] | order(_createdAt desc) {
    "id": _id,
    title,
    status,
    score,
    scoreBreakdown,
    improvementNotes,
    attempts,
    publishedAt,
    "createdAt": _createdAt,
    "websiteId": website->_id,
    "topicId": topic->_id
  }
`

export const blogsByStatusQuery = groq`
  *[_type == "blogPost" && status == $status] | order(_createdAt desc) {
    "id": _id,
    title,
    status,
    score,
    scoreBreakdown,
    improvementNotes,
    attempts,
    "createdAt": _createdAt
  }
`

export const blogByIdQuery = groq`
  *[_type == "blogPost" && _id == $id][0] {
    "id": _id,
    title,
    content,
    status,
    score,
    scoreBreakdown,
    improvementNotes,
    attempts,
    publishedAt,
    "createdAt": _createdAt
  }
`

// ── Dashboard stats ───────────────────────────────────────────────────────────
export const dashboardStatsQuery = groq`{
  "websiteCount": count(*[_type == "website" && status == "active"]),
  "blogCount": count(*[_type == "blogPost"]),
  "avgScore": math::avg(*[_type == "blogPost" && defined(score)].score),
  "pendingTopics": count(*[_type == "topic" && status == "pending"]),
  "activeJobs": count(*[_type == "blogPost" && status in ["generating", "scoring"]])
}`
