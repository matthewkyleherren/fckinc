import { Client, Account, Databases, Storage } from "appwrite";

export const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://fra.cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
export const DATABASE_ID = "fckinc";
export const BUCKET_ID = "media";

// Collection IDs
export const COLLECTIONS = {
  PROFILES: "profiles",
  PROFILE_SERVICES: "profile_services",
  PROFILE_REVISIONS: "profile_revisions",
  TRANSLATIONS: "translations",
  AFFILIATIONS: "affiliations",
  ALBUMS: "albums",
  MEDIA_ITEMS: "media_items",
  FEED_POSTS: "feed_posts",
  STORIES: "stories",
  REVIEWS: "reviews",
  VENUES: "venues",
  IMPORT_JOBS: "import_jobs",
  AUDIT_LOG: "audit_log",
} as const;

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { client };
