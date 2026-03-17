"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createProfile } from "@/services/profiles";
import type { ProfileType } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ScrapeResult {
  source_url: string;
  title: string;
  description: string;
  markdown: string;
  html: string;
  metadata: Record<string, unknown>;
}

function suggestedName(url: string, title: string) {
  if (title.trim()) return title.trim().slice(0, 80);
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return "Imported profile";
  }
}

export default function ImportPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const [type, setType] = useState<ProfileType>("independent");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/firecrawl/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        result?: ScrapeResult;
      };

      if (!res.ok || !json.success || !json.result) {
        throw new Error(json.error ?? "Failed to import URL.");
      }

      const imported = json.result;
      setResult(imported);
      setName(suggestedName(imported.source_url, imported.title));
      setTagline(imported.description.slice(0, 160));
      setAbout(imported.markdown.slice(0, 6000));
      toast.success("Content imported. Review fields before creating.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProfile() {
    if (!user || !name.trim()) return;
    setCreating(true);
    try {
      const profile = await createProfile({
        display_name: name,
        profile_type: type,
        owner_id: user.$id,
        tagline: tagline || undefined,
        about: about || undefined,
        location:
          city || country
            ? {
                city: city || undefined,
                country: country || undefined,
              }
            : undefined,
      });

      toast.success("Draft profile created from import.");
      router.push(`/profiles/${profile.$id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create profile.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Import with Firecrawl</h2>
        <p className="text-sm text-muted-foreground">
          Paste a source URL, extract content, then map it into a draft profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Source URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="import-url">URL</Label>
              <Input
                id="import-url"
                type="url"
                placeholder="https://example.com/profile"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading || !url}>
              {loading ? "Importing..." : "Fetch Content"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Extracted Data</CardTitle>
                <Badge variant="outline">{result.markdown.length} chars</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Title</p>
                <p className="text-sm">{result.title || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Description</p>
                <p className="text-sm">{result.description || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Markdown Preview</p>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-xs">
                  {result.markdown.slice(0, 1200) || "No markdown extracted."}
                </pre>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Draft Profile Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Profile Type</Label>
                  <Select value={type} onValueChange={(v) => v && setType(v as ProfileType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="agency_member">Agency Member</SelectItem>
                      <SelectItem value="club_resident">Club Resident</SelectItem>
                      <SelectItem value="studio_member">Studio Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="about">About</Label>
                <Textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} rows={7} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateProfile} disabled={creating || !name.trim()}>
                  {creating ? "Creating..." : "Create Draft Profile"}
                </Button>
                <Button variant="ghost" onClick={() => router.push("/profiles")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
