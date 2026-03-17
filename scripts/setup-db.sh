#!/usr/bin/env bash
# ============================================================
# fckinc — Appwrite database bootstrap (v2)
#
# CONSTRAINT: Appwrite uses utf8mb4 → 4 bytes per char.
# Max row size = 65535 bytes → ~16383 chars budget per
# collection across ALL string/enum attributes.
#
# Requires: appwrite CLI configured (endpoint + project + key)
# ============================================================
set -euo pipefail
DB="fckinc"
AW="/opt/homebrew/bin/appwrite"
DELAY=0.3  # throttle to avoid race conditions

col_str()  { $AW databases create-string-attribute  --database-id "$DB" --collection-id "$1" --key "$2" --size "$3" --required "$4" 2>&1; sleep $DELAY; }
col_int()  { $AW databases create-integer-attribute  --database-id "$DB" --collection-id "$1" --key "$2" --required "$3" 2>&1; sleep $DELAY; }
col_flt()  { $AW databases create-float-attribute    --database-id "$DB" --collection-id "$1" --key "$2" --required "$3" 2>&1; sleep $DELAY; }
col_bool() { $AW databases create-boolean-attribute  --database-id "$DB" --collection-id "$1" --key "$2" --required "$3" 2>&1; sleep $DELAY; }
col_dt()   { $AW databases create-datetime-attribute --database-id "$DB" --collection-id "$1" --key "$2" --required "$3" 2>&1; sleep $DELAY; }
col_enum() {
  local cid="$1" key="$2" required="$3"; shift 3
  $AW databases create-enum-attribute --database-id "$DB" --collection-id "$cid" --key "$key" --required "$required" --elements "$@" 2>&1; sleep $DELAY
}
idx() {
  local cid="$1" key="$2" type="$3"; shift 3
  $AW databases create-index --database-id "$DB" --collection-id "$cid" --key "$key" --type "$type" --attributes "$@" 2>&1; sleep $DELAY
}
coll() {
  echo ""; echo "▶ $2  (id: $1)"
  $AW databases create-collection --database-id "$DB" --collection-id "$1" --name "$2" --document-security true --permissions 'read("any")' 2>&1
  sleep 0.5
}

echo "=== fckinc database setup (v2) ==="

# ============================================================
# 1. PROFILES
#    Char budget: 128+128+200+4000+32+2000+500+800+500+800
#      +1000+500+500+400+500+400+400+36+5+13+9+64+3 = 12,418
#    Bytes: ~49,672 of 65,535 ✓
# ============================================================
coll "profiles" "Profiles"
col_str  profiles display_name     128   true
col_str  profiles slug             128   false
col_str  profiles tagline          200   false
col_str  profiles about            4000  false
col_enum profiles profile_type     true  independent agency_member club_resident studio_member
col_str  profiles tier             32    false
col_enum profiles status           true  draft published suspended archived
col_str  profiles personal         2000  false   # JSON: physical attrs, personality
col_str  profiles languages        500   false   # JSON: [{code,level}]
col_str  profiles location         800   false   # JSON: {city,region,country,coords}
col_str  profiles travel           500   false   # JSON: travel regions/prefs
col_str  profiles availability     800   false   # JSON: weekly schedule
col_str  profiles pricing          1000  false   # JSON: base rate matrix
col_str  profiles contact          500   false   # JSON: phone, email, messaging
col_str  profiles social_links     500   false   # JSON: social profiles
col_str  profiles amenities        400   false   # JSON: amenity list
col_str  profiles verification     500   false   # JSON: verification status
col_str  profiles reviews_summary  400   false   # JSON: aggregated stats
col_str  profiles settings         400   false   # JSON: display/privacy
col_str  profiles owner_id         36    true
col_str  profiles locale           5     false
col_str  profiles location_city    64    false   # denormalized for filtering
col_str  profiles location_country 3     false   # ISO 3166-1 alpha-3
col_int  profiles view_count       false
col_int  profiles favorite_count   false
col_int  profiles follower_count   false
col_dt   profiles last_seen_at     false

