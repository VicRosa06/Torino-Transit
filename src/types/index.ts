// Tipi principali per l'app Torino Transit

// ==============================
// GTFS Tipi
// ==============================

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  stop_code?: string;
  zone_id?: string;
  distanza?: number; // calcolata, in metri
}

export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number; // 0=tram, 1=metro, 3=bus, 109=treno
  route_color?: string;
  route_text_color?: string;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  direction_id?: number;
  shape_id?: string;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;  // HH:MM:SS
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
}

export interface CalendarEntry {
  service_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_date: string; // YYYYMMDD
  end_date: string;
}

export interface CalendarDate {
  service_id: string;
  date: string; // YYYYMMDD
  exception_type: number; // 1=aggiunto, 2=rimosso
}

// ==============================
// App Tipi
// ==============================

export interface Coordiante {
  lat: number;
  lon: number;
}

export interface PosizioneSorgente {
  tipo: 'gps' | 'simulata';
  coords: Coordiante;
  nomeSim?: string; // solo per simulata
}

export type ModalitaPosizione = 'gps' | 'simulata';

export interface PosizioneSimulata {
  nome: string;
  coords: Coordiante;
  descrizione?: string;
}

export interface FermataVicina extends Stop {
  distanza: number; // in metri
  prossimePartenze?: PartenzaFermata[];
}

export interface PartenzaFermata {
  route_short_name: string;
  route_long_name: string;
  headsign: string;
  oraPartenza: Date;
  minutiArrivo: number; // minuti da adesso
  tipo: 'programmato'; // 'realtime' in futuro
  route_type: number;
}

export interface Preferito {
  id: string;
  nome: string;
  tipo: 'fermata' | 'luogo';
  coords: Coordiante;
  stop_id?: string;
  indirizzo?: string;
  creatoIl: string; // ISO date string
}

// ==============================
// Percorso
// ==============================

export type ModalitaPercorso = 'veloce' | 'meno_piedi' | 'meno_cambi';

export interface TrattoPercorso {
  tipo: 'piedi' | 'mezzo';
  durata_min: number;
  distanza_m?: number;
  // per tipo mezzo:
  linea?: string;
  headsign?: string;
  fermata_partenza?: string;
  fermata_arrivo?: string;
  num_fermate?: number;
  route_type?: number;
}

export interface OpzionePercorso {
  modalita: ModalitaPercorso;
  durata_totale_min: number;
  cambi: number;
  km_piedi: number;
  tratti: TrattoPercorso[];
}

// ==============================
// Stato Applicazione
// ==============================

export type StatoGTFS = 'non_caricato' | 'caricamento' | 'pronto' | 'errore';
export type StatoPosizione = 'rilevamento' | 'ok' | 'negato' | 'non_disponibile' | 'timeout';

export interface RisultatoRicerca {
  tipo: 'fermata' | 'luogo';
  nome: string;
  descrizione?: string;
  coords: Coordiante;
  stop_id?: string;
}
