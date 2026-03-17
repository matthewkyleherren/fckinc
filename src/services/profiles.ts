import { ID, Query } from "appwrite";
import { databases, DATABASE_ID, COLLECTIONS, storage, BUCKET_ID } from "@/lib/appwrite";
import type { Profile, ProfileService, ProfileRevision, LocationInfo } from "@/types/models";

// ---- JSON helpers ----

export function parseJson<T>(raw?: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function toJson<T>(data: T | undefined | null): string | undefined {
  if (data == null) return undefined;
  return JSON.stringify(data);
}

// ---- Profile CRUD ----

export interface CreateProfileInput {
  display_name: string;
  profile_type: Profile["profile_type"];
  owner_id: string;
  status?: Profile["status"];
  slug?: string;
  tagline?: string;
  about?: string;
  tier?: string;
  personal?: object;
  languages?: object;
  location?: LocationInfo;
  travel?: object;
  availability?: object;
  pricing?: object;
  contact?: object;
  social_links?: object;
  amenities?: object;
  verification?: object;
  settings?: object;
  locale?: string;
}

function buildProfileData(input: CreateProfileInput) {
  const data: Record<string, unknown> = {
    display_name: input.display_name,
    profile_type: input.profile_type,
    owner_id: input.owner_id,
    status: input.status ?? "draft",
  };

  // Optional scalars
  if (input.slug) data.slug = input.slug;
  if (input.tagline) data.tagline = input.tagline;
  if (input.about) data.about = input.about;
  if (input.tier) data.tier = input.tier;
  if (input.locale) data.locale = input.locale;

  // JSON blobs
  if (input.personal) data.personal = JSON.stringify(input.personal);
  if (input.languages) data.languages = JSON.stringify(input.languages);
  if (input.location) {
    data.location = JSON.stringify(input.location);
    data.location_city = input.location.city ?? null;
    data.location_country = input.location.country ?? null;
  }
  if (input.travel) data.travel = JSON.stringify(input.travel);
  if (input.availability) data.availability = JSON.stringify(input.availability);
  if (input.pricing) data.pricing = JSON.stringify(input.pricing);
  if (input.contact) data.contact = JSON.stringify(input.contact);
  if (input.social_links) data.social_links = JSON.stringify(input.social_links);
  if (input.amenities) data.amenities = JSON.stringify(input.amenities);
  if (input.verification) data.verification = JSON.stringify(input.verification);
  if (input.settings) data.settings = JSON.stringify(input.settings);

  return data;
}

export async function createProfile(input: CreateProfileInput): Promise<Profile> {
  const data = buildProfileData(input);
  data.view_count = 0;
  data.favorite_count = 0;
  data.follower_count = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return databases.createDocument<Profile>(
    DATABASE_ID,
    COLLECTIONS.PROFILES,
    ID.unique(),
    data as any,
    [
      `read("any")`,
      `read("user:${input.owner_id}")`,
      `update("user:${input.owner_id}")`,
      `delete("user:${input.owner_id}")`,
    ]
  );
}

export async function getProfile(id: string): Promise<Profile> {
  return databases.getDocument<Profile>(DATABASE_ID, COLLECTIONS.PROFILES, id);
}

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const result = await databases.listDocuments<Profile>(
    DATABASE_ID,
    COLLECTIONS.PROFILES,
    [Query.equal("slug", slug), Query.limit(1)]
  );
  return result.documents[0] ?? null;
}

