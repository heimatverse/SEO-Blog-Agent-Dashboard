import { NextRequest, NextResponse } from "next/server"
import { sanityClient } from "@/sanity/lib/client"

const BASE = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const MAX_RETRIES = 3
const PASS_THRESHOLD = 90

async function post(path: string, body: object) {
  const res = await fetch(`${BASE}/api/pipeline/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
  return res.json()
}

/**
 * Full pipeline runner:
 * seed_keywords → keyword research → topic generation →
 * (for each approved topic) → content brief → blog writer → humanizer → scorer
 * (retry up to 3x if score < 90)
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    seed_keywords,
    website_id,
    website_config,
    max_clusters = 5,
    max_topics_per_cluster = 2,
    topic_id, // If provided, skip keyword research and run from this topic directly
  } = body

  const results: { topicId: string; blogId: string; score: number; status: string }[] = []

  try {
    let topicIds: string[] = []

    if (topic_id) {
      // Run pipeline for a single pre-approved topic
      topicIds = [topic_id]
    } else {
      // Step 1: Keyword Research
      const kwResult = await post("keyword-research", {
        seed_keywords,
        industry: website_config?.niche,
        websiteId: website_id,
        max_clusters,
      })

      // Step 2: Topic Generation
      const topicResult = await post("topic-generation", {
        keyword_clusters: kwResult.clusters,
        website_id,
        max_topics_per_cluster,
        industry: website_config?.niche,
        niche: website_config?.niche,
        content_style: website_config?.toneOfVoice || "professional",
      })

      topicIds = topicResult.sanityTopics?.map((t: { _id: string }) => t._id) ?? []
    }

    // Step 3-6: For each topic, run the writing pipeline
    for (const tId of topicIds) {
      // Get topic from Sanity
      const topic = await sanityClient.fetch(
        `*[_type == "topic" && _id == $id][0]{ _id, title, status }`,
        { id: tId }
      )

      if (!topic) continue

      // Create blog post document
      const blogDoc = await sanityClient.create({
        _type: "blogPost",
        website: { _type: "reference", _ref: website_id },
        topic: { _type: "reference", _ref: tId },
        title: topic.title,
        status: "generating",
        attempts: 0,
        improvementNotes: [],
      })

      const blogId = blogDoc._id

      // Step 3: Content Brief
      const brief = await post("content-brief", {
        topic_id: tId,
        title: topic.title,
        primary_keyword: topic.title,
        website_config,
        target_word_count: 2000,
      })

      let currentContent: string | null = null
      let currentScore: any = null
      let attempt = 0

      // Steps 4-6: Write → Humanize → Score (with retry loop)
      while (attempt < MAX_RETRIES) {
        // Update attempt count in Sanity
        await sanityClient.patch(blogId).set({ attempts: attempt + 1, status: "generating" }).commit()

        // Step 4: Blog Writer
        const writerResult = await post("blog-writer", {
          brief,
          blog_post_id: blogId,
          retry_count: attempt,
          previous_score: currentScore,
        })

        // Step 5: Humanizer
        const humanizedResult = await post("humanizer", {
          content: writerResult.content,
          tone: website_config?.toneOfVoice || "professional",
          blog_post_id: blogId,
        })

        currentContent = humanizedResult.content

        // Save content to Sanity
        await sanityClient.patch(blogId).set({ content: currentContent, status: "scoring" }).commit()

        // Step 6: Content Scorer
        const scoreResult = await post("content-scorer", {
          content: currentContent,
          brief,
          blog_post_id: blogId,
          retry_count: attempt,
        })

        currentScore = scoreResult

        if (scoreResult.passed) {
          results.push({ topicId: tId, blogId, score: scoreResult.total_score, status: "completed" })
          break
        }

        attempt++

        if (attempt >= MAX_RETRIES) {
          // Move to draft after max retries
          await sanityClient.patch(blogId).set({ status: "draft" }).commit()
          results.push({ topicId: tId, blogId, score: scoreResult.total_score, status: "draft" })
        }
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[pipeline/run]", error)
    return NextResponse.json({
      error: "Pipeline failed",
      details: error instanceof Error ? error.message : String(error),
      partialResults: results,
    }, { status: 500 })
  }
}
