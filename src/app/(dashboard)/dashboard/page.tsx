import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, FileText, TrendingUp, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { sanityClient } from "@/sanity/lib/client"
import { dashboardStatsQuery } from "@/sanity/lib/queries"

async function getStats() {
  try {
    return await sanityClient.fetch<{
      websiteCount: number
      blogCount: number
      avgScore: number | null
      pendingTopics: number
      activeJobs: number
    }>(dashboardStatsQuery)
  } catch {
    return { websiteCount: 0, blogCount: 0, avgScore: null, pendingTopics: 0, activeJobs: 0 }
  }
}

const PIPELINE_STEPS = [
  { step: "01", label: "Keyword Research", desc: "Seed keywords → clusters", href: "/topics" },
  { step: "02", label: "Topic Generation", desc: "Clusters → ranked topics", href: "/topics" },
  { step: "03", label: "Content Brief", desc: "Topic → detailed outline", href: "/topics" },
  { step: "04", label: "Blog Writing", desc: "Brief → full article", href: "/blogs" },
  { step: "05", label: "Content Scoring", desc: "11-factor SEO audit", href: "/blogs" },
  { step: "06", label: "Humanization", desc: "AI polish → natural prose", href: "/blogs" },
]

export default async function DashboardPage() {
  const s = await getStats()

  const STATS = [
    {
      title: "Active Websites",
      value: s.websiteCount.toString(),
      description: s.websiteCount === 0 ? "Connect your first website" : `${s.websiteCount} active`,
      icon: Globe,
      href: "/websites",
    },
    {
      title: "Blogs Generated",
      value: s.blogCount.toString(),
      description: "Across all websites",
      icon: FileText,
      href: "/blogs",
    },
    {
      title: "Avg. Quality Score",
      value: s.avgScore ? `${Math.round(s.avgScore)}/110` : "—",
      description: "Minimum passing: 90/110",
      icon: TrendingUp,
      href: "/blogs",
    },
    {
      title: "Pipeline Status",
      value: s.activeJobs > 0 ? "Active" : "Idle",
      description: s.activeJobs > 0
        ? `${s.activeJobs} job${s.activeJobs !== 1 ? "s" : ""} running`
        : s.pendingTopics > 0
        ? `${s.pendingTopics} pending approval`
        : "No active jobs",
      icon: Zap,
      href: "/topics",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your AI-powered SEO content pipeline.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden">
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

      {/* Quick start banner */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Get started in 3 steps</CardTitle>
          <CardDescription>
            Connect a website, add seed keywords, and let the agent write for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button render={<Link href="/websites" />}>
            Add your first website
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" render={<Link href="/topics" />}>
            Start with keywords
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline overview */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Agent Pipeline</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PIPELINE_STEPS.map((s) => (
            <Link key={s.step} href={s.href}>
              <Card className="hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {s.step}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm leading-tight">{s.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
