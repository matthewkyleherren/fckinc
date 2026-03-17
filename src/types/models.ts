import type { Models } from "appwrite";

// ---- Enums ----

export type ProfileType =
  | "independent"
  | "agency_member"
  | "club_resident"
  | "studio_member";

export type ProfileStatus = "draft" | "published" | "suspended" | "archived";

export type ServiceAvailability =
  | "included"
  | "extra"
  | "on_request"
  | "not_offered";

export type Visibility =
  | "public"
  | "logged_in"
  | "followers"
  | "subscribers"
  | "verified_clients"
  | "approved_list"
  | "link_only"
  | "private";

export type VenueType =
  | "agency"
  | "club"
  | "studio"
  | "private_house"
  | "sauna_club"
  | "bar"
  | "hotel"
  | "other";

export type AffiliationStatus = "current" | "upcoming" | "past" | "recurring";

export type MediaType = "photo" | "video" | "gif" | "audio";

export type NsfwLevel = "sfw" | "suggestive" | "nsfw_soft" | "nsfw_explicit";

export type FeedPostType =
  | "status"
  | "photo"
  | "video"
  | "gallery"
  | "announcement"
  | "promo"
  | "availability_update"
  | "new_album"
  | "poll"
  | "repost"
  | "review_highlight";

export type ReviewStatus = "pending" | "published" | "hidden" | "reported";

export type TranslationStatus = "draft" | "auto" | "approved";

export type ImportJobStatus =
  | "queued"
  | "mapping"
  | "extracting"
  | "rewriting"
  | "review"
  | "imported"
  | "failed"
  | "cancelled";

export type AlbumType =
  | "portfolio"
  | "selfies"
  | "professional_shoot"
  | "lifestyle"
  | "venue"
  | "outfits"
  | "travel"
  | "behind_the_scenes"
  | "events"
  | "before_after"
  | "custom";

// ---- JSON sub-structures (stored as serialized strings) ----

export interface PersonalInfo {
  age?: number;
  gender?: string;
  ethnicity?: string;
  nationality?: string;
  height_cm?: number;
  weight_kg?: number;
  body_type?: string;
  bust_size?: string;
  hair_color?: string;
  hair_length?: string;
  eye_color?: string;
  skin_tone?: string;
  tattoos?: string;
  piercings?: string;
  smoking?: string;
  orientation?: string;
  personality_tags?: string[];
}

export interface LocationInfo {
  city?: string;
  region?: string;
  country?: string;
  postal_code?: string;
  neighborhood?: string;
  coordinates?: { lat: number; lng: number };
  timezone?: string;
}

export interface PricingTier {
  duration: string;
  price: number;
  currency: string;
  type?: "incall" | "outcall";
}

export interface PricingInfo {
  currency?: string;
  base_rates?: PricingTier[];
  deposit_required?: boolean;
  payment_methods?: string[];
  notes?: string;
}

export interface AvailabilitySchedule {
  general_hours?: string;
  schedule?: Record<string, { start: string; end: string } | null>;
  by_appointment_only?: boolean;
  advance_booking_hours?: number;
  last_minute?: boolean;
  notes?: string;
}

export interface LanguageEntry {
  code: string;
  level?: "native" | "fluent" | "conversational" | "basic";
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  whatsapp?: string;
  telegram?: string;
  signal?: string;
  website?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  username?: string;
}

export interface VerificationInfo {
  is_verified?: boolean;
  verified_at?: string;
  method?: string;
  badge_level?: string;
}

export interface ReviewsSummary {
  average_rating?: number;
  total_count?: number;
  breakdown?: Record<number, number>;
}

export interface ProfileSettings {
  show_last_seen?: boolean;
  allow_reviews?: boolean;
  allow_messages?: boolean;
  content_locale?: string;
}

// ---- Document models ----

export interface Profile extends Models.Document {
  display_name: string;
  slug?: string;
  tagline?: string;
  about?: string;
  profile_type: ProfileType;
  tier?: string;
  status: ProfileStatus;
  // JSON-serialized fields (parse on read)
  personal?: string;
  languages?: string;
  location?: string;
  travel?: string;
  availability?: string;
  pricing?: string;
  contact?: string;
  social_links?: string;
  amenities?: string;
  verification?: string;
  reviews_summary?: string;
  settings?: string;
  // Scalar fields
  owner_id: string;
  locale?: string;
  location_city?: string;
  location_country?: string;
  view_count?: number;
  favorite_count?: number;
  follower_count?: number;
  last_seen_at?: string;
}

