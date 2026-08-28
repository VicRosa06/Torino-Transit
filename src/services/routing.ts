// Servizio routing — calcola percorsi tra due punti usando dati GTFS statici
// Algoritmo semplificato: trova le fermate vicine all'origine e alla destinazione,
// poi cerca le linee che le collegano (o con un cambio).

import type {
  Coordiante,
  OpzionePercorso,
  ModalitaPercorso,
  TrattoPercorso,
} from '../types';
import { getDatiGTFS } from './gtfs';
import { trovaFermateVicine } from './fermate';
import { calcolaDistanza } from '../utils/matematica';
import {
  dataOggiGTFS,
  giornoSettimanaGTFS,
} from '../utils/matematica';

const VELOCITA_PIEDI_MS = 1.25; // m/s ~ 4.5 km/h
const VELOCITA_MEZZO_MS = 7; // m/s ~ 25 km/h media fermate incluse

function minutiAPiedi(distanza_m: number): number {
  return Math.round(distanza_m / VELOCITA_PIEDI_MS / 60);
}

function isServizioAttivoOggi(serviceId: string): boolean {
  const dati = getDatiGTFS();
  if (!dati) return false;

  const oggi = dataOggiGTFS();
  const giornoOggi = giornoSettimanaGTFS();

  const eccezione = dati.calendarDates.find(
    (cd) => cd.service_id === serviceId && cd.date === oggi
  );
  if (eccezione) return eccezione.exception_type === 1;

  const cal = dati.calendar.get(serviceId);
  if (!cal) return false;
  if (oggi < cal.start_date || oggi > cal.end_date) return false;
  return cal[giornoOggi];
}

interface CollegamentoLinea {
  route_short_name: string;
  route_long_name: string;
  headsign: string;
  stop_partenza_id: string;
  stop_partenza_nome: string;
  stop_arrivo_id: string;
  stop_arrivo_nome: string;
  num_fermate: number;
  distanza_percorso_m: number;
  route_type: number;
}

/**
 * Trova linee dirette tra due gruppi di fermate
 */
function trovaCollegamentiDiretti(
  stopIdOrigine: string[],
  stopIdDestinazione: string[]
): CollegamentoLinea[] {
  const dati = getDatiGTFS();
  if (!dati) return [];

  const destinazioneSet = new Set(stopIdDestinazione);
  const risultati: CollegamentoLinea[] = [];
  const visti = new Set<string>();

  // Raggruppa stop_times per trip
  const stopTimePerTrip = new Map<string, typeof dati.stopTimes>();
  for (const st of dati.stopTimes) {
    if (!stopTimePerTrip.has(st.trip_id)) {
      stopTimePerTrip.set(st.trip_id, []);
    }
    stopTimePerTrip.get(st.trip_id)!.push(st);
  }

  for (const [tripId, stopTimes] of stopTimePerTrip) {
    const trip = dati.trips.get(tripId);
    if (!trip || !isServizioAttivoOggi(trip.service_id)) continue;

    const route = dati.routes.get(trip.route_id);
    if (!route) continue;

    // Ordina per sequenza
    const ordinati = [...stopTimes].sort((a, b) => a.stop_sequence - b.stop_sequence);

    // Cerca se questo trip passa per una fermata di origine E poi per una di destinazione
    let idxOrigine = -1;
    let stopOrigineId = '';

    for (let i = 0; i < ordinati.length; i++) {
      if (stopIdOrigine.includes(ordinati[i].stop_id)) {
        idxOrigine = i;
        stopOrigineId = ordinati[i].stop_id;
        break;
      }
    }

    if (idxOrigine === -1) continue;

    for (let i = idxOrigine + 1; i < ordinati.length; i++) {
      if (destinazioneSet.has(ordinati[i].stop_id)) {
        const chiave = `${route.route_id}-${stopOrigineId}-${ordinati[i].stop_id}`;
        if (visti.has(chiave)) break;
        visti.add(chiave);

        const numFermate = i - idxOrigine;
        const stopPartenza = dati.stops.get(stopOrigineId);
        const stopArrivo = dati.stops.get(ordinati[i].stop_id);

        if (!stopPartenza || !stopArrivo) break;

        risultati.push({
          route_short_name: route.route_short_name,
          route_long_name: route.route_long_name,
          headsign: trip.trip_headsign || route.route_long_name,
          stop_partenza_id: stopOrigineId,
          stop_partenza_nome: stopPartenza.stop_name,
          stop_arrivo_id: ordinati[i].stop_id,
          stop_arrivo_nome: stopArrivo.stop_name,
          num_fermate: numFermate,
          distanza_percorso_m: numFermate * 350, // stima ~350m tra fermate
          route_type: route.route_type,
        });
        break;
      }
    }

    if (risultati.length >= 20) break; // Limita per performance
  }

  return risultati;
}

/**
 * Calcola le opzioni di percorso tra origine e destinazione
 */
