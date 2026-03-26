"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Lightbulb, Search, Check, X, Loader2, Plus, Play } from "lucide-react"
import { toast } from "sonner"
import { updateTopicStatus } from "@/sanity/lib/actions"
import type { Topic, Website } from "@/types"

const STATUS_VARIANTS: Record<Topic["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  briefing: "outline",
}

export function TopicsClient({
  initialTopics,
  websites,
}: {
  initialTopics: Topic[]
  websites: Website[]
}) {
  const [topics, setTopics] = useState<Topic[]>(initialTopics)
  const [open, setOpen] = useState(false)
  const [seedKeywords, setSeedKeywords] = useState("")
  const [selectedWebsiteId, setSelectedWebsiteId] = useState(websites[0]?.id ?? "")
  const [generating, setGenerating] = useState(false)
  const [runningTopicId, setRunningTopicId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleGenerate() {
    if (!seedKeywords.trim()) return
    if (!selectedWebsiteId) {
      toast.error("Please select a website first.")
      return
    }
    setGenerating(true)
    try {
      const website = websites.find((w) => w.id === selectedWebsiteId)
      const website_config = website
        ? { niche: website.niche, toneOfVoice: website.toneOfVoice }
        : undefined

      // Step 1: Keyword research
      const kwRes = await fetch("/api/pipeline/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed_keywords: seedKeywords.split(",").map((k) => k.trim()).filter(Boolean),
          industry: website?.niche,
          websiteId: selectedWebsiteId,
          max_clusters: 5,
        }),
      })
      if (!kwRes.ok) throw new Error("Keyword research failed")
      const kwData = await kwRes.json()

      // Step 2: Topic generation
      const topicRes = await fetch("/api/pipeline/topic-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword_clusters: kwData.clusters,
          website_id: selectedWebsiteId,
          max_topics_per_cluster: 2,
          industry: website?.niche,
          niche: website?.niche,
          content_style: website?.toneOfVoice || "professional",
        }),
      })
      if (!topicRes.ok) throw new Error("Topic generation failed")
      const topicData = await topicRes.json()

      const newTopics: Topic[] = (topicData.sanityTopics ?? []).map((t: { _id: string; title: string }) => ({
        id: t._id,
        websiteId: selectedWebsiteId,
        title: t.title,
        status: "pending" as const,
        proposedAt: new Date().toISOString(),
      }))

      setTopics((prev) => [...newTopics, ...prev])
      setSeedKeywords("")
      setOpen(false)
      toast.success(`Generated ${newTopics.length} topic${newTopics.length !== 1 ? "s" : ""}`)
    } catch (err) {
      toast.error("Failed to generate topics. Check your API configuration.")
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  function handleApprove(id: string) {
    startTransition(async () => {
      try {
        await updateTopicStatus(id, "approved")
        setTopics((prev) =>
          prev.map((t) => t.id === id ? { ...t, status: "approved" as const, approvedAt: new Date().toISOString() } : t)
        )
        toast.success("Topic approved")
      } catch {
        toast.error("Failed to approve topic.")
      }
    })
  }

  function handleReject(id: string) {
    startTransition(async () => {
      try {
        await updateTopicStatus(id, "rejected")
        setTopics((prev) =>
          prev.map((t) => t.id === id ? { ...t, status: "rejected" as const } : t)
        )
        toast.success("Topic rejected")
      } catch {
        toast.error("Failed to reject topic.")
      }
    })
  }

  async function handleRunPipeline(topicId: string) {
    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return
    const website = websites.find((w) => w.id === topic.websiteId)
    setRunningTopicId(topicId)
    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: topicId,
          website_id: topic.websiteId,
          website_config: website
            ? { niche: website.niche, toneOfVoice: website.toneOfVoice }
            : undefined,
        }),
      })
      if (!res.ok) throw new Error("Pipeline failed")
      const data = await res.json()
      const result = data.results?.[0]
      if (result?.status === "completed") {
        toast.success(`Blog generated! Score: ${result.score}/110`)
      } else {
        toast.info(`Blog saved as draft (score: ${result?.score ?? "—"}/110)`)
      }
      // Mark topic as briefing
      setTopics((prev) =>
        prev.map((t) => t.id === topicId ? { ...t, status: "briefing" as const } : t)
      )
    } catch (err) {
      toast.error("Pipeline failed. Check your API keys and configuration.")
      console.error(err)
    } finally {
      setRunningTopicId(null)
    }
  }

  const pending = topics.filter((t) => t.status === "pending")
  const approved = topics.filter((t) => t.status === "approved" || t.status === "briefing")
  const rejected = topics.filter((t) => t.status === "rejected")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Topics</h1>
          <p className="text-muted-foreground">
            Generate and manage SEO topic proposals from seed keywords.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Search className="mr-2 h-4 w-4" />
            Research Keywords
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Keyword Research</DialogTitle>
              <DialogDescription>
                Enter seed keywords to generate keyword clusters and topic proposals.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              {websites.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Select
                    value={selectedWebsiteId}
                    onValueChange={(v) => v && setSelectedWebsiteId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a website" />
                    </SelectTrigger>
                    <SelectContent>
                      {websites.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Seed Keywords</Label>
                <Input
                  placeholder="e.g. content marketing, SEO strategy, blog writing"
                  value={seedKeywords}
                  onChange={(e) => setSeedKeywords(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple keywords with commas.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerate} disabled={generating || !seedKeywords.trim()}>
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Topics
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Topics queue */}
      {topics.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <CardTitle className="text-base">No topics yet</CardTitle>
              <CardDescription className="mt-1">
                Run keyword research to generate topic proposals.
              </CardDescription>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Research Keywords
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              {pending.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{pending.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <TopicsTable
              topics={pending}
              onApprove={handleApprove}
              onReject={handleReject}
              onRun={handleRunPipeline}
              runningTopicId={runningTopicId}
              isPending={isPending}
              showActions
            />
          </TabsContent>
          <TabsContent value="approved" className="mt-4">
            <TopicsTable
              topics={approved}
              onRun={handleRunPipeline}
              runningTopicId={runningTopicId}
            />
          </TabsContent>
          <TabsContent value="rejected" className="mt-4">
            <TopicsTable topics={rejected} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

function TopicsTable({
  topics,
  onApprove,
  onReject,
  onRun,
  runningTopicId,
  isPending,
  showActions = false,
}: {
  topics: Topic[]
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onRun?: (id: string) => void
  runningTopicId?: string | null
  isPending?: boolean
  showActions?: boolean
}) {
  if (topics.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No topics in this queue.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Proposed</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topics.map((topic) => (
            <TableRow key={topic.id}>
              <TableCell className="font-medium">{topic.title}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[topic.status]} className="capitalize">
                  {topic.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(topic.proposedAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {showActions && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-xs"
                        onClick={() => onApprove?.(topic.id)}
                        disabled={isPending}
                      >
                        <Check className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                        onClick={() => onReject?.(topic.id)}
                        disabled={isPending}
                      >
                        <X className="h-3 w-3" />
                        Reject
                      </Button>
                    </>
                  )}
                  {onRun && topic.status !== "briefing" && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 gap-1 text-xs"
                      onClick={() => onRun(topic.id)}
                      disabled={runningTopicId === topic.id}
                    >
                      {runningTopicId === topic.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Play className="h-3 w-3" />
                      }
                      {runningTopicId === topic.id ? "Running…" : "Run Pipeline"}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