echo "  indexes..."
idx profiles idx_slug         unique   slug
idx profiles idx_status       key      status
idx profiles idx_owner        key      owner_id
idx profiles idx_type         key      profile_type
idx profiles idx_city         key      location_city
idx profiles idx_country      key      location_country
idx profiles idx_name         fulltext display_name

# ============================================================
# 2. PROFILE SERVICES (normalized — one doc per service)
#    Char budget: 36+64+64+128+13+2000+500 = 2,805 → ~11,220 ✓
# ============================================================
coll "profile_services" "Profile Services"
col_str  profile_services profile_id    36    true
col_str  profile_services service_key   64    true    # e.g. "gfe"
col_str  profile_services category      64    false   # e.g. "companionship"
col_str  profile_services display_name  128   false
col_enum profile_services availability  true  included extra on_request not_offered
col_str  profile_services pricing_tiers 2000  false   # JSON: [{duration,price,currency}]
col_str  profile_services notes         500   false

echo "  indexes..."
idx profile_services idx_ps_profile  key profile_id
idx profile_services idx_ps_svckey   key service_key
idx profile_services idx_ps_cat      key category
idx profile_services idx_ps_avail    key profile_id availability

# ============================================================
# 3. PROFILE REVISIONS
#    Char budget: 36+36+10000 = 10,072 → ~40,288
#    snapshot at 5000 keeps it safe: 15,072 → ~60,288 ✓
# ============================================================
coll "profile_revisions" "Profile Revisions"
col_str  profile_revisions profile_id       36    true
col_int  profile_revisions revision_number  true
col_str  profile_revisions changed_by       36    true
col_dt   profile_revisions changed_at       true
col_str  profile_revisions diff_summary     2000  false
col_str  profile_revisions snapshot_file_id 36    false  # stored in Appwrite Storage
col_str  profile_revisions snapshot_summary 2000  false  # brief human-readable diff

echo "  indexes..."
idx profile_revisions idx_rev_profile key profile_id
idx profile_revisions idx_rev_number  key profile_id revision_number

# ============================================================
# 4. TRANSLATIONS
#    Char budget: 36+10+8000+36+9 = 8,091 → ~32,364 ✓
# ============================================================
coll "translations" "Translations"
col_str  translations profile_id      36    true
col_str  translations locale          10    true
col_str  translations fields          8000  true    # JSON: translated text fields
col_enum translations status          true  draft auto approved
col_int  translations source_revision false
col_str  translations translated_by   36    false
col_dt   translations translated_at   false

echo "  indexes..."
idx translations idx_t_profile key profile_id
idx translations idx_t_locale  key profile_id locale

# ============================================================
# 5. AFFILIATIONS
#    Char budget: 36+36+128+13+512+800+64+32+9+10+10+255+36+500
#      = 2,441 → ~9,764 ✓
# ============================================================
coll "affiliations" "Affiliations"
col_str  affiliations profile_id         36   true
col_str  affiliations venue_id           36   false
col_str  affiliations venue_name         128  true
col_enum affiliations venue_type         false agency club studio private_house sauna_club bar hotel other
col_str  affiliations venue_url          512  false
col_str  affiliations venue_location     800  false   # JSON: {city,region,country}
col_str  affiliations role               64   false
col_str  affiliations room               32   false
col_enum affiliations status             true current upcoming past recurring
col_str  affiliations start_date         10   false
col_str  affiliations end_date           10   false
col_str  affiliations recurrence_pattern 255  false
col_bool affiliations is_primary         false
col_str  affiliations notes              500  false

echo "  indexes..."
idx affiliations idx_a_profile key profile_id
idx affiliations idx_a_status  key profile_id status

