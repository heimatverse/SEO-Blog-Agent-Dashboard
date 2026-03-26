import { NextRequest, NextResponse } from "next/server"
import { callClaudeJSON } from "@/lib/pipeline/anthropic"
import { sanityClient } from "@/sanity/lib/client"

interface KeywordCluster {
  cluster_id: string
  primary_keyword: string
  supporting_keywords: string[]
  search_intent: "informational" | "navigational" | "commercial" | "transactional"
  estimated_monthly_volume: number
  keyword_difficulty: number
  cluster_score: number
  recommended_content_type: "how-to" | "listicle" | "comparison" | "pillar" | "guide" | "review"
}

interface KeywordResearchResult {
  seed_keywords: string[]
  clusters: KeywordCluster[]
  generated_at: string
}

const SYSTEM_PROMPT = `You are an expert SEO strategist with 10+ years of experience in keyword research.
Your job is to expand the given seed keywords into actionable keyword clusters optimized for organic search traffic.
Think like a human SEO consultant, not a robot.
Focus on realistic, high-opportunity keywords that a content team can act on.

Scoring factors (weight):
- Estimated Search Volume: 30%
- Keyword Difficulty (inversed): 25%
- Commercial Intent Strength: 20%
- Trending Relevance: 15%
- Content Uniqueness Opportunity: 10%

Only include clusters with score >= 50. Sort by score descending.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      seed_keywords,
      industry,
      target_country = "US",
      language = "en",
      max_clusters = 10,
      websiteId,
    } = body

    if (!seed_keywords?.length) {
      return NextResponse.json({ error: "seed_keywords is required" }, { status: 400 })
    }

    const userPrompt = `Perform keyword research for the following:

Seed Keywords: ${seed_keywords.join(", ")}
Industry: ${industry || "General"}
Target Country: ${target_country}
Language: ${language}
Max Clusters: ${max_clusters}

For each seed keyword:
1. Generate 10-15 long-tail variations, LSI terms, question-based, and buyer-intent variations
2. Group into thematic clusters, each with a primary keyword + 4-8 supporting keywords
3. Score each cluster on the factors provided (total 0-100)
4. Filter out clusters with score < 50
5. Return top ${max_clusters} clusters sorted by score

Output JSON matching this schema exactly:
{
  "seed_keywords": string[],
  "clusters": [
    {
      "cluster_id": "string (unique)",
      "primary_keyword": "string",
      "supporting_keywords": string[],
      "search_intent": "informational|navigational|commercial|transactional",
      "estimated_monthly_volume": number,
      "keyword_difficulty": number (0-100),
      "cluster_score": number (0-100),
      "recommended_content_type": "how-to|listicle|comparison|pillar|guide|review"
    }
  ],
  "generated_at": "ISO8601 string"
}`

    const result = await callClaudeJSON<KeywordResearchResult>(SYSTEM_PROMPT, userPrompt, 8192)

    // Optionally persist clusters to Sanity
    if (websiteId && result.clusters?.length) {
      await Promise.all(
        result.clusters.map((cluster) =>
          sanityClient.create({
            _type: "keywordCluster",
            website: { _type: "reference", _ref: websiteId },
            primaryKeyword: cluster.primary_keyword,
            supportingKeywords: cluster.supporting_keywords,
            searchIntent: cluster.search_intent,
            clusterScore: cluster.cluster_score,
            estimatedVolume: cluster.estimated_monthly_volume,
            difficulty: cluster.keyword_difficulty,
          })
        )
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[keyword-research]", error)
    return NextResponse.json({ error: "Keyword research failed" }, { status: 500 })
  }
}