export interface ProfileService extends Models.Document {
  profile_id: string;
  service_key: string;
  category?: string;
  display_name?: string;
  availability: ServiceAvailability;
  pricing_tiers?: string; // JSON
  notes?: string;
}

export interface ProfileRevision extends Models.Document {
  profile_id: string;
  revision_number: number;
  changed_by: string;
  changed_at: string;
  diff_summary?: string;
  snapshot_file_id?: string;
  snapshot_summary?: string;
}

export interface Translation extends Models.Document {
  profile_id: string;
  locale: string;
  fields: string; // JSON
  status: TranslationStatus;
  source_revision?: number;
  translated_by?: string;
  translated_at?: string;
}

export interface Affiliation extends Models.Document {
  profile_id: string;
  venue_id?: string;
  venue_name: string;
  venue_type?: VenueType;
  venue_url?: string;
  venue_location?: string; // JSON
  role?: string;
  room?: string;
  status: AffiliationStatus;
  start_date?: string;
  end_date?: string;
  recurrence_pattern?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface Album extends Models.Document {
  profile_id: string;
  title: string;
  slug?: string;
  description?: string;
  cover_image?: string; // JSON
  album_type?: AlbumType;
  visibility?: Visibility;
  approved_user_ids?: string; // JSON
  password_hint?: string;
  password_protected?: boolean;
  allow_download?: boolean;
  allow_comments?: boolean;
  allow_reactions?: boolean;
  is_pinned?: boolean;
  sort_order?: number;
  item_count?: number;
  view_count?: number;
  like_count?: number;
}

export interface MediaItem extends Models.Document {
  profile_id: string;
  album_id?: string;
  url: string;
  media_type: MediaType;
  thumbnail_url?: string;
  blurhash?: string;
  width?: number;
  height?: number;
  duration_seconds?: number;
  file_size_bytes?: number;
  alt_text?: string;
  caption?: string;
  is_primary?: boolean;
  is_verified?: boolean;
  is_nsfw?: boolean;
  nsfw_level?: NsfwLevel;
  visibility?: Visibility;
  watermarked?: boolean;
  tags?: string; // JSON
  storage_file_id?: string;
}

export interface FeedPost extends Models.Document {
  profile_id: string;
  post_type: FeedPostType;
  text?: string;
  media?: string; // JSON
  link_url?: string;
  link_preview?: string; // JSON
  poll?: string; // JSON
  tags?: string; // JSON
  location_tag?: string;
  visibility?: Visibility;
  is_pinned?: boolean;
  comments_enabled?: boolean;
  reactions_enabled?: boolean;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
  scheduled_at?: string;
  expires_at?: string;
}

export interface Story extends Models.Document {
  profile_id: string;
  media?: string; // JSON
  text_overlay?: string;
  link_url?: string;
  visibility?: Visibility;
  view_count?: number;
  expires_at?: string;
  is_highlight?: boolean;
  highlight_group?: string;
}

export interface Review extends Models.Document {
  profile_id: string;
  reviewer_id: string;
  rating: number;
  text?: string;
  is_anonymous?: boolean;
  is_verified?: boolean;
  status: ReviewStatus;
}

export interface Venue extends Models.Document {
  name: string;
  slug?: string;
  venue_type: VenueType;
  description?: string;
  location: string; // JSON
  contact?: string; // JSON
  amenities?: string; // JSON
  opening_hours?: string; // JSON
  media?: string; // JSON
  social_links?: string; // JSON
  website?: string;
  owner_id: string;
  status: ProfileStatus;
}

export interface ImportJob extends Models.Document {
  source_url: string;
  source_site?: string;
  job_type: "single_profile" | "site_crawl";
  status: ImportJobStatus;
  discovered_urls_fid?: string;
  raw_data_fid?: string;
  mapped_profile_fid?: string;
  ai_rewrite_fid?: string;
  target_profile_id?: string;
  error_message?: string;
  created_by: string;
  progress_pct?: number;
}

export interface AuditLogEntry extends Models.Document {
  actor_id: string;
  actor_email?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: string; // JSON
  ip_address?: string;
}
