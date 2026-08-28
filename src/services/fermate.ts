// Servizio fermate — trova fermate vicine e orari
// Opera sui dati GTFS in memoria

import type { Stop, FermataVicina, PartenzaFermata, Coordiante } from '../types';
import { calcolaDistanza } from '../utils/matematica';
import { RAGGIO_FERMATE_VICINE, MAX_FERMATE_VICINE } from '../utils/costanti';
import { getDatiGTFS } from './gtfs';
import {
  orarioGTFSADate,
  minutiDaAdesso,
  giornoSettimanaGTFS,
  dataOggiGTFS,
} from '../utils/matematica';

/**
 * Trova le fermate vicine a una coordinata, ordinate per distanza
 */
export function trovaFermateVicine(
  posizione: Coordiante,
  raggio = RAGGIO_FERMATE_VICINE,
  max = MAX_FERMATE_VICINE
): FermataVicina[] {
  const dati = getDatiGTFS();
  if (!dati) return [];

  const fermate: FermataVicina[] = [];

  dati.stops.forEach((stop) => {
    const dist = calcolaDistanza(posizione, {
      lat: stop.stop_lat,
      lon: stop.stop_lon,
    });
    if (dist <= raggio) {
      fermate.push({ ...stop, distanza: dist });
    }
  });

  return fermate
    .sort((a, b) => a.distanza - b.distanza)
    .slice(0, max);
}

/**
 * Determina se un service_id è attivo oggi
 */
function isServizioAttivoOggi(serviceId: string): boolean {
  const dati = getDatiGTFS();
  if (!dati) return false;

  const oggi = dataOggiGTFS();
  const giornoOggi = giornoSettimanaGTFS();

  // Controlla eccezioni calendar_dates
  const eccezione = dati.calendarDates.find(
    (cd) => cd.service_id === serviceId && cd.date === oggi
  );
  if (eccezione) {
    return eccezione.exception_type === 1; // 1=aggiunto, 2=rimosso
  }

  // Controlla calendario regolare
  const cal = dati.calendar.get(serviceId);
  if (!cal) return false;

  // Verifica date di validità
  if (oggi < cal.start_date || oggi > cal.end_date) return false;

  return cal[giornoOggi];
}

/**
 * Carica le prossime partenze da una fermata (prossime 2 ore)
 */
export function caricaPartenzeFermata(
  stopId: string,
  minutiAnticipo = 120,
  maxPartenze = 10
): PartenzaFermata[] {
  const dati = getDatiGTFS();
  if (!dati) return [];

  const adesso = new Date();
  const limite = new Date(adesso.getTime() + minutiAnticipo * 60000);

  const partenze: PartenzaFermata[] = [];

  // Trova tutti gli stop_times per questa fermata
  for (const st of dati.stopTimes) {
    if (st.stop_id !== stopId) continue;

    // Controlla se il trip è attivo oggi
    const trip = dati.trips.get(st.trip_id);
    if (!trip) continue;

    if (!isServizioAttivoOggi(trip.service_id)) continue;

    // Converti orario
    const oraPartenza = orarioGTFSADate(st.departure_time);
    if (oraPartenza < adesso || oraPartenza > limite) continue;

    const route = dati.routes.get(trip.route_id);
    if (!route) continue;

    partenze.push({
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      headsign: trip.trip_headsign || route.route_long_name,
      oraPartenza,
      minutiArrivo: Math.max(0, minutiDaAdesso(oraPartenza)),
      tipo: 'programmato',
      route_type: route.route_type,
    });

    if (partenze.length >= maxPartenze * 3) break; // prefiltra per performance
  }

  // Ordina per orario, rimuovi duplicati (stessa linea stessa ora)
  const visti = new Set<string>();
  return partenze
    .sort((a, b) => a.oraPartenza.getTime() - b.oraPartenza.getTime())
    .filter((p) => {
      const chiave = `${p.route_short_name}-${p.headsign}-${p.minutiArrivo}`;
      if (visti.has(chiave)) return false;
      visti.add(chiave);
      return true;
    })
    .slice(0, maxPartenze);
}

/**
 * Cerca fermate per nome (ricerca fuzzy)
 */
export function cercaFermatePerNome(
  query: string,
  max = 8
): Stop[] {
  const dati = getDatiGTFS();
  if (!dati || !query.trim()) return [];

  const q = query.toLowerCase().trim();
  const risultati: Array<{ stop: Stop; score: number }> = [];

  dati.stops.forEach((stop) => {
    const nome = stop.stop_name.toLowerCase();
    if (nome.includes(q)) {
      const score = nome.startsWith(q) ? 0 : 1;
      risultati.push({ stop, score });
    }
  });

  return risultati
    .sort((a, b) => a.score - b.score || a.stop.stop_name.localeCompare(b.stop.stop_name))
    .slice(0, max)
    .map((r) => r.stop);
}
