import { NextRequest, NextResponse } from "next/server"
import { callClaudeJSON } from "@/lib/pipeline/anthropic"
import { sanityClient } from "@/sanity/lib/client"

interface FactorScore {
  score: number
  max: number
  issues: string[]
}

interface ScorerResult {
  score_id: string
  blog_id: string
  retry_count: number
  total_score: number
  pass_threshold: number
  passed: boolean
  status: "approved_for_publish" | "retry_needed" | "draft"
  factor_scores: {
    keyword_optimization: FactorScore
    content_structure: FactorScore
    human_ness: FactorScore
    readability: FactorScore
    meta_technical_seo: FactorScore
    structured_data: FactorScore
    internal_linking: FactorScore
    image_optimization: FactorScore
    content_depth: FactorScore
    faq_quality: FactorScore
    freshness: FactorScore
  }
  improvement_notes: string[]
  scored_at: string
}

const SYSTEM_PROMPT = `You are an expert SEO content auditor and quality evaluator.
Your job is to score blog posts across 11 weighted factors and produce actionable improvement notes.

SCORING FACTORS (total = 110 pts):
1. Keyword Optimization (15 pts): H1 has primary keyword (3), first 100 words (3), H2 (2), 3+ supporting keywords (4), density 0.8-1.5% (3)
2. Content Structure (15 pts): 5+ H2 sections (4), H3s under 3+ H2s (3), logical flow intro→body→FAQ→conclusion (4), no heading skips (2), conclusion with CTA (2)
3. Human-ness Score (20 pts): Varied sentence length (4), first/second person (3), no AI clichés (4), rhetorical questions/anecdotes (4), natural transitions (3), varied vocab (2)
4. Readability (10 pts): Grade 7-9 reading level (4), avg paragraph ≤4 sentences (3), no paragraph >150 words (3)
5. Meta & Technical SEO (15 pts): Meta title 50-60 chars with keyword (4), meta description 150-160 chars with CTA (4), canonical URL (3), OG tags (2), Twitter card (2)
6. Structured Data (10 pts): BlogPosting JSON-LD valid (5), FAQPage JSON-LD with 5+ Q&As (5)
7. Internal Linking (5 pts): 3+ internal links (3), keyword-rich anchor text (2)
8. Image Optimization (5 pts): 1+ image per 600 words (2), descriptive alt-text (3)
9. Content Depth & Originality (3 pts): Word count in range (1), no repetition (2)
10. FAQ Quality (2 pts): 5+ FAQ items (1), concise answers 50-100 words (1)
11. Freshness (10 pts): References current year (3), recent stats <2 years (3), no outdated practices (2), Last Updated date (2)

Be strict and objective. Deduct points for any missing elements.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, brief, blog_post_id, retry_count = 0 } = body

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const userPrompt = `Score this blog post:

=== CONTENT BRIEF ===
${JSON.stringify(brief, null, 2)}

=== BLOG POST CONTENT ===
${content.slice(0, 15000)}

Analyze the content against all 11 scoring factors. Be thorough and strict.
For each factor, identify specific issues and award partial credit where appropriate.

Output JSON:
{
  "score_id": "unique string",
  "blog_id": "${blog_post_id || ""}",
  "retry_count": ${retry_count},
  "total_score": number,
  "pass_threshold": 90,
  "passed": boolean,
  "status": "approved_for_publish|retry_needed|draft",
  "factor_scores": {
    "keyword_optimization": { "score": number, "max": 15, "issues": string[] },
    "content_structure": { "score": number, "max": 15, "issues": string[] },
    "human_ness": { "score": number, "max": 20, "issues": string[] },
    "readability": { "score": number, "max": 10, "issues": string[] },
    "meta_technical_seo": { "score": number, "max": 15, "issues": string[] },
    "structured_data": { "score": number, "max": 10, "issues": string[] },
    "internal_linking": { "score": number, "max": 5, "issues": string[] },
    "image_optimization": { "score": number, "max": 5, "issues": string[] },
    "content_depth": { "score": number, "max": 3, "issues": string[] },
    "faq_quality": { "score": number, "max": 2, "issues": string[] },
    "freshness": { "score": number, "max": 10, "issues": string[] }
  },
  "improvement_notes": ["actionable instruction 1", "actionable instruction 2", ...],
  "scored_at": "ISO8601"
}`

    const result = await callClaudeJSON<ScorerResult>(SYSTEM_PROMPT, userPrompt, 8192)

    // Determine final status
    const passed = result.total_score >= 90
    const status = passed
      ? "approved_for_publish"
      : retry_count >= 2
      ? "draft"
      : "retry_needed"

    result.passed = passed
    result.status = status

    // Update Sanity blog post if ID is provided
    if (blog_post_id) {
      const blogStatus = passed ? "completed" : retry_count >= 2 ? "draft" : "scoring"
      await sanityClient.patch(blog_post_id).set({
        score: result.total_score,
        scoreBreakdown: {
          keywordIntegration: result.factor_scores.keyword_optimization.score,
          searchIntentAlignment: result.factor_scores.content_structure.score,
          headingStructure: result.factor_scores.content_structure.score,
          contentDepth: result.factor_scores.content_depth.score,
          readability: result.factor_scores.readability.score,
          uniqueValue: result.factor_scores.content_depth.score,
          eeatSignals: result.factor_scores.human_ness.score,
          internalLinkingOpportunities: result.factor_scores.internal_linking.score,
          callToAction: result.factor_scores.content_structure.score,
          metaOptimization: result.factor_scores.meta_technical_seo.score,
          humanTone: result.factor_scores.human_ness.score,
          total: result.total_score,
        },
        improvementNotes: result.improvement_notes,
        status: blogStatus,
      }).commit()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[content-scorer]", error)
    return NextResponse.json({ error: "Content scoring failed" }, { status: 500 })
  }
}
