'use client'

import { useCallback, useEffect, useState } from 'react'
import * as MapGL from 'react-map-gl/mapbox'
import { useMap as useMapboxMap } from 'react-map-gl/mapbox'
import type { MapLayerMouseEvent, GeoJSONSource } from 'mapbox-gl'
import { CLUSTER_RADIUS, CLUSTER_MAX_ZOOM } from './constants/cluster-config'
import { useMap } from '@/components/map'
import type { ClusterGeoJSON } from './hooks/use-alert-cluster-source'

type ClusterLayerProps = {
  sourceId: string
  color: string
  geojson: ClusterGeoJSON
  clusterOffset?: [number, number]
  children: (showPins: boolean) => React.ReactNode
}

export function ClusterLayer({
  sourceId,
  color,
  geojson,
  clusterOffset = [0, 0],
  children,
}: ClusterLayerProps) {
  const { isMapReady } = useMap()
  const mapboxContext = useMapboxMap()
  const [showPins, setShowPins] = useState(true)

  const clusterLayerId = `${sourceId}-clusters`
  const clusterCountLayerId = `${sourceId}-cluster-count`
  const singleCircleLayerId = `${sourceId}-single-circle`
  const singleCountLayerId = `${sourceId}-single-count`

  useEffect(() => {
    const map = mapboxContext.current?.getMap?.()
    if (!map || !isMapReady) return

    const updateZoom = () => {
      setShowPins(map.getZoom() > CLUSTER_MAX_ZOOM)
    }

    map.on('zoomend', updateZoom)
    map.on('idle', updateZoom)
    updateZoom()

    return () => {
      map.off('zoomend', updateZoom)
      map.off('idle', updateZoom)
    }
  }, [mapboxContext, isMapReady])

  const handleClusterClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapboxContext.current?.getMap?.()
      if (!map) return

      const features = e.features
      if (!features?.length) return

      const clusterId = features[0].properties?.cluster_id
      if (clusterId == null) return

      const source = map.getSource(sourceId) as GeoJSONSource | undefined
      if (!source?.getClusterExpansionZoom) return

      source.getClusterExpansionZoom(clusterId, (err, expansionZoom) => {
        if (err || expansionZoom == null) return
        const coords = (
          features[0].geometry as { type: 'Point'; coordinates: number[] }
        ).coordinates
        map.easeTo({
          center: [coords[0], coords[1]],
          zoom: expansionZoom,
          duration: 500,
        })
      })
    },
    [mapboxContext, sourceId],
  )

  useEffect(() => {
    const map = mapboxContext.current?.getMap?.()
    if (!map || !isMapReady) return

    const onClick = (e: MapLayerMouseEvent) => handleClusterClick(e)
    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', clusterLayerId, onClick)
    map.on('mouseenter', clusterLayerId, onEnter)
    map.on('mouseleave', clusterLayerId, onLeave)

    return () => {
      map.off('click', clusterLayerId, onClick)
      map.off('mouseenter', clusterLayerId, onEnter)
      map.off('mouseleave', clusterLayerId, onLeave)
    }
  }, [mapboxContext, isMapReady, clusterLayerId, handleClusterClick])

  const circleRadius: mapboxgl.Expression = [
    'step',
    ['get', 'point_count'],
    20,
    5,
    25,
    10,
    30,
    25,
    35,
  ]

  return (
    <>
      {isMapReady && (
        <MapGL.Source
          id={sourceId}
          type="geojson"
          data={geojson}
          cluster={true}
          clusterRadius={CLUSTER_RADIUS}
          clusterMaxZoom={CLUSTER_MAX_ZOOM}
        >
          <MapGL.Layer
            id={clusterLayerId}
            type="circle"
            filter={['has', 'point_count']}
            maxzoom={CLUSTER_MAX_ZOOM + 1}
            paint={{
              'circle-color': color,
              'circle-radius': circleRadius,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9,
              'circle-translate': clusterOffset,
            }}
          />
          <MapGL.Layer
            id={clusterCountLayerId}
            type="symbol"
            filter={['has', 'point_count']}
            maxzoom={CLUSTER_MAX_ZOOM + 1}
            layout={{
              'text-field': ['get', 'point_count_abbreviated'],
              'text-size': 15,
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
              'text-allow-overlap': true,
            }}
            paint={{
              'text-color': '#333333',
              'text-translate': clusterOffset,
            }}
          />

          <MapGL.Layer
            id={singleCircleLayerId}
            type="circle"
            filter={['!', ['has', 'point_count']]}
            maxzoom={CLUSTER_MAX_ZOOM + 1}
            paint={{
              'circle-color': color,
              'circle-radius': 20,
              'circle-stroke-width': 3,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9,
              'circle-translate': clusterOffset,
            }}
          />
          <MapGL.Layer
            id={singleCountLayerId}
            type="symbol"
            filter={['!', ['has', 'point_count']]}
            maxzoom={CLUSTER_MAX_ZOOM + 1}
            layout={{
              'text-field': '1',
              'text-size': 15,
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
              'text-allow-overlap': true,
            }}
            paint={{
              'text-color': '#333333',
              'text-translate': clusterOffset,
            }}
          />
        </MapGL.Source>
      )}

      {children(showPins)}
    </>
  )
}
