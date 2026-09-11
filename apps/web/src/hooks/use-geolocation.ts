import { useEffect, useState } from 'react'

interface GeolocationCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number | null
  altitudeAccuracy: number | null
  heading: number | null
  speed: number | null
}

interface GeolocationState {
  coordinates: GeolocationCoordinates | null
  isLoading: boolean
  error: string | null
  timestamp: number | null
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = true,
  } = options

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    isLoading: true,
    error: null,
    timestamp: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        coordinates: null,
        isLoading: false,
        error: 'Geolocalização não é suportada pelo seu navegador',
        timestamp: null,
      })
      return
    }

    const geolocationOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        coordinates: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        },
        isLoading: false,
        error: null,
        timestamp: position.timestamp,
      })
    }

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Erro ao obter localização'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permissão de localização negada'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Localização indisponível'
          break
        case error.TIMEOUT:
          errorMessage = 'Tempo esgotado ao obter localização'
          break
      }

      setState({
        coordinates: null,
        isLoading: false,
        error: errorMessage,
        timestamp: null,
      })
    }

    let watchId: number | undefined

    if (watch) {
      watchId = navigator.geolocation.watchPosition(
        onSuccess,
        onError,
        geolocationOptions,
      )
    } else {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        geolocationOptions,
      )
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [enableHighAccuracy, timeout, maximumAge, watch])

  return state
}