# ============================================================
# 6. ALBUMS
#    Char budget: 36+100+100+500+800+11+7+2000+255+36 = 3,845
#      → ~15,380 ✓ (plus bools/ints are fine)
# ============================================================
coll "albums" "Albums"
col_str  albums profile_id         36   true
col_str  albums title              100  true
col_str  albums slug               100  false
col_str  albums description        500  false
col_str  albums cover_image        800  false   # JSON: media_item ref
col_enum albums album_type         false portfolio selfies professional_shoot lifestyle venue outfits travel behind_the_scenes events before_after custom
col_enum albums visibility         false public logged_in followers subscribers verified_clients approved_list link_only private
col_str  albums approved_user_ids  2000 false   # JSON: UUID array
col_str  albums password_hint      255  false
col_bool albums password_protected false
col_bool albums allow_download     false
col_bool albums allow_comments     false
col_bool albums allow_reactions    false
col_bool albums is_pinned          false
col_int  albums sort_order         false
col_int  albums item_count         false
col_int  albums view_count         false
col_int  albums like_count         false

echo "  indexes..."
idx albums idx_al_profile key profile_id

# ============================================================
# 7. MEDIA ITEMS
#    Char budget: 36+36+512+5+512+64+500+500+4+7+36
#      = 2,212 → ~8,848 ✓ (plus bools/ints/floats)
# ============================================================
coll "media_items" "Media Items"
col_str  media_items profile_id      36   true
col_str  media_items album_id        36   false
col_str  media_items url             512  true
col_enum media_items media_type      true  photo video gif audio
col_str  media_items thumbnail_url   512  false
col_str  media_items blurhash        64   false
col_int  media_items width           false
col_int  media_items height          false
col_flt  media_items duration_seconds false
col_int  media_items file_size_bytes false
col_str  media_items alt_text        500  false
col_str  media_items caption         500  false
col_bool media_items is_primary      false
col_bool media_items is_verified     false
col_bool media_items is_nsfw         false
col_enum media_items nsfw_level      false sfw suggestive nsfw_soft nsfw_explicit
col_enum media_items visibility      false public logged_in followers subscribers verified_clients approved_list link_only private
col_bool media_items watermarked     false
col_str  media_items tags            500  false   # JSON array
col_str  media_items storage_file_id 36   false

echo "  indexes..."
idx media_items idx_mi_profile key profile_id
idx media_items idx_mi_album   key album_id

# ============================================================
# 8. FEED POSTS
#    Char budget: 36+11+4000+4000+512+800+1000+500+128+7
#      = 10,994 → ~43,976 ✓
# ============================================================
coll "feed_posts" "Feed Posts"
col_str  feed_posts profile_id       36   true
col_enum feed_posts post_type        true status photo video gallery announcement promo availability_update new_album poll repost review_highlight
col_str  feed_posts text             4000 false
col_str  feed_posts media            4000 false   # JSON: media_item array
col_str  feed_posts link_url         512  false
col_str  feed_posts link_preview     800  false   # JSON
col_str  feed_posts poll             1000 false   # JSON
col_str  feed_posts tags             500  false   # JSON array
col_str  feed_posts location_tag     128  false
col_enum feed_posts visibility       false public logged_in followers subscribers verified_clients approved_list link_only private
col_bool feed_posts is_pinned        false
col_bool feed_posts comments_enabled false
col_bool feed_posts reactions_enabled false
col_int  feed_posts like_count       false
col_int  feed_posts comment_count    false
col_int  feed_posts share_count      false
col_int  feed_posts view_count       false
col_dt   feed_posts scheduled_at     false
col_dt   feed_posts expires_at       false

echo "  indexes..."
idx feed_posts idx_fp_profile key profile_id
idx feed_posts idx_fp_type    key profile_id post_type

# ============================================================
# 9. STORIES
#    Char budget: 36+800+200+512+7+64 = 1,619 → ~6,476 ✓
# ============================================================
coll "stories" "Stories"
col_str  stories profile_id      36   true
col_str  stories media           800  false   # JSON: media_item
col_str  stories text_overlay    200  false
col_str  stories link_url        512  false
col_enum stories visibility      false public logged_in followers subscribers verified_clients approved_list link_only private
col_int  stories view_count      false
col_dt   stories expires_at      false
col_bool stories is_highlight    false
col_str  stories highlight_group 64   false

