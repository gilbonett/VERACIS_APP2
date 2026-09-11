import { SessionAssuranceLevel } from "@/domain/identity/entities/session";

const ASSURANCE_LEVELS: SessionAssuranceLevel[] = ["LOW", "MEDIUM", "HIGH"];

export function translateAssuranceLevel(
  rawAssuranceClaim: string | null,
): SessionAssuranceLevel {
  if (!rawAssuranceClaim) {
    return "LOW";
  }

  const normalized = rawAssuranceClaim.trim().toUpperCase();

  return (
    ASSURANCE_LEVELS.find((level) => level === normalized) ?? "LOW"
  );
}
