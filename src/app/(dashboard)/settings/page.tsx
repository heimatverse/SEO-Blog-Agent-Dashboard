"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Save, Loader2, CheckCircle2 } from "lucide-react"

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showOpenAI, setShowOpenAI] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showSanity, setShowSanity] = useState(false)

  const [settings, setSettings] = useState({
    openaiKey: "",
    anthropicKey: "",
    sanityProjectId: "",
    sanityDataset: "production",
    sanityToken: "",
    defaultModel: "claude-opus-4-6",
    defaultPublishBehavior: "draft",
    minScoreThreshold: "90",
    maxRetries: "3",
  })

  // Load persisted pipeline settings from localStorage on mount
  // Note: API keys are intentionally excluded — they live in env vars only
  useEffect(() => {
    try {
      const stored = localStorage.getItem("seo_pipeline_settings")
      if (stored) {
        const parsed = JSON.parse(stored)
        setSettings((prev) => ({
          ...prev,
          defaultModel: parsed.defaultModel ?? prev.defaultModel,
          defaultPublishBehavior: parsed.defaultPublishBehavior ?? prev.defaultPublishBehavior,
          minScoreThreshold: parsed.minScoreThreshold ?? prev.minScoreThreshold,
          maxRetries: parsed.maxRetries ?? prev.maxRetries,
        }))
      }
    } catch {}
  }, [])

  function handleChange(field: string, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    // Persist pipeline settings to localStorage (API keys stay in env vars)
    localStorage.setItem("seo_pipeline_settings", JSON.stringify({
      defaultModel: settings.defaultModel,
      defaultPublishBehavior: settings.defaultPublishBehavior,
      minScoreThreshold: settings.minScoreThreshold,
      maxRetries: settings.maxRetries,
    }))
    await new Promise((r) => setTimeout(r, 400))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure API keys, pipeline behavior, and publishing defaults.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="sanity">Sanity CMS</TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="api-keys" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Models</CardTitle>
              <CardDescription>
                API keys used by the agent pipeline to generate content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-key"
                    type={showOpenAI ? "text" : "password"}
                    placeholder="sk-..."
                    value={settings.openaiKey}
                    onChange={(e) => handleChange("openaiKey", e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowOpenAI((v) => !v)}
                    type="button"
                  >
                    {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Used for GPT-4o fallback and embeddings.</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="anthropic-key"
                    type={showAnthropicKey ? "text" : "password"}
                    placeholder="sk-ant-..."
                    value={settings.anthropicKey}
                    onChange={(e) => handleChange("anthropicKey", e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAnthropicKey((v) => !v)}
                    type="button"
                  >
                    {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Primary model for blog writing, scoring, and humanization.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline */}
        <TabsContent value="pipeline" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Generation Defaults</CardTitle>
              <CardDescription>
                Control how the agent writes, scores, and publishes content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default AI Model</Label>
                  <Select
                    value={settings.defaultModel}
                    onValueChange={(v) => v && handleChange("defaultModel", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-opus-4-6">Claude Opus 4.6 (Best quality)</SelectItem>
                      <SelectItem value="claude-sonnet-4-6">Claude Sonnet 4.6 (Balanced)</SelectItem>
                      <SelectItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Default Publish Behavior</Label>
                  <Select
                    value={settings.defaultPublishBehavior}
                    onValueChange={(v) => v && handleChange("defaultPublishBehavior", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Always save as draft</SelectItem>
                      <SelectItem value="auto">Auto-publish if score ≥ threshold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score-threshold">Minimum Score Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="score-threshold"
                      type="number"
                      min="0"
                      max="110"
                      value={settings.minScoreThreshold}
                      onChange={(e) => handleChange("minScoreThreshold", e.target.value)}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">/ 110</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Blogs below this score will be retried or saved as drafts.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-retries">Max Retries</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxRetries}
                    onChange={(e) => handleChange("maxRetries", e.target.value)}
                    className="w-24"
                  />
                  <p className="text-xs text-muted-foreground">If score is below threshold after N attempts, move to drafts.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sanity CMS */}
        <TabsContent value="sanity" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sanity CMS Connection</CardTitle>
              <CardDescription>
                Sanity is used to store all generated content, topics, and website configurations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sanity-project">Project ID</Label>
                  <Input
                    id="sanity-project"
                    placeholder="abc123def"
                    value={settings.sanityProjectId}
                    onChange={(e) => handleChange("sanityProjectId", e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sanity-dataset">Dataset</Label>
                  <Input
                    id="sanity-dataset"
                    placeholder="production"
                    value={settings.sanityDataset}
                    onChange={(e) => handleChange("sanityDataset", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sanity-token">API Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="sanity-token"
                    type={showSanity ? "text" : "password"}
                    placeholder="sk..."
                    value={settings.sanityToken}
                    onChange={(e) => handleChange("sanityToken", e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSanity((v) => !v)}
                    type="button"
                  >
                    {showSanity ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires read/write permissions. Generate at{" "}
                  <span className="font-medium">sanity.io/manage</span>.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