echo "  indexes..."
idx stories idx_st_profile key profile_id

# ============================================================
# 10. REVIEWS
#    Char budget: 36+36+3000 = 3,072 → ~12,288 ✓
# ============================================================
coll "reviews" "Reviews"
col_str  reviews profile_id   36   true
col_str  reviews reviewer_id  36   true
col_flt  reviews rating       true
col_str  reviews text         3000 false
col_bool reviews is_anonymous false
col_bool reviews is_verified  false
col_enum reviews status       true pending published hidden reported

echo "  indexes..."
idx reviews idx_rv_profile key profile_id
idx reviews idx_rv_status  key profile_id status

# ============================================================
# 11. VENUES
#    Char budget: 128+128+13+3000+800+800+500+1000+1500+500
#      +512+36+9 = 8,926 → ~35,704 ✓
# ============================================================
coll "venues" "Venues"
col_str  venues name           128  true
col_str  venues slug           128  false
col_enum venues venue_type     true agency club studio private_house sauna_club bar hotel other
col_str  venues description    3000 false
col_str  venues location       800  true    # JSON
col_str  venues contact        800  false   # JSON
col_str  venues amenities      500  false   # JSON array
col_str  venues opening_hours  1000 false   # JSON
col_str  venues media          1500 false   # JSON: media_item refs
col_str  venues social_links   500  false   # JSON array
col_str  venues website        512  false
col_str  venues owner_id       36   true
col_enum venues status         true draft published suspended archived

echo "  indexes..."
idx venues idx_v_slug   unique  slug
idx venues idx_v_type   key     venue_type
idx venues idx_v_name   fulltext name
idx venues idx_v_status key     status

# ============================================================
# 12. IMPORT JOBS
#    Large data (raw, mapped, rewrite) stored in Storage files.
#    Char budget: 512+256+14+10+36+2000+36+36 = 2,900
#      → ~11,600 ✓
# ============================================================
coll "import_jobs" "Import Jobs"
col_str  import_jobs source_url          512  true
col_str  import_jobs source_site         256  false
col_enum import_jobs job_type            true single_profile site_crawl
col_enum import_jobs status              true queued mapping extracting rewriting review imported failed cancelled
col_str  import_jobs discovered_urls_fid 36   false  # Storage file: JSON array of URLs
col_str  import_jobs raw_data_fid        36   false  # Storage file: raw extracted data
col_str  import_jobs mapped_profile_fid  36   false  # Storage file: normalized data
col_str  import_jobs ai_rewrite_fid      36   false  # Storage file: AI-rewritten version
col_str  import_jobs target_profile_id   36   false
col_str  import_jobs error_message       2000 false
col_str  import_jobs created_by          36   true
col_int  import_jobs progress_pct        false

echo "  indexes..."
idx import_jobs idx_ij_status  key status
idx import_jobs idx_ij_creator key created_by

# ============================================================
# 13. AUDIT LOG
#    Char budget: 36+255+22+32+36+3000+45 = 3,426 → ~13,704 ✓
# ============================================================
coll "audit_log" "Audit Log"
col_str  audit_log actor_id      36   true
col_str  audit_log actor_email   255  false
col_enum audit_log action        true profile.create profile.update profile.delete profile.publish profile.suspend translation.create translation.update translation.approve import.start import.approve import.cancel review.publish review.hide media.upload media.delete album.create album.delete venue.create venue.update feed.create feed.delete settings.update
col_str  audit_log resource_type 32   true
col_str  audit_log resource_id   36   true
col_str  audit_log details       3000 false   # JSON: extra context
col_str  audit_log ip_address    45   false

echo "  indexes..."
idx audit_log idx_au_actor    key actor_id
idx audit_log idx_au_resource key resource_type resource_id

echo ""
echo "=== Setup complete: 13 collections ==="
