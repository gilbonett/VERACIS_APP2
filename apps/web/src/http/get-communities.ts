import { env } from "@/public-env";

export type GetCommunitiesResponse = {
  id: string;
  name: string;
  biomeId: string;
};

export async function getCommunities() {
  const url = new URL("communities", env.API_URL);

  const response = await fetch(url);

  const body = await response.json();

  return body.data as GetCommunitiesResponse[];
}
