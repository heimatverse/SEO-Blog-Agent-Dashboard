import { websiteSchema } from "./website"
import { keywordClusterSchema } from "./keywordCluster"
import { topicSchema } from "./topic"
import { contentBriefSchema } from "./contentBrief"
import { blogPostSchema } from "./blogPost"
import { userSchema } from "./user"
import { otpTokenSchema } from "./otpToken"

export const schemaTypes = [
  websiteSchema,
  keywordClusterSchema,
  topicSchema,
  contentBriefSchema,
  blogPostSchema,
  userSchema,
  otpTokenSchema,
]
