
import { env } from "@/public-env";
import z from "zod";
import { getCookiesFromHeaders } from "./utils/get-cookies-from-headers";

const GetEventsSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  category: z.enum(["CLIMATIC", "ENVIRONMENTAL", "INFRASTRUCTURAL"]),
});

type GetEventsRequest = {
  headers: HeadersInit;
};

export type GetEventsResponse = z.infer<typeof GetEventsSchema>;

export async function getEvents({
  headers,
}: GetEventsRequest): Promise<GetEventsResponse[]> {
  const url = new URL("events", env.API_URL);

  const response = await fetch(url, {
    headers: getCookiesFromHeaders(headers),
  });

  const { data } = await response.json();

  return data.map(GetEventsSchema.parse);
}