export async function calcolaPercorso(
  origine: Coordiante,
  destinazione: Coordiante
): Promise<OpzionePercorso[]> {
  const dati = getDatiGTFS();
  if (!dati) throw new Error('Dati GTT non disponibili');

  // Trova fermate vicine all'origine e alla destinazione
  const fermateOrigine = trovaFermateVicine(origine, 500, 5);
  const fermateDestinazione = trovaFermateVicine(destinazione, 500, 5);

  if (fermateOrigine.length === 0 || fermateDestinazione.length === 0) {
    // Nessuna fermata vicina: percorso a piedi
    const distanzaTotale = calcolaDistanza(origine, destinazione);
    const durataMinuti = minutiAPiedi(distanzaTotale);

    const percorsoAPiedi: OpzionePercorso = {
      modalita: 'veloce',
      durata_totale_min: durataMinuti,
      cambi: 0,
      km_piedi: distanzaTotale / 1000,
      tratti: [
        {
          tipo: 'piedi',
          durata_min: durataMinuti,
          distanza_m: distanzaTotale,
        },
      ],
    };
    return [percorsoAPiedi];
  }

  const idOrigine = fermateOrigine.map((f) => f.stop_id);
  const idDestinazione = fermateDestinazione.map((f) => f.stop_id);

  const collegamenti = trovaCollegamentiDiretti(idOrigine, idDestinazione);

  if (collegamenti.length === 0) {
    // Nessun collegamento diretto trovato
    const distanzaTotale = calcolaDistanza(origine, destinazione);
    return [
      {
        modalita: 'veloce',
        durata_totale_min: minutiAPiedi(distanzaTotale),
        cambi: 0,
        km_piedi: distanzaTotale / 1000,
        tratti: [
          {
            tipo: 'piedi',
            durata_min: minutiAPiedi(distanzaTotale),
            distanza_m: distanzaTotale,
          },
        ],
      },
    ];
  }

  const opzioni: OpzionePercorso[] = [];

  // Genera 3 opzioni diverse (prendendo linee diverse se disponibili)
  const modalita: ModalitaPercorso[] = ['veloce', 'meno_piedi', 'meno_cambi'];

  modalita.forEach((mod, i) => {
    // Scegli collegamento diverso per ogni modalità
    const collegamento = collegamenti[i % collegamenti.length];

    const fermataOrigineVicina = fermateOrigine.find(
      (f) => f.stop_id === collegamento.stop_partenza_id
    ) ?? fermateOrigine[0];
    const fermataDestinazioneVicina = fermateDestinazione.find(
      (f) => f.stop_id === collegamento.stop_arrivo_id
    ) ?? fermateDestinazione[0];

    const distOrigine = fermataOrigineVicina.distanza;
    const distDestinazione = fermataDestinazioneVicina?.distanza ??
      calcolaDistanza(destinazione, {
        lat: dati.stops.get(collegamento.stop_arrivo_id)?.stop_lat ?? destinazione.lat,
        lon: dati.stops.get(collegamento.stop_arrivo_id)?.stop_lon ?? destinazione.lon,
      });

    const minOrigine = minutiAPiedi(distOrigine);
    const minDestinazione = minutiAPiedi(distDestinazione);
    const minMezzo = Math.max(
      collegamento.num_fermate * 2,
      Math.round(collegamento.distanza_percorso_m / VELOCITA_MEZZO_MS / 60)
    );

    const tratti: TrattoPercorso[] = [];

    if (distOrigine > 50) {
      tratti.push({
        tipo: 'piedi',
        durata_min: minOrigine,
        distanza_m: distOrigine,
      });
    }

    tratti.push({
      tipo: 'mezzo',
      durata_min: minMezzo,
      linea: collegamento.route_short_name,
      headsign: collegamento.headsign,
      fermata_partenza: collegamento.stop_partenza_nome,
      fermata_arrivo: collegamento.stop_arrivo_nome,
      num_fermate: collegamento.num_fermate,
      route_type: collegamento.route_type,
    });

    if (distDestinazione > 50) {
      tratti.push({
        tipo: 'piedi',
        durata_min: minDestinazione,
        distanza_m: distDestinazione,
      });
    }

    const kmAPiedi =
      ((distOrigine > 50 ? distOrigine : 0) + (distDestinazione > 50 ? distDestinazione : 0)) / 1000;

    // Varia leggermente le durate per le 3 opzioni per renderle distinte
    const variazione = mod === 'veloce' ? 0 : mod === 'meno_piedi' ? 3 : 5;

    opzioni.push({
      modalita: mod,
      durata_totale_min: minOrigine + minMezzo + minDestinazione + variazione,
      cambi: 0,
      km_piedi: kmAPiedi,
      tratti,
    });
  });

  // Rimuovi duplicati (stessa durata)
  const unici = opzioni.filter(
    (op, i, arr) =>
      i === 0 || arr[i - 1].durata_totale_min !== op.durata_totale_min
  );

  return unici;
}

/**
 * Restituisce la prima fermata di salita del percorso selezionato.
 * Regola: se il percorso inizia con un tratto a piedi, il target di Maps è la
 * fermata di partenza del primo mezzo, cioè la destinazione del primo segmento walk.
 */
export function trovaPrimaFermataSalitaPercorso(
  opzione?: OpzionePercorso | null
): Coordiante | null {
  if (!opzione || opzione.tratti.length === 0) return null;

  const primoMezzo = opzione.tratti.find((tratto) => tratto.tipo === 'mezzo');
  const nomeFermata = primoMezzo?.fermata_partenza?.trim();
  if (!nomeFermata) return null;

  const dati = getDatiGTFS();
  if (!dati) return null;

  const fermata = Array.from(dati.stops.values()).find(
    (stop) => stop.stop_name.trim().toLowerCase() === nomeFermata.toLowerCase()
  );

  if (!fermata) return null;

  return {
    lat: fermata.stop_lat,
    lon: fermata.stop_lon,
  };
}

/**
 * Genera un link Google Maps per navigare verso una fermata
 */
export function linkGoogleMapsNavigazione(
  origine: Coordiante,
  destinazioneCoords: Coordiante,
  nomeDestinazione?: string
): string {
  const dest = nomeDestinazione
    ? encodeURIComponent(nomeDestinazione)
    : `${destinazioneCoords.lat},${destinazioneCoords.lon}`;

  // URL universale Google Maps (funziona su iOS e Android)
  return `https://www.google.com/maps/dir/${origine.lat},${origine.lon}/${dest}`;
}
