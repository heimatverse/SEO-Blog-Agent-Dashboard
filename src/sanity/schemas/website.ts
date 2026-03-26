import type { SchemaTypeDefinition } from "sanity"

export const websiteSchema: SchemaTypeDefinition = {
  name: "website",
  title: "Website",
  type: "document",
  fields: [
    {
      name: "domain",
      title: "Domain",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "niche",
      title: "Niche / Industry",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "targetAudience",
      title: "Target Audience",
      type: "string",
    },
    {
      name: "toneOfVoice",
      title: "Tone of Voice",
      type: "string",
      options: {
        list: ["professional", "conversational", "authoritative", "friendly"],
      },
      initialValue: "professional",
    },
    {
      name: "language",
      title: "Language",
      type: "string",
      initialValue: "en",
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["active", "paused", "error"],
      },
      initialValue: "active",
    },
    {
      name: "blogsGenerated",
      title: "Blogs Generated",
      type: "number",
      initialValue: 0,
    },
    {
      name: "avgScore",
      title: "Average Score",
      type: "number",
      initialValue: 0,
    },
  ],
}
