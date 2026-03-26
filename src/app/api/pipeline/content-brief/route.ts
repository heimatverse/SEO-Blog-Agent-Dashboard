import { NextRequest, NextResponse } from "next/server"
import { callClaudeJSON } from "@/lib/pipeline/anthropic"
import { sanityClient } from "@/sanity/lib/client"

interface ContentBriefResult {
  topic_id: string
  title: string
  primary_keyword: string
  secondary_keywords: string[]
  search_intent: string
  target_word_count: number
  outline: {
    h1: string
    introduction_goals: string[]
    sections: {
      h2: string
      h3s: string[]
      key_points: string[]
    }[]
    faq_questions: string[]
    conclusion_cta: string
  }
  meta_guidelines: {
    title_template: string
    description_template: string
    focus_keyword: string
  }
  tone_guidelines: string
  internal_link_slots: number
  image_count_target: number
  generated_at: string
}

const SYSTEM_PROMPT = `You are a senior SEO content strategist and editorial director.
Your job is to create comprehensive content briefs that serve as exact blueprints for blog writers.

A content brief must be so detailed that any skilled writer can produce a top-ranking article from it alone.

Requirements for every brief:
- H1 must naturally include the primary keyword
- Introduction must have a hook, acknowledge the pain point, and make a clear promise
- Minimum 5 H2 sections (comprehensive topic coverage)
- Each H2 should have 2-4 H3 sub-sections where appropriate
- 5-8 FAQ questions derived from "people also ask" queries
- Clear conclusion with a CTA aligned to the website's business goals
- Meta title: 50-60 chars, includes primary keyword
- Meta description: 150-160 chars, includes a CTA`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      topic_id,
      title,
      primary_keyword,
      keyword_cluster,
      website_config,
      target_word_count = 2000,
      published_posts = [],
    } = body

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const userPrompt = `Create a detailed content brief for this article:

Title: ${title}
Primary Keyword: ${primary_keyword || title}
Website Industry: ${website_config?.niche || "General"}
Target Audience: ${website_config?.targetAudience || "General audience"}
Tone of Voice: ${website_config?.toneOfVoice || "professional"}
Target Word Count: ${target_word_count}

Keyword Cluster Context:
${keyword_cluster ? JSON.stringify(keyword_cluster, null, 2) : "Use the title keywords"}

Existing posts for internal linking opportunities:
${published_posts.length ? published_posts.map((p: string) => `- ${p}`).join("\n") : "None yet"}

Generate a complete content brief as JSON:
{
  "topic_id": "${topic_id || ""}",
  "title": "final recommended title",
  "primary_keyword": "exact primary keyword",
  "secondary_keywords": string[],
  "search_intent": "informational|commercial|transactional",
  "target_word_count": number,
  "outline": {
    "h1": "exact H1 text",
    "introduction_goals": ["hook approach", "pain point to address", "promise to make"],
    "sections": [
      {
        "h2": "Section heading",
        "h3s": ["sub-section 1", "sub-section 2"],
        "key_points": ["main point to cover", "stat/example to include"]
      }
    ],
    "faq_questions": ["question 1", "question 2", ...],
    "conclusion_cta": "CTA guidance"
  },
  "meta_guidelines": {
    "title_template": "50-60 char SEO title",
    "description_template": "150-160 char meta description",
    "focus_keyword": "exact focus keyword"
  },
  "tone_guidelines": "specific tone instructions",
  "internal_link_slots": number,
  "image_count_target": number,
  "generated_at": "ISO8601"
}`

    const result = await callClaudeJSON<ContentBriefResult>(SYSTEM_PROMPT, userPrompt, 8192)

    // Save brief to Sanity if topic_id is provided
    if (topic_id) {
      await sanityClient.create({
        _type: "contentBrief",
        topic: { _type: "reference", _ref: topic_id },
        primaryKeyword: result.primary_keyword,
        secondaryKeywords: result.secondary_keywords,
        targetWordCount: result.target_word_count,
        outline: [
          `H1: ${result.outline.h1}`,
          ...result.outline.sections.map((s) => `H2: ${s.h2}`),
        ],
        searchIntent: result.search_intent,
      })

      // Update topic status to "briefing"
      await sanityClient.patch(topic_id).set({ status: "briefing" }).commit()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[content-brief]", error)
    return NextResponse.json({ error: "Content brief generation failed" }, { status: 500 })
  }
}
