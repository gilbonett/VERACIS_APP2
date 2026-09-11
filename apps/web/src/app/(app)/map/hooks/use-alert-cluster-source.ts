'use client'

import { useMemo } from 'react'

type ClusterableAlert = {
  id: string
  lat: number
  lng: number
  [key: string]: unknown
}

export type ClusterPointFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { alertId: string }
}

export type ClusterGeoJSON = {
  type: 'FeatureCollection'
  features: ClusterPointFeature[]
}

export function useAlertClusterSource(
  alerts: ClusterableAlert[],
): ClusterGeoJSON {
  return useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: alerts.map((a) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [a.lng, a.lat] as [number, number],
        },
        properties: { alertId: a.id },
      })),
    }),
    [alerts],
  )
}
