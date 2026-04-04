export const CURATED_COLLECTIONS = {
  "best-sellers": {
    slug: "best-sellers",
    title: "Editor's Picks",
    subtitle: "A handpicked edit built for a demo storefront",
    description:
      "Curated products selected by featured status, in-stock availability, and strong product ratings.",
    filters: {
      featured: "true",
      inStock: "true",
      sort: "-averageRating",
      limit: "16",
    },
    highlightTag: "Featured and high-rated",
  },
  "heritage-stories": {
    slug: "heritage-stories",
    title: "GI Tagged Treasures",
    subtitle: "Craft narratives rooted in region and tradition",
    description:
      "A deterministic GI-only collection for authentic craft discovery, ranked by rating and freshness.",
    filters: {
      gi: "true",
      inStock: "true",
      sort: "-averageRating",
      limit: "16",
    },
    highlightTag: "GI tagged only",
  },
  "festive-edit": {
    slug: "festive-edit",
    title: "Festive Edit",
    subtitle: "Seasonal recommendations for celebrations",
    description:
      "A practical festive assortment prioritizing active featured items and stronger discount visibility.",
    filters: {
      featured: "true",
      inStock: "true",
      sort: "-discount",
      limit: "16",
    },
    highlightTag: "Festive-ready picks",
  },
};

export const HERO_COPY_VARIANTS = {
  premium: [
    {
      intent: "conversion",
      eyebrow: "Shilpika Curation",
      title: "Wear Stories Woven Across Bharat",
      description:
        "Handpicked textiles and heritage craft pieces chosen for everyday elegance and festive moments.",
      primaryLabel: "Shop Editor's Picks",
      primaryTo: "/collections/best-sellers",
      secondaryLabel: "Browse Categories",
      secondaryTo: null,
      fallbackRecommendations: [
        { label: "Editor's Saree Picks", to: "/search?q=saree" },
        { label: "Daily Wear Picks", to: "/search?q=daily%20wear" },
        { label: "Under Rs. 3000", to: "/search?q=budget" },
      ],
    },
    {
      intent: "story",
      eyebrow: "Crafted In India",
      title: "Craft Stories Behind Every Thread",
      description:
        "Discover GI-inspired finds and regional artistry selected by our curation team.",
      primaryLabel: "Explore GI Treasures",
      primaryTo: "/collections/heritage-stories",
      secondaryLabel: "See GI Tag Finds",
      secondaryTo: "/collections/heritage-stories",
      fallbackRecommendations: [
        { label: "GI Tag Treasures", to: "/search?gi=true" },
        { label: "Regional Weaves", to: "/search?q=weave" },
        { label: "Artisan Classics", to: "/search?q=handcrafted" },
      ],
    },
    {
      intent: "seasonal",
      eyebrow: "Seasonal Edit",
      title: "Celebrate With Curated Festive Picks",
      description:
        "From occasion-ready silhouettes to gifting-worthy decor, start with what is trending now.",
      primaryLabel: "Shop Festive Edit",
      primaryTo: "/collections/festive-edit",
      secondaryLabel: "Shop By Region",
      secondaryTo: "/regions/rajasthan",
      fallbackRecommendations: [
        { label: "Festive Favourites", to: "/search?q=festive" },
        { label: "Wedding Special", to: "/search?q=wedding" },
        { label: "Gift-Ready Finds", to: "/search?q=gift" },
      ],
    },
  ],
  festive: [
    {
      intent: "conversion",
      eyebrow: "Festival Ready",
      title: "Your Celebration Look Starts Here",
      description:
        "Discover bright, festive-first pieces curated for family functions, gifting, and festive gatherings.",
      primaryLabel: "See Celebration Picks",
      primaryTo: "/collections/festive-edit",
      secondaryLabel: "Browse Categories",
      secondaryTo: null,
      fallbackRecommendations: [
        { label: "Haldi and Mehendi", to: "/search?q=haldi" },
        { label: "Wedding Guest Looks", to: "/search?q=wedding" },
        { label: "Festive Home Glow", to: "/search?q=decor" },
      ],
    },
    {
      intent: "story",
      eyebrow: "Artisan Spotlight",
      title: "Heritage Crafts, Modern Celebration",
      description:
        "Regional stories meet contemporary styling in this season's most-loved artisan picks.",
      primaryLabel: "Explore GI Treasures",
      primaryTo: "/collections/heritage-stories",
      secondaryLabel: "See GI Tag Finds",
      secondaryTo: "/collections/heritage-stories",
      fallbackRecommendations: [
        { label: "Handloom Highlights", to: "/search?q=handloom" },
        { label: "Crafted Gifts", to: "/search?q=gift" },
        { label: "Regional Icons", to: "/search?q=regional" },
      ],
    },
    {
      intent: "seasonal",
      eyebrow: "Wedding and Festive",
      title: "Curated Looks For Moments That Matter",
      description:
        "Build your festive wardrobe with ready-to-style recommendations from the Shilpika edit.",
      primaryLabel: "Shop Editor's Picks",
      primaryTo: "/collections/best-sellers",
      secondaryLabel: "Shop By Region",
      secondaryTo: "/regions/west-bengal",
      fallbackRecommendations: [
        { label: "Wedding Special", to: "/search?q=wedding" },
        { label: "Under Rs. 3000", to: "/search?q=budget" },
        { label: "Last-Minute Gifts", to: "/search?q=gift" },
      ],
    },
  ],
};

export const HERO_TRUST_METRICS = [
  { value: "12k+", label: "Happy shoppers" },
  { value: "150+", label: "Artisan clusters" },
  { value: "28", label: "States served" },
];
