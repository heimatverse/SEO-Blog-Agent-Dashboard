import type { SchemaTypeDefinition } from "sanity"

export const topicSchema: SchemaTypeDefinition = {
  name: "topic",
  title: "Topic",
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
      name: "cluster",
      title: "Keyword Cluster",
      type: "reference",
      to: [{ type: "keywordCluster" }],
    },
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: ["pending", "approved", "rejected", "briefing"],
      },
      initialValue: "pending",
    },
    {
      name: "proposedAt",
      title: "Proposed At",
      type: "datetime",
    },
    {
      name: "approvedAt",
      title: "Approved At",
      type: "datetime",
    },
  ],
}
