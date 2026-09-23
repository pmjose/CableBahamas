import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import { Fragment, useEffect } from 'react'
import tt from '../i18n/tt'
import { basemapUrl, BAHAMAS_CENTER, BAHAMAS_BOUNDS } from '../data/basemaps'
import 'leaflet/dist/leaflet.css'

export type MapMarker = {
  name: string
  lat: number
  lng: number
  /** radius in pixels */
  radius?: number
  color?: string
  /** if true, marker pulses (use for active alerts) */
  pulse?: boolean
  tooltip?: string
}

type Props = {
  markers: MapMarker[]
  height?: number | string
  /** carto basemap variant */
  basemap?: 'voyager' | 'positron' | 'dark'
  center?: [number, number]
  zoom?: number
  className?: string
}

const ATTRIBUTION =
  // eslint-disable-next-line -- attribution HTML, do not wrap with tt()
   '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

function BahamasViewport({ national }: { national: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (national) map.fitBounds(BAHAMAS_BOUNDS, { padding: [12, 12] })
  }, [map, national])
  return null
}

// Centre on The Bahamas (Family Islands + New Providence) by default
export default function CartoMap({
  markers,
  height = 320,
  basemap = 'positron',
  center = BAHAMAS_CENTER,
  zoom = 6,
  className = '',
}: Props) {
  const tiles = basemapUrl(basemap, import.meta.env.VITE_CARTO_BASEMAP_KEY ?? '')
  return (
    <div className={`relative w-full overflow-hidden rounded-xl border border-black/5 ${className}`} style={{ height }}>
      {!tiles && <div role="status" className="absolute top-2 left-12 right-2 z-[500] bg-white p-2 text-xs text-red-800">Basemap unavailable: configure the basemap credential.</div>}
      <MapContainer
        key={`${center.join(',')}:${zoom}`}
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
        zoomControl
      >
        <BahamasViewport national={zoom <= 8} />
        {tiles && <TileLayer attribution={ATTRIBUTION} url={tiles} />}
        {markers.map((m) => {
          const r = m.radius ?? 8
          const c = m.color ?? '#FF4438'
          const k = `${tt(m.name)}-${r}-${c}-${m.pulse ? 1 : 0}`
          return (
            <Fragment key={k}>
              {m.pulse && (
                <CircleMarker
                  center={[m.lat, m.lng]}
                  radius={r * 2.2}
                  pathOptions={{ color: c, fillColor: c, fillOpacity: 0.18, weight: 0, className: 'carto-pulse' }}
                />
              )}
              <CircleMarker
                center={[m.lat, m.lng]}
                radius={r}
                pathOptions={{ color: '#222128', fillColor: c, fillOpacity: 0.9, weight: 1.5 }}
              >
                {m.tooltip && (
                  <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false}>
                    <span className="text-xs font-semibold">{tt(m.tooltip)}</span>
                  </Tooltip>
                )}
              </CircleMarker>
            </Fragment>
          )
        })}
      </MapContainer>

      {/* Pulse animation styles */}
      <style>{`
        .carto-pulse { animation: cartoPulse 2s ease-in-out infinite; transform-origin: center; }
        @keyframes cartoPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.05; }
        }
        .leaflet-container { background: #f6f7fb; font-family: inherit; }
        .leaflet-control-attribution { font-size: 9px !important; }
      `}</style>
    </div>
  )
}
