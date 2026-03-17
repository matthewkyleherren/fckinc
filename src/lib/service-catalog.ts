export interface ServiceDef {
  key: string;
  label: string;
}

export interface ServiceCategory {
  key: string;
  label: string;
  services: ServiceDef[];
}

export const SERVICE_CATALOG: ServiceCategory[] = [
  {
    key: "companionship",
    label: "Companionship",
    services: [
      { key: "gfe", label: "Girlfriend Experience (GFE)" },
      { key: "pse", label: "Porn Star Experience (PSE)" },
      { key: "dinner_date", label: "Dinner Date" },
      { key: "travel_companion", label: "Travel Companion" },
      { key: "social_events", label: "Social Events" },
      { key: "overnight", label: "Overnight Stay" },
      { key: "weekend", label: "Weekend Booking" },
      { key: "cuddle_companion", label: "Cuddle Companion" },
    ],
  },
  {
    key: "sexual_services",
    label: "Sexual Services",
    services: [
      { key: "oral_active", label: "Oral (giving)" },
      { key: "oral_passive", label: "Oral (receiving)" },
      { key: "intercourse", label: "Intercourse" },
      { key: "anal_active", label: "Anal (giving)" },
      { key: "anal_passive", label: "Anal (receiving)" },
      { key: "deep_throat", label: "Deep Throat" },
      { key: "french_kiss", label: "French Kissing" },
      { key: "body_kiss", label: "Body Kissing" },
      { key: "69", label: "69 Position" },
      { key: "cum_on_body", label: "CIM/COB" },
      { key: "facesitting", label: "Facesitting" },
      { key: "striptease", label: "Striptease" },
      { key: "handjob", label: "Handjob" },
      { key: "prostate_massage", label: "Prostate Massage" },
    ],
  },
  {
    key: "massage",
    label: "Massage & Wellness",
    services: [
      { key: "massage_classic", label: "Classic Massage" },
      { key: "massage_erotic", label: "Erotic Massage" },
      { key: "massage_tantric", label: "Tantric Massage" },
      { key: "massage_nuru", label: "Nuru Massage" },
      { key: "massage_body_to_body", label: "Body-to-Body" },
      { key: "massage_lingam", label: "Lingam Massage" },
      { key: "massage_yoni", label: "Yoni Massage" },
      { key: "massage_thai", label: "Thai Massage" },
      { key: "massage_four_hands", label: "Four Hands" },
      { key: "massage_oil", label: "Oil Massage" },
    ],
  },
  {
    key: "bdsm_fetish",
    label: "BDSM & Fetish",
    services: [
      { key: "bdsm_domination", label: "Domination" },
      { key: "bdsm_submission", label: "Submission" },
      { key: "bdsm_bondage", label: "Bondage" },
      { key: "bdsm_spanking", label: "Spanking" },
      { key: "bdsm_whipping", label: "Whipping" },
      { key: "bdsm_cbt", label: "CBT" },
      { key: "bdsm_trampling", label: "Trampling" },
      { key: "bdsm_humiliation", label: "Humiliation" },
      { key: "bdsm_wax_play", label: "Wax Play" },
      { key: "bdsm_electro", label: "Electro Play" },
      { key: "bdsm_sissy", label: "Sissy Training" },
      { key: "bdsm_chastity", label: "Chastity" },
      { key: "bdsm_strapon", label: "Strap-on" },
    ],
  },
  {
    key: "foot_shoe",
    label: "Foot & Shoe",
    services: [
      { key: "foot_fetish", label: "Foot Fetish" },
      { key: "foot_worship", label: "Foot Worship" },
      { key: "shoe_fetish", label: "Shoe/Boot Fetish" },
      { key: "trampling_feet", label: "Foot Trampling" },
      { key: "nylon_fetish", label: "Nylon/Stocking" },
    ],
  },
  {
    key: "roleplay",
    label: "Roleplay & Costumes",
    services: [
      { key: "rp_secretary", label: "Secretary" },
      { key: "rp_nurse", label: "Nurse" },
      { key: "rp_teacher", label: "Teacher" },
      { key: "rp_schoolgirl", label: "Schoolgirl" },
      { key: "rp_maid", label: "Maid" },
      { key: "rp_custom", label: "Custom Roleplay" },
      { key: "costume_latex", label: "Latex/Leather" },
      { key: "costume_lingerie", label: "Lingerie Show" },
    ],
  },
  {
    key: "golden_brown",
    label: "Golden & Brown",
    services: [
      { key: "golden_active", label: "Golden Shower (giving)" },
      { key: "golden_passive", label: "Golden Shower (receiving)" },
      { key: "ns_active", label: "NS Active" },
      { key: "ns_passive", label: "NS Passive" },
    ],
  },
  {
    key: "group_party",
    label: "Group & Party",
    services: [
      { key: "threesome_mff", label: "Threesome (MFF)" },
      { key: "threesome_mmf", label: "Threesome (MMF)" },
      { key: "gangbang", label: "Gangbang" },
      { key: "couple_friendly", label: "Couple Friendly" },
      { key: "swinger_party", label: "Swinger Party" },
      { key: "duo_escort", label: "Duo with Colleague" },
    ],
  },
  {
    key: "visual_performance",
    label: "Visual & Performance",
    services: [
      { key: "cam_show", label: "Cam Show" },
      { key: "phone_sex", label: "Phone Sex" },
      { key: "sexting", label: "Sexting" },
      { key: "custom_video", label: "Custom Videos" },
      { key: "photos_sell", label: "Photo Selling" },
      { key: "lap_dance", label: "Lap Dance" },
      { key: "pole_dance", label: "Pole Dance" },
    ],
  },
  {
    key: "extras",
    label: "Extras",
    services: [
      { key: "kamasutra", label: "Kamasutra" },
      { key: "tantric_ritual", label: "Tantric Ritual" },
      { key: "shower_together", label: "Shower Together" },
      { key: "jacuzzi", label: "Jacuzzi/Hot Tub" },
      { key: "smoking_fetish", label: "Smoking Fetish" },
      { key: "food_play", label: "Food Play" },
      { key: "girlfriend_time", label: "Just Talking/Time" },
    ],
  },
];

export const ALL_SERVICES = SERVICE_CATALOG.flatMap((cat) =>
  cat.services.map((s) => ({ ...s, category: cat.key, categoryLabel: cat.label }))
);
