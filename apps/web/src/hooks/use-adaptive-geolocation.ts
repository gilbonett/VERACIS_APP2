import { useEffect, useState } from 'react'
import { useGeolocation } from './use-geolocation'

interface AdaptiveGeolocationOptions {
  forceWatch?: boolean // Força monitoramento contínuo mesmo no desktop
}

interface DeviceInfo {
  isMobile: boolean
  hasGPS: boolean
  recommendedStrategy: 'watch' | 'interval' | 'manual'
}

function detectDevice(): DeviceInfo {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    )

  // Dispositivos móveis geralmente têm GPS
  const hasGPS = isMobile

  // Estratégia recomendada
  const recommendedStrategy = isMobile ? 'watch' : 'interval'

  return { isMobile, hasGPS, recommendedStrategy }
}

export function useAdaptiveGeolocation(
  options: AdaptiveGeolocationOptions = {},
) {
  const [deviceInfo] = useState<DeviceInfo>(detectDevice())
  const [shouldRefetch, setShouldRefetch] = useState(0)

  // Configurações adaptativas baseadas no dispositivo
  const geolocationOptions = {
    enableHighAccuracy: deviceInfo.hasGPS, // Só usa high accuracy se tiver GPS
    timeout: deviceInfo.isMobile ? 15000 : 10000,
    maximumAge: deviceInfo.isMobile ? 0 : 5000, // Desktop pode usar cache de 5s
    watch: options.forceWatch || deviceInfo.recommendedStrategy === 'watch',
  }

  const geoState = useGeolocation(geolocationOptions)

  // Para desktop: atualiza a cada 30 segundos se não estiver usando watch
  useEffect(() => {
    if (!deviceInfo.isMobile && !options.forceWatch) {
      const interval = setInterval(() => {
        setShouldRefetch((prev) => prev + 1)
      }, 30000) // 30 segundos

      return () => clearInterval(interval)
    }
  }, [deviceInfo.isMobile, options.forceWatch])

  // Função para forçar atualização manual
  const refetch = () => {
    setShouldRefetch((prev) => prev + 1)
  }

  return {
    ...geoState,
    deviceInfo,
    refetch,
  }
}
