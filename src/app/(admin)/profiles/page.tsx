"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listProfiles, type ListProfilesOptions } from "@/services/profiles";
import type { Profile } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  archived: "bg-gray-100 text-gray-800",
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const opts: ListProfilesOptions = { limit: 25 };
      if (statusFilter !== "all") opts.status = statusFilter as Profile["status"];
      if (typeFilter !== "all") opts.profile_type = typeFilter as Profile["profile_type"];
      if (search) opts.search = search;

      const result = await listProfiles(opts);
      setProfiles(result.documents);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to load profiles:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold">Profiles</h2>
        <Link href="/profiles/new">
          <Button size="sm">+ New</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
            <SelectTrigger className="flex-1 sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)}>
            <SelectTrigger className="flex-1 sm:w-44">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="independent">Independent</SelectItem>
              <SelectItem value="agency_member">Agency member</SelectItem>
              <SelectItem value="club_resident">Club resident</SelectItem>
              <SelectItem value="studio_member">Studio member</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Loading…</p>
        ) : profiles.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No profiles found. Create one to get started.</p>
        ) : (
          profiles.map((p) => (
            <Link
              key={p.$id}
              href={`/profiles/${p.$id}/edit`}
              className="flex items-center justify-between rounded-lg border border-border/80 bg-card px-3.5 py-3 active:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{p.display_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {p.location_city ?? "No city"} &middot; {p.profile_type.replace(/_/g, " ")}
                </p>
              </div>
              <Badge variant="secondary" className={`ml-3 shrink-0 ${STATUS_COLORS[p.status] ?? ""}`}>
                {p.status}
              </Badge>
            </Link>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No profiles found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((p) => (
                <TableRow key={p.$id}>
                  <TableCell>
                    <Link
                      href={`/profiles/${p.$id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {p.display_name}
                    </Link>
                    {p.tagline && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {p.tagline}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.profile_type.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.location_city ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_COLORS[p.status] ?? ""}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {p.view_count ?? 0}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {new Date(p.$updatedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        {total} profile{total !== 1 ? "s" : ""} total
      </p>
    </div>
  );
}
