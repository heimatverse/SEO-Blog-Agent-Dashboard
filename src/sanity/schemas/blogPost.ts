import type { SchemaTypeDefinition } from "sanity"

export const blogPostSchema: SchemaTypeDefinition = {
  name: "blogPost",
  title: "Blog Post",
  type: "document",
  fields: [
    {
      name: "website",
      title: "Website",
      type: "reference",
      to: [{ type: "website" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "topic",
      title: "Topic",
      type: "reference",
      to: [{ type: "topic" }],
    },
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "content",
      title: "Content (Markdown)",
      type: "text",
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["generating", "scoring", "completed", "draft", "failed", "published"],
      },
      initialValue: "generating",
    },
    {
      name: "score",
      title: "Score",
      type: "number",
    },
    {
      name: "scoreBreakdown",
      title: "Score Breakdown",
      type: "object",
      fields: [
        { name: "keywordIntegration", title: "Keyword Integration", type: "number" },
        { name: "searchIntentAlignment", title: "Search Intent Alignment", type: "number" },
        { name: "headingStructure", title: "Heading Structure", type: "number" },
        { name: "contentDepth", title: "Content Depth", type: "number" },
        { name: "readability", title: "Readability", type: "number" },
        { name: "uniqueValue", title: "Unique Value", type: "number" },
        { name: "eeatSignals", title: "E-E-A-T Signals", type: "number" },
        { name: "internalLinkingOpportunities", title: "Internal Linking", type: "number" },
        { name: "callToAction", title: "Call to Action", type: "number" },
        { name: "metaOptimization", title: "Meta Optimization", type: "number" },
        { name: "humanTone", title: "Human Tone", type: "number" },
        { name: "total", title: "Total Score", type: "number" },
      ],
    },
    {
      name: "improvementNotes",
      title: "Improvement Notes",
      type: "array",
      of: [{ type: "string" }],
    },
    {
      name: "attempts",
      title: "Generation Attempts",
      type: "number",
      initialValue: 0,
    },
    {
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    },
  ],
}
