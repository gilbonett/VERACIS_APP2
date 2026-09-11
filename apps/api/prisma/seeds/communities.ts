import { BIOMES } from "./biomes";
import { USERS } from "./users";

export const COMMUNITIES = {
  AMAZINICO_MANOA: {
    id: "e866698b-42f9-46da-84cd-e97bdbf19c1b",
    name: "Comunidade Manoa",
    slug: "comunidade-manoa",
    lat: -3.029934,
    lng: -60.00022,
    biomeId: BIOMES.AMAZINICO.id,
    authorId: USERS.ROOT.id,
  },
  AMAZONICO_CRISTAL: {
    id: "2f0f2b28-c8b9-4375-8981-a27f121c54e3",
    name: "Comunidade Cristal Tower",
    slug: "comunidade-cristal-tower",
    lat: -3.10374,
    lng: -60.01026,
    biomeId: BIOMES.AMAZINICO.id,
    authorId: USERS.ROOT.id,
  },
};
