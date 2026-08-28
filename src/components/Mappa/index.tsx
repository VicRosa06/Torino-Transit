// Componente mappa Leaflet integrato nel layout con marker fermate chiaramente riconoscibili

import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store/appStore';
import type { FermataVicina, Coordiante } from '../../types';
import { formattaDistanza } from '../../utils/matematica';
import { CENTRO_TORINO } from '../../utils/costanti';

// Fix icone Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Icona per la posizione dell'utente (punto blu/indigo pulsante)
const iconaUtente = L.divIcon({
  html: '<div class="marker-utente-pulse"><div class="marker-utente-core"></div></div>',
  className: 'custom-leaflet-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Icona per le fermate GTT (marker visibile e riconoscibile con icona fermata)
function creaIconaFermata(fermata: FermataVicina, selezionata = false) {
  const nomeTroncato =
    fermata.stop_name.length > 18
      ? fermata.stop_name.substring(0, 16) + '…'
      : fermata.stop_name;

  return L.divIcon({
    html: `
      <div class="marker-fermata-pin ${selezionata ? 'attiva' : ''}">
        <div class="marker-fermata-bubble">
          <span class="marker-fermata-icon">🚏</span>
          <span class="marker-fermata-label">${nomeTroncato}</span>
        </div>
        <div class="marker-fermata-arrow"></div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [120, 36],
    iconAnchor: [60, 36],
  });
}

// Controller per aggiornare e centrare la vista
function CentraMappa({ posizione }: { posizione: Coordiante | null }) {
  const mappa = useMap();
  const primoRender = useRef(true);

  useEffect(() => {
    if (!posizione) return;
    if (primoRender.current) {
      mappa.setView([posizione.lat, posizione.lon], 16, { animate: false });
      primoRender.current = false;
    } else {
      mappa.flyTo([posizione.lat, posizione.lon], mappa.getZoom(), {
        animate: true,
        duration: 0.8,
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

  // Mostra solo le 12 fermate più pertinenti alla zona/posizione
  const fermatePertinenti = fermateVicine.slice(0, 12);

  // Tile CARTO Dark (aperto e gratuito con attribuzione CARTO/OpenStreetMap)
  const tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="mappa-wrapper">
      <MapContainer
        center={centroDipartenza}
        zoom={16}
        scrollWheelZoom={false}
        touchZoom={true}
        dragging={true}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

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
                <div style={{ color: '#16162a', fontSize: '13px', fontWeight: 600 }}>
                  📍 La tua posizione
                </div>
              </Popup>
            </Marker>
            {/* Cerchio di raggio perimetrale */}
            <Circle
              center={[posizione.lat, posizione.lon]}
              radius={60}
              pathOptions={{
                color: '#6366f1',
                fillColor: '#6366f1',
                fillOpacity: 0.12,
                weight: 1.5,
                opacity: 0.5,
              }}
            />
          </>
        )}

        {/* Marker fermate GTFS pertinenti */}
        {fermatePertinenti.map((fermata) => {
          const isSelezionata = fermataSelezionata?.stop_id === fermata.stop_id;
          return (
            <Marker
              key={fermata.stop_id}
              position={[fermata.stop_lat, fermata.stop_lon]}
              icon={creaIconaFermata(fermata, isSelezionata)}
              eventHandlers={{
                click: () => handleFermataClick(fermata),
              }}
              zIndexOffset={isSelezionata ? 600 : 100}
            >
              {isSelezionata && (
                <Popup autoPan={true}>
                  <div style={{ color: '#16162a', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>
                      🚏 {fermata.stop_name}
                    </div>
                    <div style={{ color: '#4f46e5', fontWeight: 600 }}>
                      Distanza: {formattaDistanza(fermata.distanza)}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

        {/* Marker destinazione cercata */}
        {destinazione && (
          <Marker
            position={[destinazione.coords.lat, destinazione.coords.lon]}
            icon={L.divIcon({
              html: '<div class="marker-destinazione-pin">🎯</div>',
              className: 'custom-leaflet-icon',
              iconSize: [36, 36],
              iconAnchor: [18, 36],
            })}
            zIndexOffset={900}
          >
            <Popup>
              <div style={{ color: '#16162a', fontSize: '13px', fontWeight: 600 }}>
                🎯 {destinazione.nome}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
