import { SetMetadata } from "@nestjs/common";

export const TRACK_CONNECTION_KEY = "trackConnectionChannel";
export const TrackConnection = (channel: string) =>
  SetMetadata(TRACK_CONNECTION_KEY, channel);
