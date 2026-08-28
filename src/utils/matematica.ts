// Utility matematiche e di formatting

import type { Coordiante } from '../types';

/**
 * Calcola la distanza in metri tra due coordinate (formula Haversine)
 */
export function calcolaDistanza(a: Coordiante, b: Coordiante): number {
  const R = 6371000; // raggio Terra in metri
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lon - a.lon) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return Math.round(R * c);
}

/**
 * Formatta la distanza in modo leggibile
 */
export function formattaDistanza(metri: number): string {
  if (metri < 1000) {
    return `${Math.round(metri / 10) * 10} m`;
  }
  return `${(metri / 1000).toFixed(1)} km`;
}

/**
 * Formatta i minuti in modo leggibile
 */
export function formattaMinuti(minuti: number): string {
  if (minuti < 1) return 'in arrivo';
  if (minuti === 1) return '1 min';
  if (minuti < 60) return `${minuti} min`;
  const ore = Math.floor(minuti / 60);
  const min = minuti % 60;
  if (min === 0) return `${ore} h`;
  return `${ore} h ${min} min`;
}

/**
 * Converte un orario GTFS (HH:MM:SS, anche >24h) in minuti dall'inizio del giorno
 */
export function orarioGTFSInMinuti(orario: string): number {
  const [h, m] = orario.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Converte un orario GTFS in un oggetto Date per oggi
 */
export function orarioGTFSADate(orario: string): Date {
  const [h, m, s] = orario.split(':').map(Number);
  const ora = new Date();
  // GTFS può avere ore >24 per corse notturne che passano la mezzanotte
  ora.setHours(h % 24, m, s || 0, 0);
  return ora;
}

/**
 * Restituisce i minuti da adesso a una data
 */
export function minutiDaAdesso(data: Date): number {
  return Math.round((data.getTime() - Date.now()) / 60000);
}

/**
 * Formatta un orario Date in HH:MM
 */
export function formattaOra(data: Date): string {
  return data.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Data corrente in formato YYYYMMDD (per GTFS calendar)
 */
export function dataOggiGTFS(): string {
  const oggi = new Date();
  const y = oggi.getFullYear();
  const m = String(oggi.getMonth() + 1).padStart(2, '0');
  const d = String(oggi.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Giorno della settimana per GTFS (0=domenica -> mappa su campo calendar)
 */
export function giornoSettimanaGTFS(): keyof { monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean } {
  const giorniMap: Array<'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday'> = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
  ];
  return giorniMap[new Date().getDay()];
}

/**
 * Genera un ID univoco
 */
export function generaId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Tipo mezzo da route_type GTFS
 */
export function tipoMezzo(routeType: number): string {
  switch (routeType) {
    case 0: return 'tram';
    case 1: return 'metro';
    case 3: return 'bus';
    case 109: return 'treno';
    default: return 'bus';
  }
}

/**
 * Emoji mezzo da route_type
 */
export function emojMezzo(routeType: number): string {
  switch (routeType) {
    case 0: return '🚋';
    case 1: return '🚇';
    case 3: return '🚌';
    case 109: return '🚆';
    default: return '🚌';
  }
}

/**
 * CSS class del badge da route_type
 */
export function classeBadge(routeType: number): string {
  switch (routeType) {
    case 0: return 'badge-tram';
    case 1: return 'badge-metro';
    case 3: return 'badge-bus';
    case 109: return 'badge-treno';
    default: return 'badge-bus';
  }
}
