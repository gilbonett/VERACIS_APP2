'use client'

import type { ReactNode } from 'react'
import { Component } from 'react'
import { Marker, type MarkerProps, useMap as useMapboxMap } from 'react-map-gl/mapbox'
import { useMap } from '.'

export type MapMarkerProps = Omit<MarkerProps, 'latitude' | 'longitude'> & {
  lat?: number
  lng?: number
}

type MapMarkerBoundaryProps = {
  children: ReactNode
}

type MapMarkerBoundaryState = {
  hasError: boolean
}

class MapMarkerBoundary extends Component<
  MapMarkerBoundaryProps,
  MapMarkerBoundaryState
> {
  state: MapMarkerBoundaryState = { hasError: false }

  static getDerivedStateFromError(): MapMarkerBoundaryState {
    return { hasError: true }
  }

  componentDidUpdate(prevProps: MapMarkerBoundaryProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function MapMarkerContent({ className, lat, lng, ...props }: MapMarkerProps) {
  const { isMapLoaded, isMapReady } = useMap()
  const mapboxContext = useMapboxMap()

  const isReady = isMapLoaded && isMapReady

  if (!isReady) return null

  const currentMap = mapboxContext.current?.getMap?.()
  const mapContainer = currentMap?.getContainer?.()

  if (!currentMap || !mapContainer?.isConnected) return null

  if (typeof lat !== 'number' || typeof lng !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return <Marker latitude={lat} longitude={lng} anchor="bottom" {...props} />
}

export function MapMarker(props: MapMarkerProps) {
  return (
    <MapMarkerBoundary>
      <MapMarkerContent {...props} />
    </MapMarkerBoundary>
  )
}
