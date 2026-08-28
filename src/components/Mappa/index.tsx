// Componente mappa Leaflet con marker posizione, fermate vicine

import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store/appStore';
import type { FermataVicina, Coordiante } from '../../types';
import { formattaDistanza } from '../../utils/matematica';
import { CENTRO_TORINO } from '../../utils/costanti';

// Fix icone Leaflet (problema noto con bundler)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icona personalizzata per la posizione utente
const iconaUtente = L.divIcon({
  html: '<div class="marker-utente"></div>',
  className: '',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Icona personalizzata per le fermate
function creaIconaFermata(selezionata = false) {
  return L.divIcon({
    html: `<div class="marker-fermata${selezionata ? ' selezionata' : ''}"></div>`,
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// Componente per aggiornare la vista della mappa
function ControlloMappa({ centro }: { centro: Coordiante }) {
  const mappa = useMap();
  const primoRender = useRef(true);

  useEffect(() => {
    if (primoRender.current) {
      mappa.setView([centro.lat, centro.lon], 16, { animate: false });
      primoRender.current = false;
    }
  }, []);

  return null;
}

function CentraMappa({ posizione }: { posizione: Coordiante | null }) {
  const mappa = useMap();

  useEffect(() => {
    if (posizione) {
      mappa.flyTo([posizione.lat, posizione.lon], mappa.getZoom(), {
        animate: true,
        duration: 1,
      });
    }
  }, [posizione, mappa]);

  return null;
}

export default function Mappa() {
  const {
    posizione,
    fermateVicine,
    fermataSelezionata,
    setFermataSelezionata,
    destinazione,
  } = useAppStore();

  const centroDipartenza: [number, number] = posizione
    ? [posizione.lat, posizione.lon]
    : [CENTRO_TORINO.lat, CENTRO_TORINO.lon];

  const handleFermataClick = useCallback(
    (fermata: FermataVicina) => {
      setFermataSelezionata(
        fermataSelezionata?.stop_id === fermata.stop_id ? null : fermata
      );
    },
    [fermataSelezionata, setFermataSelezionata]
  );

  // Tile CARTO Dark (aperto e gratuito con attribuzione CARTO/OpenStreetMap, non richiede API key)
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={centroDipartenza}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        <ControlloMappa centro={{ lat: centroDipartenza[0], lon: centroDipartenza[1] }} />

        {/* Centra sulla posizione quando cambia */}
        <CentraMappa posizione={posizione} />

        {/* Marker posizione utente */}
        {posizione && (
          <>
            <Marker
              position={[posizione.lat, posizione.lon]}
              icon={iconaUtente}
              zIndexOffset={1000}
            >
              <Popup>
                <div style={{ color: '#333', fontSize: '13px', fontWeight: 600 }}>
                  📍 Posizione attuale
                </div>
              </Popup>
            </Marker>
            {/* Cerchio di accuratezza */}
            <Circle
              center={[posizione.lat, posizione.lon]}
              radius={50}
              pathOptions={{
                color: '#4f46e5',
                fillColor: '#4f46e5',
                fillOpacity: 0.08,
                weight: 1,
                opacity: 0.3,
              }}
            />
          </>
        )}

        {/* Marker fermate vicine */}
        {fermateVicine.map((fermata) => {
          const isSelezionata = fermataSelezionata?.stop_id === fermata.stop_id;
          return (
            <Marker
              key={fermata.stop_id}
              position={[fermata.stop_lat, fermata.stop_lon]}
              icon={creaIconaFermata(isSelezionata)}
              eventHandlers={{
                click: () => handleFermataClick(fermata),
              }}
              zIndexOffset={isSelezionata ? 500 : 0}
            >
              {isSelezionata && (
                <Popup autoPan={false}>
                  <div style={{ color: '#333', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                      🚏 {fermata.stop_name}
                    </div>
                    <div style={{ color: '#666' }}>
                      {formattaDistanza(fermata.distanza)}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

        {/* Marker destinazione */}
        {destinazione && (
          <Marker
            position={[destinazione.coords.lat, destinazione.coords.lon]}
            icon={L.divIcon({
              html: '<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">🎯</div>',
              className: '',
              iconSize: [28, 28],
              iconAnchor: [14, 28],
            })}
            zIndexOffset={900}
          >
            <Popup>
              <div style={{ color: '#333', fontSize: '13px', fontWeight: 600 }}>
                🎯 {destinazione.nome}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
