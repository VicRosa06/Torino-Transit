// Servizio GTFS — parsing e accesso ai dati GTT
// Scarica il GTFS .zip, estrae i CSV, li parsa e li mette in cache

import JSZip from 'jszip';
import type {
  Stop,
  Route,
  Trip,
  StopTime,
  CalendarEntry,
  CalendarDate,
} from '../types';
import {
  GTFS_URL,
  GTFS_CACHE_KEY,
  GTFS_CACHE_DATE_KEY,
  GTFS_CACHE_MAX_AGE_DAYS,
} from '../utils/costanti';

// ==============================
// Struttura dati in memoria
// ==============================

export interface DatiGTFS {
  stops: Map<string, Stop>;
  routes: Map<string, Route>;
  trips: Map<string, Trip>;
  stopTimes: StopTime[];
  calendar: Map<string, CalendarEntry>;
  calendarDates: CalendarDate[];
  caricatoIl: Date;
}

let datiInMemoria: DatiGTFS | null = null;

// ==============================
// Parsing CSV
// ==============================

function parsaCSV(testo: string): Record<string, string>[] {
  const righe = testo.trim().split('\n');
  if (righe.length < 2) return [];
  
  // Gestisci BOM UTF-8
  const headerLine = righe[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map((h) => h.trim().replace(/"/g, ''));
  
  return righe.slice(1).map((riga) => {
    const valori = parseRigaCSV(riga);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (valori[i] || '').trim().replace(/"/g, '');
    });
    return obj;
  });
}

function parseRigaCSV(riga: string): string[] {
  const risultato: string[] = [];
  let corrente = '';
  let inQuote = false;
  for (let i = 0; i < riga.length; i++) {
    const c = riga[i];
    if (c === '"') {
      inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      risultato.push(corrente);
      corrente = '';
    } else {
      corrente += c;
    }
  }
  risultato.push(corrente);
  return risultato;
}

// ==============================
// Cache locale (IndexedDB-less, solo metadati in localStorage)
// ==============================

export function èCacheValida(): boolean {
  const dataStr = localStorage.getItem(GTFS_CACHE_DATE_KEY);
  if (!dataStr) return false;
  const data = new Date(dataStr);
  const gg = (Date.now() - data.getTime()) / (1000 * 60 * 60 * 24);
  return gg < GTFS_CACHE_MAX_AGE_DAYS;
}

// Per dati grandi usiamo sessionStorage + flag per non riscaricare
// La cache vera (zip parsato) resta in memoria durante la sessione
let cacheSessioneValida = false;

// ==============================
// Caricamento GTFS
// ==============================

export type CallbackProgresso = (messaggio: string, percentuale: number) => void;

export async function caricaGTFS(
  onProgresso?: CallbackProgresso
): Promise<DatiGTFS> {
  // Se già in memoria, restituisci subito
  if (datiInMemoria && cacheSessioneValida) {
    return datiInMemoria;
  }

  onProgresso?.('Scaricamento dati GTT in corso…', 5);

  // Fetch del file GTFS con CORS proxy (necessario perché GTT non manda CORS headers)
  // Usiamo un proxy CORS pubblico free per il GTFS statico (non contiene dati sensibili)
  const PROXY = 'https://corsproxy.io/?';
  let response: Response;
  
  try {
    try {
      response = await fetch(`${PROXY}${encodeURIComponent(GTFS_URL)}`, {
        signal: AbortSignal.timeout(15000), // 15s timeout
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch {
      // Fallback: prova direttamente
      response = await fetch(GTFS_URL, {
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    }

    onProgresso?.('Download completato. Decompressione…', 40);

    const buffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    onProgresso?.('Caricamento fermate…', 55);
    const stopsCSV = await zip.file('stops.txt')?.async('string') ?? '';
    const stops = new Map<string, Stop>();
    parsaCSV(stopsCSV).forEach((r) => {
      if (r.stop_id && r.stop_lat && r.stop_lon) {
        stops.set(r.stop_id, {
          stop_id: r.stop_id,
          stop_name: r.stop_name || r.stop_id,
          stop_lat: parseFloat(r.stop_lat),
          stop_lon: parseFloat(r.stop_lon),
          stop_code: r.stop_code,
          zone_id: r.zone_id,
        });
      }
    });

    onProgresso?.('Caricamento linee…', 65);
    const routesCSV = await zip.file('routes.txt')?.async('string') ?? '';
    const routes = new Map<string, Route>();
    parsaCSV(routesCSV).forEach((r) => {
      if (r.route_id) {
        routes.set(r.route_id, {
          route_id: r.route_id,
          route_short_name: r.route_short_name || '',
          route_long_name: r.route_long_name || '',
          route_type: parseInt(r.route_type || '3', 10),
          route_color: r.route_color,
          route_text_color: r.route_text_color,
        });
      }
    });

    onProgresso?.('Caricamento corse…', 75);
    const tripsCSV = await zip.file('trips.txt')?.async('string') ?? '';
    const trips = new Map<string, Trip>();
    parsaCSV(tripsCSV).forEach((r) => {
      if (r.trip_id) {
        trips.set(r.trip_id, {
          trip_id: r.trip_id,
          route_id: r.route_id || '',
          service_id: r.service_id || '',
          trip_headsign: r.trip_headsign,
          direction_id: r.direction_id ? parseInt(r.direction_id, 10) : undefined,
          shape_id: r.shape_id,
        });
      }
    });

    onProgresso?.('Caricamento orari…', 85);
    const stopTimesCSV = await zip.file('stop_times.txt')?.async('string') ?? '';
    const stopTimes: StopTime[] = parsaCSV(stopTimesCSV)
      .filter((r) => r.trip_id && r.stop_id && r.departure_time)
      .map((r) => ({
        trip_id: r.trip_id,
        arrival_time: r.arrival_time || r.departure_time,
        departure_time: r.departure_time,
        stop_id: r.stop_id,
        stop_sequence: parseInt(r.stop_sequence || '0', 10),
      }));

    onProgresso?.('Caricamento calendario…', 92);
    const calendarCSV = await zip.file('calendar.txt')?.async('string') ?? '';
    const calendar = new Map<string, CalendarEntry>();
    parsaCSV(calendarCSV).forEach((r) => {
      if (r.service_id) {
        calendar.set(r.service_id, {
          service_id: r.service_id,
          monday: r.monday === '1',
          tuesday: r.tuesday === '1',
          wednesday: r.wednesday === '1',
          thursday: r.thursday === '1',
          friday: r.friday === '1',
          saturday: r.saturday === '1',
          sunday: r.sunday === '1',
          start_date: r.start_date || '',
          end_date: r.end_date || '',
        });
      }
    });

    onProgresso?.('Caricamento eccezioni calendario…', 96);
    const calendarDatesCSV = await zip.file('calendar_dates.txt')?.async('string') ?? '';
    const calendarDates: CalendarDate[] = parsaCSV(calendarDatesCSV)
      .filter((r) => r.service_id && r.date)
      .map((r) => ({
        service_id: r.service_id,
        date: r.date,
        exception_type: parseInt(r.exception_type || '1', 10),
      }));

    datiInMemoria = {
      stops,
      routes,
      trips,
      stopTimes,
      calendar,
      calendarDates,
      caricatoIl: new Date(),
    };
  } catch (err) {
    // Caricamento Fallback Integrato (Palazzo Nuovo, Porta Susa, Castello, ecc.)
    onProgresso?.('Attivazione dataset locale Torino…', 70);
    const { FERMATE_FALLBACK, LINEE_FALLBACK, CALENDARIO_FALLBACK, generaOrariFallback } =
      await import('../utils/fallbackData');

    const stops = new Map<string, Stop>();
    FERMATE_FALLBACK.forEach((s) => stops.set(s.stop_id, s));

    const routes = new Map<string, Route>();
    LINEE_FALLBACK.forEach((r) => routes.set(r.route_id, r));

    const calendar = new Map<string, CalendarEntry>();
    CALENDARIO_FALLBACK.forEach((c) => calendar.set(c.service_id, c));

    const { trips: fTrips, stopTimes: fStopTimes } = generaOrariFallback();
    const trips = new Map<string, Trip>();
    fTrips.forEach((t) => trips.set(t.trip_id, t));

    datiInMemoria = {
      stops,
      routes,
      trips,
      stopTimes: fStopTimes,
      calendar,
      calendarDates: [],
      caricatoIl: new Date(),
    };
  }
  cacheSessioneValida = true;

  // Segna la data di caricamento in localStorage
  localStorage.setItem(GTFS_CACHE_DATE_KEY, new Date().toISOString());
  localStorage.setItem(GTFS_CACHE_KEY, 'ok');

  onProgresso?.('Dati GTT caricati con successo!', 100);
  return datiInMemoria;
}

/**
 * Restituisce i dati GTFS attualmente in memoria (null se non caricati)
 */
export function getDatiGTFS(): DatiGTFS | null {
  return datiInMemoria;
}

/**
 * Invalida la cache in memoria (forza ricaricamento al prossimo accesso)
 */
export function invalidaCache(): void {
  cacheSessioneValida = false;
  datiInMemoria = null;
  localStorage.removeItem(GTFS_CACHE_KEY);
  localStorage.removeItem(GTFS_CACHE_DATE_KEY);
}

/**
 * Controlla se i dati sono stati caricati in questa sessione
 */
export function datiPronti(): boolean {
  return cacheSessioneValida && datiInMemoria !== null;
}
