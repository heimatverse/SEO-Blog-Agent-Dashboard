import Anthropic from "@anthropic-ai/sdk"

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const DEFAULT_MODEL = "claude-opus-4-6"

export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 8192
): Promise<string> {
  const stream = anthropic.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  })

  const message = await stream.finalMessage()
  const textBlock = message.content.find((b) => b.type === "text")
  return textBlock && "text" in textBlock ? textBlock.text : ""
}

export async function callClaudeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 8192
): Promise<T> {
  const raw = await callClaude(
    systemPrompt + "\n\nIMPORTANT: Respond with valid JSON only. No markdown, no code blocks, just raw JSON.",
    userPrompt,
    maxTokens
  )

  // Strip any accidental markdown code blocks
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
  return JSON.parse(cleaned) as T
}
