export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistanceLabelPt(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): string {
  const km = haversineDistanceKm(fromLat, fromLng, toLat, toLng)
  if (km < 1) {
    const m = Math.round(km * 1000)
    return m <= 10 ? 'Muito próximo' : `${m} m de distância`
  }
  const text = km.toFixed(1).replace('.', ',')
  return `${text} km de distância`
}

export function formatShortTimeAgoPt(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (sec < 60) return 'agora'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min. atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h atrás`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} ${d === 1 ? 'dia' : 'dias'} atrás`
  const w = Math.floor(d / 7)
  return `${w} sem. atrás`
}
