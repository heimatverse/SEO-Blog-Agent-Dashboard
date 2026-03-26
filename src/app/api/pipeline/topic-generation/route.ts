import { NextRequest, NextResponse } from "next/server"
import { callClaudeJSON } from "@/lib/pipeline/anthropic"
import { sanityClient } from "@/sanity/lib/client"

interface GeneratedTopic {
  title: string
  primary_keyword: string
  content_angle: string
  target_format: string
  seo_potential_score: number
  unique_angle: string
}

interface TopicGenerationResult {
  website_id: string
  topics: GeneratedTopic[]
  generated_at: string
}

const SYSTEM_PROMPT = `You are an expert SEO content strategist who specializes in creating data-driven, audience-focused content plans.
Your job is to take keyword clusters and generate high-performing blog topic ideas.

Topic scoring criteria (0-100):
- SEO Opportunity (search volume vs difficulty balance): 30%
- Uniqueness & Content Gap: 25%
- Business/Conversion Relevance: 25%
- Reader Engagement Potential: 20%

Topic formats to use:
- How-to / Tutorial: "How to [Do X] in [Year]"
- Listicle: "X Best/Top [Things] for [Audience]"
- Comparison/Vs: "[Option A] vs [Option B]: Which Is Better?"
- Ultimate Guide: "The Complete Guide to [Topic]"
- Problem/Solution: "Why [Problem] Happens and How to Fix It"
- Data/Stats Roundup: "[N] [Topic] Statistics You Need to Know in [Year]"

Avoid duplicate title structures within the same batch. Prioritize different formats for variety.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      keyword_clusters,
      website_id,
      existing_topics = [],
      max_topics_per_cluster = 3,
      content_style = "authoritative",
      industry,
      niche,
    } = body

    if (!keyword_clusters?.length) {
      return NextResponse.json({ error: "keyword_clusters is required" }, { status: 400 })
    }

    const userPrompt = `Generate SEO blog topics from these keyword clusters:

Website Industry/Niche: ${industry || niche || "General"}
Content Style: ${content_style}
Max topics per cluster: ${max_topics_per_cluster}

Existing topics to avoid duplicating:
${existing_topics.length ? existing_topics.map((t: string) => `- ${t}`).join("\n") : "None"}

Keyword Clusters:
${JSON.stringify(keyword_clusters, null, 2)}

For each cluster, generate ${max_topics_per_cluster} topic ideas. Include a mix of formats.
Score each topic on seo_potential_score (0-100).
Only keep topics with score >= 60.

Output JSON:
{
  "website_id": "${website_id || ""}",
  "topics": [
    {
      "title": "Full article title",
      "primary_keyword": "from the cluster",
      "content_angle": "brief explanation of the angle",
      "target_format": "how-to|listicle|comparison|guide|problem-solution|stats",
      "seo_potential_score": number,
      "unique_angle": "what makes this unique vs typical content"
    }
  ],
  "generated_at": "ISO8601 string"
}`

    const result = await callClaudeJSON<TopicGenerationResult>(SYSTEM_PROMPT, userPrompt, 8192)

    // Persist topics to Sanity if websiteId is provided
    if (website_id && result.topics?.length) {
      const created = await Promise.all(
        result.topics.map((topic) =>
          sanityClient.create({
            _type: "topic",
            website: { _type: "reference", _ref: website_id },
            title: topic.title,
            status: "pending",
            proposedAt: new Date().toISOString(),
          })
        )
      )

      // Return with Sanity IDs
      return NextResponse.json({
        ...result,
        sanityTopics: created.map((doc) => ({ _id: doc._id, title: doc.title })),
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[topic-generation]", error)
    return NextResponse.json({ error: "Topic generation failed" }, { status: 500 })
  }
}
