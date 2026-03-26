"use server"

import { sanityClient } from "./client"
import type { Website, Topic, BlogPost } from "@/types"

// ── Websites ──────────────────────────────────────────────────────────────────
export async function createWebsite(data: Omit<Website, "id" | "blogsGenerated" | "avgScore" | "createdAt">) {
  return sanityClient.create({
    _type: "website",
    domain: data.domain,
    niche: data.niche,
    targetAudience: data.targetAudience,
    toneOfVoice: data.toneOfVoice,
    language: data.language,
    status: "active",
    blogsGenerated: 0,
    avgScore: 0,
  })
}

export async function updateWebsite(id: string, data: Partial<Website>) {
  return sanityClient.patch(id).set(data).commit()
}

export async function deleteWebsite(id: string) {
  return sanityClient.delete(id)
}

// ── Topics ────────────────────────────────────────────────────────────────────
export async function createTopic(data: {
  websiteId: string
  clusterId?: string
  title: string
}) {
  return sanityClient.create({
    _type: "topic",
    website: { _type: "reference", _ref: data.websiteId },
    ...(data.clusterId && { cluster: { _type: "reference", _ref: data.clusterId } }),
    title: data.title,
    status: "pending",
    proposedAt: new Date().toISOString(),
  })
}

export async function updateTopicStatus(id: string, status: Topic["status"]) {
  return sanityClient.patch(id).set({
    status,
    ...(status === "approved" && { approvedAt: new Date().toISOString() }),
  }).commit()
}

export async function deleteTopic(id: string) {
  return sanityClient.delete(id)
}

// ── Blog Posts ────────────────────────────────────────────────────────────────
export async function createBlogPost(data: {
  websiteId: string
  topicId: string
  title: string
}) {
  return sanityClient.create({
    _type: "blogPost",
    website: { _type: "reference", _ref: data.websiteId },
    topic: { _type: "reference", _ref: data.topicId },
    title: data.title,
    status: "generating",
    attempts: 0,
    improvementNotes: [],
  })
}

export async function updateBlogPost(id: string, data: Partial<BlogPost>) {
  return sanityClient.patch(id).set(data).commit()
}
