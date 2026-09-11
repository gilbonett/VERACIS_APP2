import { env } from "@/public-env";
import ky from "ky";

export const api = ky.create({
  baseUrl: env.API_URL,
  credentials: "include",
});
