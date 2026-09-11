import { createPublicEnv } from "next-public-env";

const { getPublicEnv, PublicEnv } = createPublicEnv(
  {
    API_URL: process.env.API_URL,
    APP_URL: process.env.APP_URL,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    CLARITY_PROJECT_ID: process.env.CLARITY_PROJECT_ID,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  },
  {
    schema: (z) => ({
      API_URL: z.url(),
      APP_URL: z.url(),
      MAPBOX_ACCESS_TOKEN: z.string(),
      CLARITY_PROJECT_ID: z.string(),
      COOKIE_DOMAIN: z.string().optional(),
    }),
  },
);

const env = getPublicEnv();

export { env, PublicEnv };
