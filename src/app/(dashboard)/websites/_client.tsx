"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Plus, MoreHorizontal, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { createWebsite, deleteWebsite } from "@/sanity/lib/actions"
import type { Website } from "@/types"

const STATUS_VARIANTS: Record<Website["status"], "default" | "secondary" | "destructive"> = {
  active: "default",
  paused: "secondary",
  error: "destructive",
}

export function WebsitesClient({ initialWebsites }: { initialWebsites: Website[] }) {
  const [websites, setWebsites] = useState<Website[]>(initialWebsites)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    domain: "",
    niche: "",
    targetAudience: "",
    toneOfVoice: "professional",
    language: "en",
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleAdd() {
    if (!form.domain || !form.niche) return
    startTransition(async () => {
      try {
        const doc = await createWebsite({
          domain: form.domain.replace(/^https?:\/\//, ""),
          niche: form.niche,
          targetAudience: form.targetAudience,
          toneOfVoice: form.toneOfVoice,
          language: form.language,
          status: "active",
        })
        const newSite: Website = {
          id: doc._id,
          domain: form.domain.replace(/^https?:\/\//, ""),
          niche: form.niche,
          targetAudience: form.targetAudience,
          toneOfVoice: form.toneOfVoice,
          language: form.language,
          status: "active",
          blogsGenerated: 0,
          avgScore: 0,
          createdAt: new Date().toISOString(),
        }
        setWebsites((prev) => [newSite, ...prev])
        setForm({ domain: "", niche: "", targetAudience: "", toneOfVoice: "professional", language: "en" })
        setOpen(false)
        toast.success("Website added successfully")
      } catch (err) {
        toast.error("Failed to save website. Check your Sanity configuration.")
        console.error(err)
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteWebsite(id)
        setWebsites((prev) => prev.filter((w) => w.id !== id))
        toast.success("Website deleted")
      } catch (err) {
        toast.error("Failed to delete website.")
        console.error(err)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Websites</h1>
          <p className="text-muted-foreground">
            Manage the websites your agent will write content for.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Website
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a new website</DialogTitle>
              <DialogDescription>
                The agent will generate SEO content tailored to this website.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="domain">Domain *</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={form.domain}
                  onChange={(e) => handleChange("domain", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="niche">Niche / Industry *</Label>
                <Input
                  id="niche"
                  placeholder="e.g. SaaS, E-commerce, Health"
                  value={form.niche}
                  onChange={(e) => handleChange("niche", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g. Startup founders, 25–45"
                  value={form.targetAudience}
                  onChange={(e) => handleChange("targetAudience", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tone of Voice</Label>
                  <Select value={form.toneOfVoice} onValueChange={(v) => v && handleChange("toneOfVoice", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={form.language} onValueChange={(v) => v && handleChange("language", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isPending || !form.domain || !form.niche}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Website
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table or empty state */}
      {websites.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Globe className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <CardTitle className="text-base">No websites yet</CardTitle>
              <CardDescription className="mt-1">
                Add your first website to start generating SEO content.
              </CardDescription>
            </div>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Website
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Niche</TableHead>
                <TableHead>Tone</TableHead>
                <TableHead className="text-right">Blogs</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {websites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.domain}</TableCell>
                  <TableCell className="text-muted-foreground">{site.niche}</TableCell>
                  <TableCell className="text-muted-foreground capitalize">{site.toneOfVoice}</TableCell>
                  <TableCell className="text-right">{site.blogsGenerated}</TableCell>
                  <TableCell className="text-right">
                    {site.avgScore > 0 ? `${site.avgScore}/110` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[site.status]} className="capitalize">
                      {site.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(site.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
