export interface User {
  id: string
  email: string
  name: string
  isVerified: boolean
  createdAt: string
}

export type WebsiteStatus = "active" | "paused" | "error"
export type TopicStatus = "pending" | "approved" | "rejected" | "briefing"
export type BlogStatus = "generating" | "scoring" | "completed" | "draft" | "failed" | "published"

export interface Website {
  id: string
  domain: string
  niche: string
  targetAudience: string
  toneOfVoice: string
  language: string
  status: WebsiteStatus
  blogsGenerated: number
  avgScore: number
  createdAt: string
}

export interface KeywordCluster {
  id: string
  websiteId: string
  primaryKeyword: string
  supportingKeywords: string[]
  searchIntent: "informational" | "navigational" | "commercial" | "transactional"
  clusterScore: number
  estimatedVolume: number
  difficulty: number
}

export interface Topic {
  id: string
  websiteId: string
  clusterId: string
  title: string
  status: TopicStatus
  proposedAt: string
  approvedAt?: string
}

export interface ContentBrief {
  id: string
  topicId: string
  outline: string[]
  targetWordCount: number
  primaryKeyword: string
  secondaryKeywords: string[]
  createdAt: string
}

export interface BlogPost {
  id: string
  topicId: string
  websiteId: string
  title: string
  content: string
  status: BlogStatus
  score: number | null
  scoreBreakdown: ScoreBreakdown | null
  improvementNotes: string[]
  attempts: number
  createdAt: string
  publishedAt?: string
}

export interface ScoreBreakdown {
  keywordIntegration: number       // /10
  searchIntentAlignment: number    // /10
  headingStructure: number         // /10
  contentDepth: number             // /10
  readability: number              // /10
  uniqueValue: number              // /10
  eeatSignals: number              // /10
  internalLinkingOpportunities: number  // /10
  callToAction: number             // /10
  metaOptimization: number         // /10
  humanTone: number                // /10
  total: number                    // /110
}
