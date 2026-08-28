// Servizio di storage locale (localStorage)
// Gestisce preferiti, impostazioni, cache GTFS

import type { Preferito, PosizioneSimulata, ModalitaPosizione } from '../types';
import {
  PREFERITI_KEY,
  POSIZIONE_SIMULATA_KEY,
  MODALITA_POSIZIONE_KEY,
  POSIZIONI_SIMULATE,
} from '../utils/costanti';

// ==============================
// Preferiti
// ==============================

export function caricaPreferiti(): Preferito[] {
  try {
    const raw = localStorage.getItem(PREFERITI_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Preferito[];
  } catch {
    return [];
  }
}

export function salvaPreferiti(preferiti: Preferito[]): void {
  localStorage.setItem(PREFERITI_KEY, JSON.stringify(preferiti));
}

export function aggiungiPreferito(preferito: Preferito): Preferito[] {
  const lista = caricaPreferiti();
  // Evita duplicati per stop_id o coordinate identiche
  const esiste = lista.some(
    (p) =>
      (preferito.stop_id && p.stop_id === preferito.stop_id) ||
      (p.coords.lat === preferito.coords.lat && p.coords.lon === preferito.coords.lon)
  );
  if (esiste) return lista;
  const nuova = [...lista, preferito];
  salvaPreferiti(nuova);
  return nuova;
}

export function rimuoviPreferito(id: string): Preferito[] {
  const lista = caricaPreferiti().filter((p) => p.id !== id);
  salvaPreferiti(lista);
  return lista;
}

export function rinominaPreferito(id: string, nuovoNome: string): Preferito[] {
  const lista = caricaPreferiti().map((p) =>
    p.id === id ? { ...p, nome: nuovoNome } : p
  );
  salvaPreferiti(lista);
  return lista;
}

// ==============================
// Posizione simulata
// ==============================

export function caricaPosizioneSimulata(): PosizioneSimulata {
  try {
    const raw = localStorage.getItem(POSIZIONE_SIMULATA_KEY);
    if (raw) return JSON.parse(raw) as PosizioneSimulata;
  } catch {
    // fallback default
  }
  return POSIZIONI_SIMULATE[0]; // Porta Susa come default
}

export function salvaPosizioneSimulata(posizione: PosizioneSimulata): void {
  localStorage.setItem(POSIZIONE_SIMULATA_KEY, JSON.stringify(posizione));
}

// ==============================
// Modalità posizione
// ==============================

export function caricaModalitaPosizione(): ModalitaPosizione {
  const raw = localStorage.getItem(MODALITA_POSIZIONE_KEY);
  if (raw === 'gps' || raw === 'simulata') return raw;
  return 'simulata'; // default sicuro (utente non a Torino)
}

export function salvaModalitaPosizione(modalita: ModalitaPosizione): void {
  localStorage.setItem(MODALITA_POSIZIONE_KEY, modalita);
}
