"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createProfile, setProfileServices } from "@/services/profiles";
import { SERVICE_CATALOG } from "@/lib/service-catalog";
import type { ProfileType, ServiceAvailability } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
const STEPS = ["Basics", "Personal", "Location & Contact", "Services"] as const;

const AVAIL_OPTIONS: Array<{ value: ServiceAvailability; label: string }> = [
  { value: "included", label: "Included" },
  { value: "extra", label: "Extra" },
  { value: "on_request", label: "On request" },
  { value: "not_offered", label: "Not offered" },
];

export default function NewProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  // Step 1: basic

  const [name, setName] = useState("");
  const [type, setType] = useState<ProfileType>("independent");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");

  // Step 2: personal
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [nationality, setNationality] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");

  // Step 3: location + contact
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");

  // Step 4: services
  const [svcMap, setSvcMap] = useState<Record<string, ServiceAvailability>>({});

  const selectedServices = Object.entries(svcMap).filter(
    ([, availability]) => availability !== "not_offered"
  ).length;

  const canContinue = step !== 0 || name.trim().length > 0;

  function nextStep() {
    if (!canContinue) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const personal: Record<string, unknown> = {};
      if (age) personal.age = Number(age);
      if (gender) personal.gender = gender;
      if (nationality) personal.nationality = nationality;
      if (bodyType) personal.body_type = bodyType;
      if (heightCm) personal.height_cm = Number(heightCm);
      if (weightKg) personal.weight_kg = Number(weightKg);

      const location =
        city || region || country
          ? {
              city: city || undefined,
              region: region || undefined,
              country: country || undefined,
            }
          : undefined;

      const contact =
        phone || email || telegram || whatsapp || website
          ? {
              phone: phone || undefined,
              email: email || undefined,
              telegram: telegram || undefined,
              whatsapp: whatsapp || undefined,
              website: website || undefined,
            }
          : undefined;
      const profile = await createProfile({
        display_name: name,
        profile_type: type,
        owner_id: user.$id,
        slug: slug || undefined,
        tagline: tagline || undefined,
        about: about || undefined,
        personal: Object.keys(personal).length > 0 ? personal : undefined,
        location,
        contact,
      });

      const svcEntries = Object.entries(svcMap)
        .filter(([, availability]) => availability !== "not_offered")
        .map(([service_key, availability]) => {
          const category = SERVICE_CATALOG.find((c) =>
            c.services.some((s) => s.key === service_key)
          );
          const serviceDef = category?.services.find((s) => s.key === service_key);
          return {
            service_key,
            category: category?.key,
            display_name: serviceDef?.label,
            availability,
          };
        });

      if (svcEntries.length > 0) {
        await setProfileServices(profile.$id, svcEntries);
      }
      toast.success("Profile created");
      router.push(`/profiles/${profile.$id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">Create New Profile</h2>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push("/profiles")}>
          Back to profiles
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((title, idx) => (
          <button
            key={title}
            type="button"
            onClick={() => setStep(idx)}
            className={`rounded-md border px-3 py-2 text-left text-xs transition-colors ${
              idx === step
                ? "border-foreground/15 bg-muted text-foreground ring-1 ring-border/60"
                : "border-border text-muted-foreground hover:bg-muted/40"
            }`}
          >
            <span className="font-heading block font-medium">{idx + 1}. {title}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-5">
            {step === 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sophia"
                      required
                    />
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
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. sophia-zurich"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Short intro..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="Longer profile description..."
                    rows={5}
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender">Gender</Label>
                    <Input id="gender" value={gender} onChange={(e) => setGender(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bodyType">Body Type</Label>
                    <Input id="bodyType" value={bodyType} onChange={(e) => setBodyType(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input id="height" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input id="weight" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Zurich" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="region">Region / Canton</Label>
                    <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="ZH" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="CH" maxLength={3} />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="telegram">Telegram</Label>
                    <Input id="telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Select services and their availability.</p>
                  <Badge variant="outline">{selectedServices} selected</Badge>
                </div>
                {SERVICE_CATALOG.map((cat) => (
                  <Card key={cat.key} size="sm" className="py-2">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-sm">{cat.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
                        {cat.services.map((svc) => (
                          <div key={svc.key} className="flex items-center justify-between gap-3 border-b border-dashed border-border/70 py-1.5 last:border-b-0">
                            <span className="text-sm">{svc.label}</span>
                            <Select
                              value={svcMap[svc.key] ?? "not_offered"}
                              onValueChange={(v) =>
                                v && setSvcMap((m) => ({ ...m, [svc.key]: v as ServiceAvailability }))
                              }
                            >
                              <SelectTrigger className="w-28 h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AVAIL_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={prevStep} disabled={step === 0 || saving} className="flex-1 sm:flex-none">
                  Back
                </Button>
                {step < STEPS.length - 1 && (
                  <Button type="button" onClick={nextStep} disabled={!canContinue || saving} className="flex-1 sm:flex-none">
                    Continue
                  </Button>
                )}
              </div>
              {step === STEPS.length - 1 && (
                <Button type="submit" disabled={saving || !name} className="w-full sm:w-auto">
                  {saving ? "Creating…" : "Create Profile"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
