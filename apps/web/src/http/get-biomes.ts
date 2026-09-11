import { env } from "@/public-env";

export type GetBiomesResponse = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getBiomes() {
  const response = await fetch(`${env.API_URL}/biomes`);

  const body = await response.json();

  return body.data as GetBiomesResponse[];
}
