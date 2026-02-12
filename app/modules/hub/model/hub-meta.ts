const HUB_CANONICAL_URL = "https://luhive.com/hub";
const HUB_OG_IMAGE_URL = "https://luhive.com/LuhiveLogoBackground.png";

export function meta() {
  const title = "Luhive Hub | Discover Communities";
  const description =
    "Discover curated communities, founders, and events on the Luhive Hub.";

  const keywords = [
    "Luhive",
    "Luhive communities",
    "founder communities",
    "startup networking",
    "tech communities",
    "community discovery",
    "events",
  ].join(", ");

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    {
      name: "robots",
      content:
        "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
    },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: HUB_CANONICAL_URL },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Luhive" },
    { property: "og:image", content: HUB_OG_IMAGE_URL },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: HUB_OG_IMAGE_URL },
    { tagName: "link", rel: "canonical", href: HUB_CANONICAL_URL },
  ];
}
