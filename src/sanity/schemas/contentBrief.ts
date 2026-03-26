import type { SchemaTypeDefinition } from "sanity"

export const contentBriefSchema: SchemaTypeDefinition = {
  name: "contentBrief",
  title: "Content Brief",
  type: "document",
  fields: [
    {
      name: "topic",
      title: "Topic",
      type: "reference",
      to: [{ type: "topic" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "primaryKeyword",
      title: "Primary Keyword",
      type: "string",
    },
    {
      name: "secondaryKeywords",
      title: "Secondary Keywords",
      type: "array",
      of: [{ type: "string" }],
    },
    {
      name: "targetWordCount",
      title: "Target Word Count",
      type: "number",
      initialValue: 1500,
    },
    {
      name: "outline",
      title: "Outline",
      type: "array",
      of: [{ type: "string" }],
    },
    {
      name: "searchIntent",
      title: "Search Intent",
      type: "string",
    },
    {
      name: "competitorInsights",
      title: "Competitor Insights",
      type: "text",
    },
  ],
}
