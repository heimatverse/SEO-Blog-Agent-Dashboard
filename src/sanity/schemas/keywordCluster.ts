import type { SchemaTypeDefinition } from "sanity"

export const keywordClusterSchema: SchemaTypeDefinition = {
  name: "keywordCluster",
  title: "Keyword Cluster",
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
      name: "primaryKeyword",
      title: "Primary Keyword",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
    {
      name: "supportingKeywords",
      title: "Supporting Keywords",
      type: "array",
      of: [{ type: "string" }],
    },
    {
      name: "searchIntent",
      title: "Search Intent",
      type: "string",
      options: {
        list: ["informational", "navigational", "commercial", "transactional"],
      },
    },
    {
      name: "clusterScore",
      title: "Cluster Score",
      type: "number",
    },
    {
      name: "estimatedVolume",
      title: "Estimated Volume",
      type: "number",
    },
    {
      name: "difficulty",
      title: "Difficulty",
      type: "number",
    },
  ],
}
