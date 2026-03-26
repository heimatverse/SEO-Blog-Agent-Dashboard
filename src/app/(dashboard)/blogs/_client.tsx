"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { FileText, Eye, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { BlogPost } from "@/types"

const STATUS_VARIANTS: Record<BlogPost["status"], "default" | "secondary" | "destructive" | "outline"> = {
  generating: "outline",
  scoring: "outline",
  completed: "secondary",
  draft: "secondary",
  failed: "destructive",
  published: "default",
}

export function BlogsClient({ initialBlogs }: { initialBlogs: BlogPost[] }) {
  const [blogs, setBlogs] = useState<BlogPost[]>(initialBlogs)
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  async function handleRetry(blog: BlogPost) {
    if (!blog.topicId) {
      toast.error("Cannot retry: topic reference is missing.")
      return
    }
    setRetryingId(blog.id)
    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: blog.topicId,
          website_id: blog.websiteId,
        }),
      })
      if (!res.ok) throw new Error("Retry failed")
      const data = await res.json()
      const result = data.results?.[0]
      if (result) {
        setBlogs((prev) =>
          prev.map((b) =>
            b.id === blog.id
              ? { ...b, status: result.status as BlogPost["status"], score: result.score }
              : b
          )
        )
        toast.success(`Retry complete — score: ${result.score}/110`)
      }
    } catch (err) {
      toast.error("Retry failed.")
      console.error(err)
    } finally {
      setRetryingId(null)
    }
  }

  const active = blogs.filter((b) => b.status === "generating" || b.status === "scoring")
  const completed = blogs.filter((b) => b.status === "completed" || b.status === "published")
  const drafts = blogs.filter((b) => b.status === "draft" || b.status === "failed")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Blogs</h1>
        <p className="text-muted-foreground">
          Track all generated articles, scores, and publishing status.
        </p>
      </div>

      {/* Empty state */}
      {blogs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <CardTitle className="text-base">No blogs yet</CardTitle>
              <CardDescription className="mt-1">
                Approve topics and run the pipeline to generate content.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Active
              {active.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">{active.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts / Failed
              {drafts.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">{drafts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <BlogTable blogs={active} onView={setSelectedBlog} retryingId={retryingId} />
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            <BlogTable blogs={completed} onView={setSelectedBlog} retryingId={retryingId} />
          </TabsContent>
          <TabsContent value="drafts" className="mt-4">
            <BlogTable blogs={drafts} onView={setSelectedBlog} onRetry={handleRetry} retryingId={retryingId} showRetry />
          </TabsContent>
        </Tabs>
      )}

      {/* Blog detail modal */}
      <BlogDetailModal blog={selectedBlog} onClose={() => setSelectedBlog(null)} />
    </div>
  )
}

function BlogTable({
  blogs,
  onView,
  onRetry,
  retryingId,
  showRetry = false,
}: {
  blogs: BlogPost[]
  onView: (blog: BlogPost) => void
  onRetry?: (blog: BlogPost) => void
  retryingId?: string | null
  showRetry?: boolean
}) {
  if (blogs.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead className="text-right">Attempts</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {blogs.map((blog) => (
            <TableRow key={blog.id}>
              <TableCell className="font-medium max-w-xs truncate">{blog.title}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[blog.status]} className="capitalize">
                  {blog.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {blog.score !== null ? (
                  <span className={blog.score >= 90 ? "text-green-600 font-medium" : "text-destructive font-medium"}>
                    {blog.score}/110
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">{blog.attempts}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {new Date(blog.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onView(blog)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  {showRetry && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onRetry?.(blog)}
                      disabled={retryingId === blog.id}
                    >
                      {retryingId === blog.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <RefreshCw className="h-3.5 w-3.5" />
                      }
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

function BlogDetailModal({
  blog,
  onClose,
}: {
  blog: BlogPost | null
  onClose: () => void
}) {
  if (!blog) return null

  const SCORE_LABELS = [
    { key: "keywordIntegration", label: "Keyword Integration" },
    { key: "searchIntentAlignment", label: "Search Intent Alignment" },
    { key: "headingStructure", label: "Heading Structure" },
    { key: "contentDepth", label: "Content Depth" },
    { key: "readability", label: "Readability" },
    { key: "uniqueValue", label: "Unique Value" },
    { key: "eeatSignals", label: "E-E-A-T Signals" },
    { key: "internalLinkingOpportunities", label: "Internal Linking" },
    { key: "callToAction", label: "Call to Action" },
    { key: "metaOptimization", label: "Meta Optimization" },
    { key: "humanTone", label: "Human Tone" },
  ] as const

  return (
    <Dialog open={!!blog} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-4">{blog.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Overall score */}
          {blog.score !== null && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Overall Score</CardTitle>
                  <span className={`text-xl font-bold ${blog.score >= 90 ? "text-green-600" : "text-destructive"}`}>
                    {blog.score}/110
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={(blog.score / 110) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {blog.score >= 90 ? "Passes quality threshold" : "Below minimum threshold (90)"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Score breakdown */}
          {blog.scoreBreakdown && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SCORE_LABELS.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-44 shrink-0">{label}</span>
                    <Progress
                      value={(blog.scoreBreakdown![key] / 10) * 100}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-xs font-medium w-8 text-right">
                      {blog.scoreBreakdown![key]}/10
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Improvement notes */}
          {blog.improvementNotes.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Improvement Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {blog.improvementNotes.map((note, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-destructive">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Content preview */}
          {blog.content && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Content Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap font-mono">
                  {blog.content.slice(0, 800)}…
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
