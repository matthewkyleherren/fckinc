"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createProfile, setProfileServices } from "@/services/profiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSeed() {
    if (!user) return;
    setRunning(true);
    setResult(null);

    try {
      const profile = await createProfile({
        display_name: "Valentina",
        slug: "valentina-zurich",
        tagline: "Elegant & refined companion — your escape from the ordinary",
        about: `Welcome to my world. I'm Valentina, an independent companion offering unforgettable moments in the heart of Zurich. Born in Milan, raised between Rome and Geneva, I bring a natural warmth and sophistication to every encounter.

I hold a degree in Art History and speak four languages fluently. Whether it's a candlelit dinner at Kronenhalle, a weekend getaway to St. Moritz, or a quiet evening behind closed doors, I pride myself on creating genuine connections.

I maintain a discreet, upscale apartment in Zurich's Seefeld district with a view of the lake. Outcalls to 5-star hotels are also available with advance notice.

I am selective about my clients and value quality over quantity. Please reach out with a brief introduction — I look forward to hearing from you.`,
        profile_type: "independent",
        status: "published",
        owner_id: user.$id,
        personal: {
          age: 27,
          gender: "female",
          ethnicity: "european",
          nationality: "italian",
          height_cm: 172,
          weight_kg: 56,
          body_type: "slim",
          bust_size: "C",
          hair_color: "dark brown",
          hair_length: "long",
          eye_color: "green",
          skin_tone: "olive",
          tattoos: "none",
          piercings: "ears only",
          orientation: "bisexual",
          personality_tags: ["elegant", "witty", "adventurous", "affectionate"],
        },
        languages: [
          { code: "it", level: "native" },
          { code: "en", level: "fluent" },
          { code: "fr", level: "fluent" },
          { code: "de", level: "conversational" },
        ],
        location: {
          city: "Zurich",
          region: "ZH",
          country: "CH",
          postal_code: "8008",
          neighborhood: "Seefeld",
          timezone: "Europe/Zurich",
        },
        pricing: {
          currency: "CHF",
          base_rates: [
            { duration: "1 hour", price: 500, currency: "CHF", type: "incall" },
            { duration: "2 hours", price: 900, currency: "CHF", type: "incall" },
            { duration: "dinner date (3h)", price: 1400, currency: "CHF", type: "outcall" },
            { duration: "overnight", price: 3500, currency: "CHF", type: "incall" },
          ],
          deposit_required: true,
          payment_methods: ["cash", "twint", "bank transfer"],
          notes: "Deposit of 20% required for first meeting. Outcalls to 5-star hotels add CHF 100.",
        },
        contact: {
          phone: "+41 78 555 12 34",
          email: "valentina@proton.me",
          whatsapp: "+41 78 555 12 34",
          telegram: "@valentina_zh",
          website: "https://valentina-zurich.ch",
        },
        availability: {
          general_hours: "10:00 – 22:00",
          by_appointment_only: true,
          advance_booking_hours: 4,
          last_minute: false,
          notes: "Available Mon–Sat. Sunday by special arrangement. Overnight bookings require 24h notice.",
        },
      });

      await setProfileServices(profile.$id, [
        { service_key: "gfe", category: "companionship", display_name: "Girlfriend Experience (GFE)", availability: "included" },
        { service_key: "dinner_date", category: "companionship", display_name: "Dinner Date", availability: "included" },
        { service_key: "travel_companion", category: "companionship", display_name: "Travel Companion", availability: "extra" },
        { service_key: "overnight", category: "companionship", display_name: "Overnight Stay", availability: "included" },
        { service_key: "oral_active", category: "sexual_services", display_name: "Oral (giving)", availability: "included" },
        { service_key: "oral_passive", category: "sexual_services", display_name: "Oral (receiving)", availability: "included" },
        { service_key: "intercourse", category: "sexual_services", display_name: "Intercourse", availability: "included" },
        { service_key: "french_kiss", category: "sexual_services", display_name: "French Kissing", availability: "included" },
        { service_key: "body_kiss", category: "sexual_services", display_name: "Body Kissing", availability: "included" },
        { service_key: "69", category: "sexual_services", display_name: "69 Position", availability: "included" },
        { service_key: "striptease", category: "sexual_services", display_name: "Striptease", availability: "included" },
        { service_key: "deep_throat", category: "sexual_services", display_name: "Deep Throat", availability: "on_request" },
        { service_key: "anal_passive", category: "sexual_services", display_name: "Anal (receiving)", availability: "on_request" },
        { service_key: "massage_erotic", category: "massage", display_name: "Erotic Massage", availability: "included" },
        { service_key: "massage_body_to_body", category: "massage", display_name: "Body-to-Body", availability: "included" },
        { service_key: "massage_tantric", category: "massage", display_name: "Tantric Massage", availability: "extra" },
        { service_key: "massage_nuru", category: "massage", display_name: "Nuru Massage", availability: "extra" },
        { service_key: "foot_fetish", category: "foot_shoe", display_name: "Foot Fetish", availability: "on_request" },
        { service_key: "costume_lingerie", category: "roleplay", display_name: "Lingerie Show", availability: "included" },
        { service_key: "rp_custom", category: "roleplay", display_name: "Custom Roleplay", availability: "on_request" },
        { service_key: "couple_friendly", category: "group_party", display_name: "Couple Friendly", availability: "on_request" },
        { service_key: "duo_escort", category: "group_party", display_name: "Duo with Colleague", availability: "extra" },
        { service_key: "shower_together", category: "extras", display_name: "Shower Together", availability: "included" },
      ]);

      setResult(`Profile created: ${profile.$id} with 23 services`);
      toast.success("Valentina profile created!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Seed failed";
      setResult(`Error: ${msg}`);
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <h2 className="font-heading text-lg font-semibold">Seed Data</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Sample Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Creates &quot;Valentina&quot; — a fully populated independent profile in Zurich with 23 services.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleSeed} disabled={running || !user}>
              {running ? "Creating..." : "Seed Valentina"}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/profiles")}>
              Back
            </Button>
          </div>
          {result && (
            <p className={`text-sm ${result.startsWith("Error") ? "text-destructive" : "text-muted-foreground"}`}>
              {result}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