export interface ListProfilesOptions {
  status?: Profile["status"];
  profile_type?: Profile["profile_type"];
  city?: string;
  country?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listProfiles(opts: ListProfilesOptions = {}) {
  const queries: string[] = [];

  if (opts.status) queries.push(Query.equal("status", opts.status));
  if (opts.profile_type) queries.push(Query.equal("profile_type", opts.profile_type));
  if (opts.city) queries.push(Query.equal("location_city", opts.city));
  if (opts.country) queries.push(Query.equal("location_country", opts.country));
  if (opts.search) queries.push(Query.search("display_name", opts.search));

  queries.push(Query.limit(opts.limit ?? 25));
  if (opts.offset) queries.push(Query.offset(opts.offset));
  queries.push(Query.orderDesc("$updatedAt"));

  return databases.listDocuments<Profile>(DATABASE_ID, COLLECTIONS.PROFILES, queries);
}

export async function updateProfile(
  id: string,
  input: Partial<CreateProfileInput>,
  changedBy: string
): Promise<Profile> {
  // 1. Snapshot the current state before updating
  const current = await getProfile(id);
  await createRevision(current, changedBy);

  // 2. Build update data
  const data: Record<string, unknown> = {};

  if (input.display_name !== undefined) data.display_name = input.display_name;
  if (input.profile_type !== undefined) data.profile_type = input.profile_type;
  if (input.status !== undefined) data.status = input.status;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.tagline !== undefined) data.tagline = input.tagline;
  if (input.about !== undefined) data.about = input.about;
  if (input.tier !== undefined) data.tier = input.tier;
  if (input.locale !== undefined) data.locale = input.locale;
  if (input.personal !== undefined) data.personal = JSON.stringify(input.personal);
  if (input.languages !== undefined) data.languages = JSON.stringify(input.languages);
  if (input.location !== undefined) {
    data.location = JSON.stringify(input.location);
    data.location_city = input.location.city ?? null;
    data.location_country = input.location.country ?? null;
  }
  if (input.travel !== undefined) data.travel = JSON.stringify(input.travel);
  if (input.availability !== undefined) data.availability = JSON.stringify(input.availability);
  if (input.pricing !== undefined) data.pricing = JSON.stringify(input.pricing);
  if (input.contact !== undefined) data.contact = JSON.stringify(input.contact);
  if (input.social_links !== undefined) data.social_links = JSON.stringify(input.social_links);
  if (input.amenities !== undefined) data.amenities = JSON.stringify(input.amenities);
  if (input.verification !== undefined) data.verification = JSON.stringify(input.verification);
  if (input.settings !== undefined) data.settings = JSON.stringify(input.settings);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return databases.updateDocument<Profile>(
    DATABASE_ID, COLLECTIONS.PROFILES, id, data as any
  );
}

export async function deleteProfile(id: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILES, id);
}

// ---- Revision tracking ----

async function createRevision(profile: Profile, changedBy: string): Promise<ProfileRevision> {
  // Count existing revisions to get next number
  const existing = await databases.listDocuments<ProfileRevision>(
    DATABASE_ID,
    COLLECTIONS.PROFILE_REVISIONS,
    [
      Query.equal("profile_id", profile.$id),
      Query.orderDesc("revision_number"),
      Query.limit(1),
    ]
  );

  const nextNumber = existing.documents.length > 0
    ? existing.documents[0].revision_number + 1
    : 1;

  // Store snapshot as a JSON file in storage
  const snapshot = JSON.stringify(profile);
  const blob = new Blob([snapshot], { type: "application/json" });
  const file = new File([blob], `rev_${profile.$id}_${nextNumber}.json`);

  const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);

  return databases.createDocument<ProfileRevision>(
    DATABASE_ID,
    COLLECTIONS.PROFILE_REVISIONS,
    ID.unique(),
    {
      profile_id: profile.$id,
      revision_number: nextNumber,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
      snapshot_file_id: uploadedFile.$id,
      snapshot_summary: `Revision ${nextNumber}`,
    }
  );
}

export async function listRevisions(profileId: string) {
  return databases.listDocuments<ProfileRevision>(
    DATABASE_ID,
    COLLECTIONS.PROFILE_REVISIONS,
    [
      Query.equal("profile_id", profileId),
      Query.orderDesc("revision_number"),
      Query.limit(50),
    ]
  );
}

// ---- Profile services ----

export async function setProfileServices(
  profileId: string,
  services: Array<{
    service_key: string;
    category?: string;
    display_name?: string;
    availability: ProfileService["availability"];
    pricing_tiers?: object[];
    notes?: string;
  }>
): Promise<void> {
  // Delete existing services for this profile
  const existing = await databases.listDocuments<ProfileService>(
    DATABASE_ID,
    COLLECTIONS.PROFILE_SERVICES,
    [Query.equal("profile_id", profileId), Query.limit(200)]
  );

  await Promise.all(
    existing.documents.map((doc) =>
      databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROFILE_SERVICES, doc.$id)
    )
  );

  // Create new ones
  await Promise.all(
    services.map((svc) =>
      databases.createDocument<ProfileService>(
        DATABASE_ID,
        COLLECTIONS.PROFILE_SERVICES,
        ID.unique(),
        {
          profile_id: profileId,
          service_key: svc.service_key,
          category: svc.category,
          display_name: svc.display_name,
          availability: svc.availability,
          pricing_tiers: svc.pricing_tiers
            ? JSON.stringify(svc.pricing_tiers)
            : undefined,
          notes: svc.notes,
        }
      )
    )
  );
}

export async function getProfileServices(profileId: string) {
  return databases.listDocuments<ProfileService>(
    DATABASE_ID,
    COLLECTIONS.PROFILE_SERVICES,
    [Query.equal("profile_id", profileId), Query.limit(200)]
  );
}
