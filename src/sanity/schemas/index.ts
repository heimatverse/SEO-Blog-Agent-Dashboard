import { websiteSchema } from "./website"
import { keywordClusterSchema } from "./keywordCluster"
import { topicSchema } from "./topic"
import { contentBriefSchema } from "./contentBrief"
import { blogPostSchema } from "./blogPost"

export const schemaTypes = [
  websiteSchema,
  keywordClusterSchema,
  topicSchema,
  contentBriefSchema,
  blogPostSchema,
]
