import { sanityClient } from "@/sanity/lib/client"
import { analyticsQuery } from "@/sanity/lib/queries"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarChart2, FileText, TrendingUp, Archive, CheckCircle2 } from "lucide-react"

interface AnalyticsData {
  total: number
  published: number
  completed: number
  drafts: number
  generating: number
  avgScore: number | null
  topBlogs: { id: string; title: string; score: number; status: string; websiteDomain: string }[]
  websiteStats: {
    id: string
    domain: string
    niche: string
    blogCount: number
    avgScore: number | null
    publishedCount: number
    draftCount: number
  }[]
}

async function getAnalytics(): Promise<AnalyticsData> {
  try {
    return await sanityClient.fetch<AnalyticsData>(analyticsQuery)
  } catch {
    return {
      total: 0, published: 0, completed: 0, drafts: 0, generating: 0,
      avgScore: null, topBlogs: [], websiteStats: [],
    }
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalytics()

  const passed = data.published + data.completed
  const passRate = data.total > 0 ? Math.round((passed / data.total) * 100) : 0

  const STATS = [
    {
      title: "Total Blogs Generated",
      value: data.total.toString(),
      description: `${data.generating} currently running`,
      icon: FileText,
    },
    {
      title: "Avg. Quality Score",
      value: data.avgScore ? `${Math.round(data.avgScore)}/110` : "—",
      description: "Threshold: 90/110",
      icon: TrendingUp,
    },
    {
      title: "Pass Rate",
      value: `${passRate}%`,
      description: `${passed} passed out of ${data.total}`,
      icon: CheckCircle2,
    },
    {
      title: "In Drafts",
      value: data.drafts.toString(),
      description: "Below 90/110 threshold",
      icon: Archive,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Pipeline performance, content quality metrics, and per-website breakdown.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Score distribution */}
      {data.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              Content Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Published", count: data.published, color: "bg-green-500" },
              { label: "Completed (unpublished)", count: data.completed, color: "bg-blue-500" },
              { label: "Drafts / Failed", count: data.drafts, color: "bg-destructive" },
              { label: "Generating", count: data.generating, color: "bg-yellow-500" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-48 shrink-0">{label}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: data.total > 0 ? `${(count / data.total) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top blogs */}
        {data.topBlogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Scoring Blogs</CardTitle>
              <CardDescription>Highest quality scores across all websites</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topBlogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium max-w-[180px] truncate text-sm">{blog.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm truncate max-w-[100px]">
                      {blog.websiteDomain ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium text-sm ${blog.score >= 90 ? "text-green-600" : "text-destructive"}`}>
                        {blog.score}/110
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Per-website breakdown */}
        {data.websiteStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Per-Website Performance</CardTitle>
              <CardDescription>Blog counts and quality by website</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead className="text-right">Blogs</TableHead>
                  <TableHead className="text-right">Avg Score</TableHead>
                  <TableHead className="text-right">Drafts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.websiteStats.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium text-sm max-w-[140px] truncate">{site.domain}</TableCell>
                    <TableCell className="text-right text-sm">{site.blogCount}</TableCell>
                    <TableCell className="text-right">
                      {site.avgScore != null ? (
                        <span className={`text-sm font-medium ${site.avgScore >= 90 ? "text-green-600" : "text-muted-foreground"}`}>
                          {Math.round(site.avgScore)}/110
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {site.draftCount > 0 ? (
                        <Badge variant="destructive" className="text-xs">{site.draftCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Empty state */}
      {data.total === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BarChart2 className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <CardTitle className="text-base">No data yet</CardTitle>
              <CardDescription className="mt-1">
                Run the pipeline on a few topics to see analytics here.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
