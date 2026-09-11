import { Map, MapAction } from '@/components/map'
import { Metadata } from 'next'
import { ClimaticAlertPins } from './climatic-alert-pins'
import { EnvironmentalAlertPins } from './environmental-alert-pins'
import { HealthAlertPins } from './health-alert-pins'
import { RegisterNotification } from './register-notification'
import { StructuralAlertPins } from './structural-alert-pins'
import { MapTutorial } from './map-tutorial'
import { MapOpenPendingAlertFromNotification } from './map-open-pending-alert'
import { TitleNavMap } from './title-nav-map'

export const metadata: Metadata = {
  title: 'Mapa',
}

export default async function MapPage() {
  return (
    <div className="flex flex-col h-full w-full">
      <TitleNavMap />

      <Map>
        <MapOpenPendingAlertFromNotification />
        <MapAction />
        <MapTutorial />
        <HealthAlertPins />
        <ClimaticAlertPins />
        <EnvironmentalAlertPins />
        <StructuralAlertPins />
        <RegisterNotification />
        {/*{user && <MarkerVisibleDialog notifications={notifications} />}*/}
      </Map>
    </div>
  )
}
