
export function decodeFileNameParamForS3Key(segment: string): string {
  let out = segment
  for (let i = 0; i < 8; i++) {
    try {
      const next = decodeURIComponent(out)
      if (next === out) break
      out = next
    } catch {
      break
    }
  }
  return out
}
