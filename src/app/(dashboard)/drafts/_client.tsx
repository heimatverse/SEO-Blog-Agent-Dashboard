"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, Eye, RefreshCw, Loader2, Archive } from "lucide-react"
import { toast } from "sonner"
import type { BlogPost } from "@/types"

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

export function DraftsClient({ initialDrafts }: { initialDrafts: BlogPost[] }) {
  const [drafts, setDrafts] = useState<BlogPost[]>(initialDrafts)
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
        if (result.status === "completed" || result.status === "published") {
          // Passed — remove from drafts list
          setDrafts((prev) => prev.filter((b) => b.id !== blog.id))
          toast.success(`Passed! Score: ${result.score}/110 — moved to Blogs.`)
        } else {
          // Still a draft
          setDrafts((prev) =>
            prev.map((b) =>
              b.id === blog.id
                ? { ...b, status: result.status as BlogPost["status"], score: result.score }
                : b
            )
          )
          toast.warning(`Still below threshold — score: ${result.score}/110`)
        }
      }
    } catch (err) {
      toast.error("Retry failed.")
      console.error(err)
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Drafts</h1>
        <p className="text-muted-foreground">
          Blogs that scored below 90/110 and need improvement. Retry to regenerate.
        </p>
      </div>

      {/* Empty state */}
      {drafts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500/70" />
            <div>
              <CardTitle className="text-base">No rejected drafts</CardTitle>
              <CardDescription className="mt-1">
                All generated blogs are passing the quality threshold.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Rejected Drafts</CardTitle>
                <CardDescription>
                  {drafts.length} blog{drafts.length !== 1 ? "s" : ""} below the 90/110 threshold
                </CardDescription>
              </div>
              <Archive className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
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
              {drafts.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="font-medium max-w-xs truncate">{blog.title}</TableCell>
                  <TableCell>
                    <Badge variant={blog.status === "failed" ? "destructive" : "secondary"} className="capitalize">
                      {blog.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {blog.score !== null ? (
                      <span className="text-destructive font-medium">{blog.score}/110</span>
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
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedBlog(blog)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => handleRetry(blog)}
                        disabled={retryingId === blog.id}
                        title="Retry pipeline"
                      >
                        {retryingId === blog.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail modal */}
      <Dialog open={!!selectedBlog} onOpenChange={(open) => !open && setSelectedBlog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base leading-snug pr-4">{selectedBlog?.title}</DialogTitle>
          </DialogHeader>
          {selectedBlog && (
            <div className="space-y-4">
              {/* Score */}
              {selectedBlog.score !== null && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Overall Score</CardTitle>
                      <span className="text-xl font-bold text-destructive">{selectedBlog.score}/110</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(selectedBlog.score / 110) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Below minimum threshold (90/110) — needs {90 - selectedBlog.score} more points
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Score breakdown */}
              {selectedBlog.scoreBreakdown && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Score Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {SCORE_LABELS.map(({ key, label }) => {
                      const val = selectedBlog.scoreBreakdown![key]
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-44 shrink-0">{label}</span>
                          <Progress value={(val / 10) * 100} className="h-1.5 flex-1" />
                          <span className={`text-xs font-medium w-8 text-right ${val < 7 ? "text-destructive" : ""}`}>
                            {val}/10
                          </span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Improvement notes */}
              {selectedBlog.improvementNotes.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Why It Failed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {selectedBlog.improvementNotes.map((note, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-destructive shrink-0">•</span>
                          {note}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
