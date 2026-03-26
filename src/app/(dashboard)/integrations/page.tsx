import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Plug, ExternalLink } from "lucide-react"

interface Integration {
  name: string
  description: string
  configured: boolean
  detail: string
  docsUrl?: string
}

function getIntegrations(): Integration[] {
  return [
    {
      name: "Sanity CMS",
      description: "Content storage for websites, topics, blogs, and keywords.",
      configured: !!(
        process.env.SANITY_PROJECT_ID &&
        process.env.SANITY_DATASET &&
        process.env.SANITY_API_TOKEN
      ),
      detail: process.env.SANITY_PROJECT_ID
        ? `Project: ${process.env.SANITY_PROJECT_ID} · Dataset: ${process.env.SANITY_DATASET ?? "production"}`
        : "SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN not set",
      docsUrl: "https://sanity.io",
    },
    {
      name: "Anthropic Claude",
      description: "AI engine for keyword research, topic generation, blog writing, and scoring.",
      configured: !!process.env.ANTHROPIC_API_KEY,
      detail: process.env.ANTHROPIC_API_KEY
        ? "API key configured (claude-opus-4-6)"
        : "ANTHROPIC_API_KEY not set",
      docsUrl: "https://console.anthropic.com",
    },
    {
      name: "SEO Blog Agent Backend",
      description: "Python FastAPI backend running on Modal for pipeline execution.",
      configured: !!process.env.BACKEND_URL,
      detail: process.env.BACKEND_URL
        ? process.env.BACKEND_URL
        : "BACKEND_URL not set — dashboard uses its own Next.js API routes",
    },
  ]
}

export default function IntegrationsPage() {
  const integrations = getIntegrations()
  const configuredCount = integrations.filter((i) => i.configured).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          External services connected to the SEO Blog Agent pipeline.{" "}
          <span className={configuredCount === integrations.length ? "text-green-600" : "text-yellow-600"}>
            {configuredCount}/{integrations.length} configured.
          </span>
        </p>
      </div>

      {/* Integration cards */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
        {integrations.map((integration) => (
          <Card key={integration.name} className={integration.configured ? "" : "border-dashed opacity-80"}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4 text-muted-foreground shrink-0" />
                  <CardTitle className="text-base">{integration.name}</CardTitle>
                </div>
                <Badge
                  variant={integration.configured ? "default" : "secondary"}
                  className="shrink-0 gap-1"
                >
                  {integration.configured ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {integration.configured ? "Connected" : "Not configured"}
                </Badge>
              </div>
              <CardDescription>{integration.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1.5 rounded">
                {integration.detail}
              </p>
              {integration.docsUrl && (
                <a
                  href={integration.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  Documentation
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Setup note */}
      {configuredCount < integrations.length && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">
              Add missing environment variables to your{" "}
              <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">.env.local</code>{" "}
              file (local) or Vercel project settings (production) to activate these integrations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
