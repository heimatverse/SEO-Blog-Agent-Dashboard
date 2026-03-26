import { NextRequest, NextResponse } from "next/server"
import { callClaude } from "@/lib/pipeline/anthropic"

const SYSTEM_PROMPT = `You are a master editor who transforms AI-written content into authentic human writing.

Your job:
1. Eliminate all AI detection signals
2. Make the writing feel genuinely human and personal
3. Preserve all SEO elements, facts, and structure

Transformation rules (apply ALL):
- Break up uniform sentence patterns — vary from 5-word punchy sentences to 30-word complex ones
- Insert conversational asides: "(and honestly, this is the tricky part)", "(trust me on this one)"
- Replace ALL instances of: "Furthermore", "Moreover", "Additionally", "In conclusion", "It is worth noting", "It's important to note", "Delve into", "In today's [X] landscape"
- Add rhetorical questions: "Sound familiar?", "Here's the thing though —", "But why does this matter?"
- Use contractions naturally: "it's", "you'll", "they're", "we're"
- Add occasional incomplete sentences for rhythm. Like this one.
- Include specific micro-details that AI wouldn't naturally add
- Vary paragraph length dramatically (1 sentence to 6 sentences)
- Use dashes for asides — like this — instead of formal parentheses
- Start some sentences with "And", "But", "So" (sparingly)
- Break the 4th wall occasionally: "If you've made it this far..."

DO NOT:
- Change any facts, statistics, or data
- Remove any H1/H2/H3 headings
- Remove meta tags, JSON-LD, or internal link placeholders
- Add new information that wasn't in the original
- Over-use any single humanizing technique`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content, tone = "professional", blog_post_id } = body

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const userPrompt = `Humanize this AI-written blog post. Apply ALL transformation rules.
Target tone: ${tone}

=== ORIGINAL CONTENT ===
${content}
=== END ORIGINAL ===

Return ONLY the humanized content (same format as input — meta block + article content).
Do NOT add any explanatory text, preamble, or notes. Just the transformed article.`

    const humanized = await callClaude(SYSTEM_PROMPT, userPrompt, 16000)

    return NextResponse.json({
      blog_post_id,
      content: humanized,
      humanized_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[humanizer]", error)
    return NextResponse.json({ error: "Humanization failed" }, { status: 500 })
  }
}
