import { NextRequest, NextResponse } from "next/server"
import { callClaude } from "@/lib/pipeline/anthropic"

const SYSTEM_PROMPT = `You are an expert SEO content writer with a natural, engaging voice.
Your writing is indistinguishable from a skilled human writer — you never sound like an AI.

Writing rules:
- Use varied sentence lengths: mix short punchy sentences with longer explanatory ones
- Write in second person (you/your) to engage readers directly
- Include occasional first person ("I've found...", "In my experience...")
- Use rhetorical questions to engage readers
- Never use AI clichés: "In conclusion", "Furthermore", "Moreover", "It is worth noting", "Delve into", "It's important to", "As an AI", "Certainly"
- Use natural transitions: "That said,", "Here's the thing:", "The good news?", "But wait —"
- Add conversational asides in parentheses occasionally
- Include specific numbers, examples, and data
- Vary paragraph lengths (1-4 sentences)
- Every H2 section must be substantive (300-500 words minimum)

Structural requirements:
- Include full meta tags block at the top
- JSON-LD BlogPosting and FAQPage schemas
- Minimum 3 internal link placeholders [INTERNAL_LINK: anchor text]
- Image placeholder after every 600 words: [IMAGE: descriptive alt text]
- Complete FAQ section with 5-8 questions
- Strong conclusion with CTA`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      brief,
      blog_post_id,
      retry_count = 0,
      previous_score = null,
      model,
    } = body

    if (!brief) {
      return NextResponse.json({ error: "brief is required" }, { status: 400 })
    }

    let retryInstructions = ""
    if (retry_count > 0 && previous_score) {
      retryInstructions = `
\n\n=== RETRY INSTRUCTIONS (Attempt ${retry_count + 1}) ===
Previous score: ${previous_score.total_score}/110. Improvement notes from the scorer:
${previous_score.improvement_notes?.map((n: string) => `- ${n}`).join("\n") || "No notes"}

You MUST address ALL of the above issues in this retry. Focus especially on:
${previous_score.factor_scores
  ? Object.entries(previous_score.factor_scores)
    .filter(([, v]: [string, any]) => v.score < v.max * 0.7)
    .map(([k, v]: [string, any]) => `- ${k}: ${v.issues?.join("; ")}`)
    .join("\n")
  : "Low-scoring factors from above"}`
    }

    const userPrompt = `Write a complete, publication-ready blog post based on this content brief:

${JSON.stringify(brief, null, 2)}
${retryInstructions}

Write the COMPLETE article now. Start with the meta block, then the full article content.
Format:
---META---
[meta title, meta description, canonical URL, OG tags, Twitter card, JSON-LD schemas]
---CONTENT---
[Full article in Markdown, starting with H1]
---END---`

    const content = await callClaude(SYSTEM_PROMPT, userPrompt, 16000)

    return NextResponse.json({
      blog_post_id,
      content,
      retry_count,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[blog-writer]", error)
    return NextResponse.json({ error: "Blog writing failed" }, { status: 500 })
  }
}
