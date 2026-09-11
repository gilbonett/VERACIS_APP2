"use client";

import { useUser } from "@/contexts/user-context";
import { useAdaptiveGeolocation } from "@/hooks/use-adaptive-geolocation";
import {
  getStoredLocationSharingEnabled,
  getStoredSharedLocation,
  LOCATION_SHARING_CHANGED_EVENT,
  setStoredSharedLocation,
  type StoredSharedLocation,
} from "@/lib/location-sharing";
import { env } from "@/public-env";
import { useRouter } from "next/navigation";
import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { MapMouseEvent, MapRef } from "react-map-gl/mapbox";
import * as MapGL from "react-map-gl/mapbox";
import { MapGuestLoginDialog } from "@/app/(app)/map/map-guest-login-dialog";
import { MAP_FLY_TO_COORDINATES_EVENT } from "@/app/(app)/map/constants/open-map-alert-detail";
import type { MapFlyToCoordinatesPayload } from "@/app/(app)/map/constants/open-map-alert-detail";
import { MapAction } from "./map-action";

type MapLocation = {
  longitude: number;
  latitude: number;
};

type MapInitialState = {
  longitude?: number;
  latitude?: number;
  zoom: number;
};

type MapContextType = {
  initialState: MapInitialState;
  location: MapLocation;
  hasInitialized: boolean;
  isMapLoaded: boolean;
  isMapReady: boolean;
  isLocationOpen: boolean;
  onLocationOpen: () => void;
  setLocationOpen: (open: boolean) => void;
  onHandleZoomIn: () => void;
  onHandleZoomOut: () => void;
  onHandleActive3d: () => void;
  onHandleCompass: () => void;
  onHandleCenter: () => void;
  onHandleStyle: (url: string) => void;
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export function useMap() {
  const context = useContext(MapContext);

  if (!context) {
    throw new Error("useMap must be used within a MapProvider");
  }

  return context;
}

type MapProps = {
  children: React.ReactNode;
};

function Map({ children }: MapProps) {
  const mapChildren: ReactNode[] = [];
  const overlayChildren: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === MapAction) {
      overlayChildren.push(child);
      return;
    }

    mapChildren.push(child);
  });

  const { user } = useUser();
  const router = useRouter();
  const mapRef = useRef<MapRef>(null);
  const [location, setLocation] = useState<MapLocation>({
    latitude: 0,
    longitude: 0,
  });
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const [isLocationSharingEnabled, setIsLocationSharingEnabled] =
    useState(false);
  const [sharedLocation, setSharedLocation] =
    useState<StoredSharedLocation | null>(null);
  const [isGuestLoginDialogOpen, setIsGuestLoginDialogOpen] = useState(false);
  const [currentStyle, setCurrentStyle] = useState(
    //'mapbox://styles/victorgc1/cmk2pl5mz004501rz0phwe1k5',
    //'mapbox://styles/mapbox/light-v11',
    "mapbox://styles/mapbox/streets-v12",
    //'mapbox://styles/mapbox/satellite-v11',
  );

  const { coordinates, isLoading, error, deviceInfo } =
    useAdaptiveGeolocation();

  useEffect(() => {
    setIsMounted(true);
    setIsMapLoaded(false);
    setHasInitialized(false);
    setIsLocationOpen(false);
  }, []);

  useEffect(() => {
    const syncSharingState = () => {
      setIsLocationSharingEnabled(getStoredLocationSharingEnabled());
      setSharedLocation(getStoredSharedLocation());
    };

    syncSharingState();

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key.includes("veracis.locationSharing.") ||
        event.key.includes("veracis.locationSharing")
      ) {
        syncSharingState();
      }
    };

    window.addEventListener(LOCATION_SHARING_CHANGED_EVENT, syncSharingState);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(
        LOCATION_SHARING_CHANGED_EVENT,
        syncSharingState,
      );
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const resetMapInstance = () => {
      mapRef.current = null;
      setIsMapLoaded(false);
      setHasInitialized(false);
      setIsLocationOpen(false);
      setMapInstanceKey((prev) => prev + 1);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resetMapInstance();
    };

    window.addEventListener("popstate", resetMapInstance);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("popstate", resetMapInstance);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  const fallbackLocation = isLocationSharingEnabled ? sharedLocation : null;

  const initialState = {
    longitude: coordinates?.longitude ?? fallbackLocation?.longitude,
    latitude: coordinates?.latitude ?? fallbackLocation?.latitude,
    zoom: coordinates || fallbackLocation ? 16 : 14,
  };

  useEffect(() => {
    const flyToCoordinates = (lng: number, lat: number, attempt = 0) => {
      const map = mapRef.current;
      if (map && isMapLoaded) {
        map.flyTo({
          center: [lng, lat],
          zoom: 17,
          duration: 1200,
        });
        return;
      }
      if (attempt < 15) {
        window.setTimeout(() => flyToCoordinates(lng, lat, attempt + 1), 200);
      }
    };

    const onFlyTo = (event: Event) => {
      const detail = (event as CustomEvent<MapFlyToCoordinatesPayload>).detail;
      if (
        !detail ||
        typeof detail.lat !== "number" ||
        typeof detail.lng !== "number" ||
        Number.isNaN(detail.lat) ||
        Number.isNaN(detail.lng)
      ) {
        return;
      }
      flyToCoordinates(detail.lng, detail.lat);
    };

    window.addEventListener(MAP_FLY_TO_COORDINATES_EVENT, onFlyTo);
    return () =>
      window.removeEventListener(MAP_FLY_TO_COORDINATES_EVENT, onFlyTo);
  }, [isMapLoaded]);

  useEffect(() => {
    if (coordinates && mapRef.current && !hasInitialized && isMapLoaded) {
      const timer = setTimeout(() => {
        mapRef.current?.resize();

        mapRef.current?.flyTo({
          center: [coordinates.longitude, coordinates.latitude],
          zoom: 17,
          duration: 1500,
        });

        setHasInitialized(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [coordinates, hasInitialized, isMapLoaded]);

  useEffect(() => {
    if (!coordinates || !isLocationSharingEnabled) return;

    const nextSharedLocation: StoredSharedLocation = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      updatedAt: Date.now(),
    };

    setStoredSharedLocation(nextSharedLocation);
    setSharedLocation(nextSharedLocation);
  }, [coordinates, isLocationSharingEnabled]);

  // Aguarda montagem no cliente para evitar erro de hidratação
  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (isLoading && !coordinates && !fallbackLocation) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Obtendo sua localização...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {deviceInfo.isMobile ? (
                <>📱 Celular detectado - Usando GPS</>
              ) : (
                <>💻 Computador detectado - Usando Wi-Fi/IP</>
              )}
            </p>
            {!deviceInfo.isMobile && (
              <p className="text-xs text-gray-500 mt-2">
                💡 A precisão em computadores é menor (50-500m)
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error && !coordinates && !fallbackLocation) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="text-red-500">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              Erro ao obter localização
            </p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
            {/*<button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tentar novamente
            </button>*/}
          </div>
        </div>
      </div>
    );
  }

  function onHandleZoomIn() {
    const map = mapRef.current;

    if (!map) return;

    map.zoomIn({
      duration: 500,
      essential: true,
    });
  }

  function onHandleZoomOut() {
    const map = mapRef.current;

    if (!map) return;

    map.zoomOut({
      duration: 500,
      essential: true,
    });
  }

  function onHandleActive3d() {
    const map = mapRef.current;

    if (!map) return;

    const currentPitch = map.getPitch();

    const targetPitch = currentPitch >= 59 ? 0 : 60;

    map.stop();

    map.easeTo({
      pitch: targetPitch,
      duration: 500,
      essential: true,
      easing: (t) => t * t * t * (t * (6 * t - 15) + 10),
    });
  }

  function onHandleCompass() {
    const map = mapRef.current;

    if (!map) return;

    const currentBearing = map.getBearing();
    map.easeTo({
      bearing: currentBearing + 90,
      duration: 500,
      essential: true,
    });
  }

  function onHandleCenter() {
    const map = mapRef.current;

    if (!map) return;

    const centerTarget = coordinates
      ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
      : fallbackLocation
        ? {
            latitude: fallbackLocation.latitude,
            longitude: fallbackLocation.longitude,
          }
        : null;

    if (!centerTarget) return;

    map.easeTo({
      center: [centerTarget.longitude, centerTarget.latitude],
      pitch: 0,
      bearing: 0,
      zoom: 17,
      duration: 1000,
      essential: true,
      easing: (t) => t * t * t * (t * (6 * t - 15) + 10),
    });
  }

  function onHandleStyle(url: string) {
    setCurrentStyle(url);
  }

  function handleLocation(event: MapMouseEvent) {
    if (!user) {
      setIsGuestLoginDialogOpen(true);
      return;
    }

    setLocation({
      latitude: event.lngLat.lat,
      longitude: event.lngLat.lng,
    });
    setIsLocationOpen((prev) => !prev);
  }

  const onLocationOpen = () => setIsLocationOpen((prev) => !prev);
  const setLocationOpen = (open: boolean) => setIsLocationOpen(open);

  const mapboxMap = mapRef.current?.getMap?.();
  const mapContainer = mapboxMap?.getContainer?.();
  const isMapReady = Boolean(
    isMapLoaded &&
    mapboxMap &&
    mapContainer?.isConnected &&
    mapboxMap.isStyleLoaded?.(),
  );

  const { latitude, longitude } = initialState;
  const hasInitialPoint =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  return (
    <MapContext.Provider
      value={{
        initialState,
        hasInitialized,
        isMapLoaded,
        location,
        isLocationOpen,
        isMapReady,
        onLocationOpen,
        setLocationOpen,
        onHandleZoomIn,
        onHandleZoomOut,
        onHandleActive3d,
        onHandleCompass,
        onHandleCenter,
        onHandleStyle,
      }}
    >
      <div
        data-tour="map-canvas"
        className="relative w-full h-full min-h-0 overflow-hidden rounded-md shadow-md"
      >
        <MapGL.Map
          key={mapInstanceKey}
          ref={mapRef}
          mapboxAccessToken={env.MAPBOX_ACCESS_TOKEN}
          initialViewState={initialState}
          mapStyle={currentStyle}
          style={{
            width: "100%",
            height: "100%",
          }}
          styleDiffing={true}
          onLoad={() => setIsMapLoaded(true)}
          onClick={handleLocation}
          attributionControl={true}
          trackResize={true}
          preserveDrawingBuffer={false}
          renderWorldCopies={false}
          interactive={true}
          dragRotate={true}
          touchZoomRotate={true}
          touchPitch={true}
          keyboard={true}
        >
          {hasInitialPoint ? (
            <MapGL.Source
              id={`user-location-${mapInstanceKey}`}
              type="geojson"
              data={{
                type: "FeatureCollection",
                features: [
                  {
                    type: "Feature",
                    geometry: {
                      type: "Point",
                      coordinates: [longitude, latitude],
                    },
                    properties: {},
                  },
                ],
              }}
            >
              <MapGL.Layer
                id={`user-location-glow-${mapInstanceKey}`}
                type="circle"
                paint={{
                  "circle-radius": 16,
                  "circle-color": "#60A5FA",
                  "circle-opacity": 0.28,
                }}
              />
              <MapGL.Layer
                id={`user-location-core-${mapInstanceKey}`}
                type="circle"
                paint={{
                  "circle-radius": 6,
                  "circle-color": "#2563EB",
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#FFFFFF",
                }}
              />
            </MapGL.Source>
          ) : null}
          {mapChildren}
        </MapGL.Map>
        {overlayChildren.length > 0 ? (
          <div className="pointer-events-none absolute inset-0 z-[2] [&>*]:pointer-events-auto">
            {overlayChildren}
          </div>
        ) : null}
      </div>

      <MapGuestLoginDialog
        open={isGuestLoginDialogOpen}
        onOpenChange={setIsGuestLoginDialogOpen}
        onLogin={() => router.push("/auth/signin")}
      />
    </MapContext.Provider>
  );
}

export { MapMarker } from "./map-marker";
export { Map, MapAction };
