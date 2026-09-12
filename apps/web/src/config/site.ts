import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/constants";

export const siteConfig = {
  name: APP_NAME,
  description: APP_DESCRIPTION,
  url: APP_URL,
  ogImage: `${APP_URL}/og.png`,
  links: {
    twitter: "https://twitter.com/novixa",
    github: "https://github.com/novixa",
  },
  tagline: "Turn more leads into paying clients with AI.",
} as const;

export type SiteConfig = typeof siteConfig;
