"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getProfile,
  updateProfile,
  getProfileServices,
  setProfileServices,
  parseJson,
  deleteProfile,
} from "@/services/profiles";
import type {
  Profile,
  ProfileService,
  PersonalInfo,
  LocationInfo,
  PricingInfo,
  ContactInfo,
  AvailabilitySchedule,
} from "@/types/models";
import { SERVICE_CATALOG } from "@/lib/service-catalog";
import type { ServiceAvailability } from "@/types/models";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// ---- Field helper ----
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ---- Availability badge colors ----
const AVAIL_STYLES: Record<string, string> = {
  included: "bg-green-50 text-green-700 border-green-200",
  extra: "bg-blue-50 text-blue-700 border-blue-200",
  on_request: "bg-amber-50 text-amber-700 border-amber-200",
  not_offered: "bg-neutral-50 text-neutral-400 border-neutral-200",
};
const AVAIL_OPTIONS: { value: ServiceAvailability; label: string }[] = [
  { value: "included", label: "Included" },
  { value: "extra", label: "Extra" },
  { value: "on_request", label: "On Request" },
  { value: "not_offered", label: "Not Offered" },
];

export default function ProfileEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [services, setServices] = useState<ProfileService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state — general
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [status, setStatus] = useState("draft");
  const [profileType, setProfileType] = useState("independent");

  // Form state — personal
  const [personal, setPersonal] = useState<PersonalInfo>({});

  // Form state — location
  const [location, setLocation] = useState<LocationInfo>({});

  // Form state — pricing
  const [pricing, setPricing] = useState<PricingInfo>({});

  // Form state — contact
  const [contact, setContact] = useState<ContactInfo>({});

  // Form state — availability
  const [availability, setAvailability] = useState<AvailabilitySchedule>({});

  // Service state
  const [svcMap, setSvcMap] = useState<Record<string, ServiceAvailability>>({});

  const loadProfile = useCallback(async () => {
    try {
      const [p, svcResult] = await Promise.all([
        getProfile(id),
        getProfileServices(id),
      ]);
      setProfile(p);
      setDisplayName(p.display_name);
      setSlug(p.slug ?? "");
      setTagline(p.tagline ?? "");
      setAbout(p.about ?? "");
      setStatus(p.status);
      setProfileType(p.profile_type);
      setPersonal(parseJson<PersonalInfo>(p.personal) ?? {});
      setLocation(parseJson<LocationInfo>(p.location) ?? {});
      setPricing(parseJson<PricingInfo>(p.pricing) ?? {});
      setContact(parseJson<ContactInfo>(p.contact) ?? {});
      setAvailability(parseJson<AvailabilitySchedule>(p.availability) ?? {});

      setServices(svcResult.documents);
      const map: Record<string, ServiceAvailability> = {};
      svcResult.documents.forEach((s) => {
        map[s.service_key] = s.availability;
      });
      setSvcMap(map);
    } catch (err) {
      toast.error("Failed to load profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave() {
    if (!user || !profile) return;
    setSaving(true);
    try {
      await updateProfile(
        id,
        {
          display_name: displayName,
          slug: slug || undefined,
          tagline: tagline || undefined,
          about: about || undefined,
          status: status as Profile["status"],
          profile_type: profileType as Profile["profile_type"],
          personal,
          location,
          pricing,
          contact,
          availability,
        },
        user.$id
      );

      // Save services
      const svcEntries = Object.entries(svcMap)
        .filter(([, avail]) => avail !== "not_offered")
        .map(([key, avail]) => {
          const cat = SERVICE_CATALOG.find((c) => c.services.some((s) => s.key === key));
          const svcDef = cat?.services.find((s) => s.key === key);
          return {
            service_key: key,
            category: cat?.key,
            display_name: svcDef?.label,
            availability: avail,
          };
        });
      await setProfileServices(id, svcEntries);

      toast.success("Saved");
      await loadProfile();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteProfile(id);
      toast.success("Profile deleted");
      router.push("/profiles");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-muted-foreground">Profile not found.</p>;
  }

  const activeServiceCount = Object.values(svcMap).filter((v) => v !== "not_offered").length;

  return (
    <div className="max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-semibold">{profile.display_name}</h2>
          <p className="text-sm text-muted-foreground">
            {profile.profile_type.replace(/_/g, " ")} &middot; {profile.location_city ?? "No city"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
            {saving ? "Saving…" : "Save"}
          </Button>
          <Badge variant="outline" className="h-9 px-3 flex items-center">
            {status}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="services">
            Services{activeServiceCount > 0 && ` (${activeServiceCount})`}
          </TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        {/* ---- GENERAL ---- */}
        <TabsContent value="general" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Display Name">
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                </Field>
                <Field label="Slug" hint="URL-friendly identifier">
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. sophia-zh" />
                </Field>
              </div>
              <Field label="Tagline">
                <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Short introduction..." />
              </Field>
              <Field label="About">
                <Textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={6}
                  placeholder="Profile description..."
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Status">
                  <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Profile Type">
                  <Select value={profileType} onValueChange={(v) => v && setProfileType(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="agency_member">Agency Member</SelectItem>
                      <SelectItem value="club_resident">Club Resident</SelectItem>
                      <SelectItem value="studio_member">Studio Member</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-red-200">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Delete this profile</p>
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
              <Dialog>
                <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                  Delete
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete &quot;{profile.display_name}&quot;?</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete the profile and all associated data.
                  </p>
                  <DialogFooter>
                    <DialogClose render={<Button variant="ghost" />}>
                      Cancel
                    </DialogClose>
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- PERSONAL ---- */}
        <TabsContent value="personal" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Physical Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Age">
                  <Input type="number" value={personal.age ?? ""} onChange={(e) => setPersonal({ ...personal, age: e.target.value ? Number(e.target.value) : undefined })} />
                </Field>
                <Field label="Height (cm)">
                  <Input type="number" value={personal.height_cm ?? ""} onChange={(e) => setPersonal({ ...personal, height_cm: e.target.value ? Number(e.target.value) : undefined })} />
                </Field>
                <Field label="Weight (kg)">
                  <Input type="number" value={personal.weight_kg ?? ""} onChange={(e) => setPersonal({ ...personal, weight_kg: e.target.value ? Number(e.target.value) : undefined })} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Gender">
                  <Input value={personal.gender ?? ""} onChange={(e) => setPersonal({ ...personal, gender: e.target.value })} placeholder="e.g. female" />
                </Field>
                <Field label="Ethnicity">
                  <Input value={personal.ethnicity ?? ""} onChange={(e) => setPersonal({ ...personal, ethnicity: e.target.value })} placeholder="e.g. european" />
                </Field>
                <Field label="Nationality">
                  <Input value={personal.nationality ?? ""} onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })} placeholder="e.g. swiss" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Body Type">
                  <Input value={personal.body_type ?? ""} onChange={(e) => setPersonal({ ...personal, body_type: e.target.value })} placeholder="e.g. slim" />
                </Field>
                <Field label="Bust Size">
                  <Input value={personal.bust_size ?? ""} onChange={(e) => setPersonal({ ...personal, bust_size: e.target.value })} placeholder="e.g. C" />
                </Field>
                <Field label="Orientation">
                  <Input value={personal.orientation ?? ""} onChange={(e) => setPersonal({ ...personal, orientation: e.target.value })} placeholder="e.g. bisexual" />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Hair Color">
                  <Input value={personal.hair_color ?? ""} onChange={(e) => setPersonal({ ...personal, hair_color: e.target.value })} />
                </Field>
                <Field label="Hair Length">
                  <Input value={personal.hair_length ?? ""} onChange={(e) => setPersonal({ ...personal, hair_length: e.target.value })} />
                </Field>
                <Field label="Eye Color">
                  <Input value={personal.eye_color ?? ""} onChange={(e) => setPersonal({ ...personal, eye_color: e.target.value })} />
                </Field>
                <Field label="Skin Tone">
                  <Input value={personal.skin_tone ?? ""} onChange={(e) => setPersonal({ ...personal, skin_tone: e.target.value })} />
                </Field>
                <Field label="Tattoos">
                  <Input value={personal.tattoos ?? ""} onChange={(e) => setPersonal({ ...personal, tattoos: e.target.value })} placeholder="none / some / many" />
                </Field>
                <Field label="Piercings">
                  <Input value={personal.piercings ?? ""} onChange={(e) => setPersonal({ ...personal, piercings: e.target.value })} placeholder="none / some / many" />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- SERVICES ---- */}
        <TabsContent value="services" className="space-y-4 pt-4">
          {SERVICE_CATALOG.map((cat) => (
            <Card key={cat.key}>
              <CardHeader>
                <CardTitle className="text-base">{cat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {cat.services.map((svc) => {
                    const current = svcMap[svc.key] ?? "not_offered";
                    return (
                      <div key={svc.key} className="flex items-center justify-between py-1.5 border-b border-dashed border-border/50 last:border-0">
                        <span className="text-sm">{svc.label}</span>
                        <Select
                          value={current}
                          onValueChange={(v) => v && setSvcMap({ ...svcMap, [svc.key]: v as ServiceAvailability })}
                        >
                          <SelectTrigger className="w-28 h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAIL_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  opt.value === "included" ? "bg-green-500" :
                                  opt.value === "extra" ? "bg-blue-500" :
                                  opt.value === "on_request" ? "bg-amber-500" : "bg-neutral-300"
                                }`} />
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ---- PRICING ---- */}
        <TabsContent value="pricing" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Base Rates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Currency">
                <Input
                  value={pricing.currency ?? ""}
                  onChange={(e) => setPricing({ ...pricing, currency: e.target.value })}
                  placeholder="e.g. CHF"
                  className="max-w-24"
                />
              </Field>
              <Field label="Payment Methods" hint="Comma-separated">
                <Input
                  value={pricing.payment_methods?.join(", ") ?? ""}
                  onChange={(e) => setPricing({ ...pricing, payment_methods: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  placeholder="e.g. cash, twint, bank transfer"
                />
              </Field>
              <Field label="Notes">
                <Textarea
                  value={pricing.notes ?? ""}
                  onChange={(e) => setPricing({ ...pricing, notes: e.target.value })}
                  rows={2}
                  placeholder="e.g. deposit required for outcalls..."
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Availability Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="General Hours">
                <Input
                  value={availability.general_hours ?? ""}
                  onChange={(e) => setAvailability({ ...availability, general_hours: e.target.value })}
                  placeholder="e.g. 10:00 – 22:00"
                />
              </Field>
              <Field label="Notes">
                <Textarea
                  value={availability.notes ?? ""}
                  onChange={(e) => setAvailability({ ...availability, notes: e.target.value })}
                  rows={2}
                  placeholder="e.g. available for outcalls evenings only..."
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- LOCATION ---- */}
        <TabsContent value="location" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="City">
                  <Input value={location.city ?? ""} onChange={(e) => setLocation({ ...location, city: e.target.value })} />
                </Field>
                <Field label="Region / Canton">
                  <Input value={location.region ?? ""} onChange={(e) => setLocation({ ...location, region: e.target.value })} />
                </Field>
                <Field label="Country">
                  <Input value={location.country ?? ""} onChange={(e) => setLocation({ ...location, country: e.target.value })} placeholder="e.g. CH" />
                </Field>
                <Field label="Postal Code">
                  <Input value={location.postal_code ?? ""} onChange={(e) => setLocation({ ...location, postal_code: e.target.value })} />
                </Field>
                <Field label="Neighborhood">
                  <Input value={location.neighborhood ?? ""} onChange={(e) => setLocation({ ...location, neighborhood: e.target.value })} />
                </Field>
                <Field label="Timezone">
                  <Input value={location.timezone ?? ""} onChange={(e) => setLocation({ ...location, timezone: e.target.value })} placeholder="e.g. Europe/Zurich" />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- CONTACT ---- */}
        <TabsContent value="contact" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone">
                  <Input value={contact.phone ?? ""} onChange={(e) => setContact({ ...contact, phone: e.target.value })} type="tel" />
                </Field>
                <Field label="Email">
                  <Input value={contact.email ?? ""} onChange={(e) => setContact({ ...contact, email: e.target.value })} type="email" />
                </Field>
                <Field label="WhatsApp">
                  <Input value={contact.whatsapp ?? ""} onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })} />
                </Field>
                <Field label="Telegram">
                  <Input value={contact.telegram ?? ""} onChange={(e) => setContact({ ...contact, telegram: e.target.value })} />
                </Field>
                <Field label="Signal">
                  <Input value={contact.signal ?? ""} onChange={(e) => setContact({ ...contact, signal: e.target.value })} />
                </Field>
                <Field label="Website">
                  <Input value={contact.website ?? ""} onChange={(e) => setContact({ ...contact, website: e.target.value })} type="url" placeholder="https://..." />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
