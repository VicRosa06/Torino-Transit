// Costanti posizioni simulate per il testing
// Coordinate verificate su OpenStreetMap

import type { PosizioneSimulata } from '../types';

export const POSIZIONI_SIMULATE: PosizioneSimulata[] = [
  {
    nome: 'Porta Susa',
    coords: { lat: 45.0707, lon: 7.6668 },
    descrizione: 'Stazione ferroviaria e metropolitana',
  },
  {
    nome: 'Piazza Castello',
    coords: { lat: 45.0706, lon: 7.6858 },
    descrizione: 'Centro storico, cuore di Torino',
  },
  {
    nome: 'Palazzo Nuovo — Università',
    coords: { lat: 45.0647, lon: 7.6867 },
    descrizione: 'Via G. Verdi 8 — Facoltà di Lettere',
  },
  {
    nome: 'Piazza Vittorio Veneto',
    coords: { lat: 45.0638, lon: 7.6930 },
    descrizione: 'Lungo Po — una delle piazze più grandi d\'Europa',
  },
  {
    nome: 'Lingotto',
    coords: { lat: 45.0345, lon: 7.6619 },
    descrizione: 'Zona sud — ex fabbrica FIAT',
  },
];

export const CENTRO_TORINO = { lat: 45.0703, lon: 7.6869 };
export const RAGGIO_FERMATE_VICINE = 600; // metri
export const MAX_FERMATE_VICINE = 8;
export const GTFS_URL = 'https://www.gtt.to.it/open_data/gtt_gtfs.zip';
export const GTFS_CACHE_KEY = 'torino_transit_gtfs_v1';
export const GTFS_CACHE_DATE_KEY = 'torino_transit_gtfs_date_v1';
export const GTFS_CACHE_MAX_AGE_DAYS = 3;
export const PREFERITI_KEY = 'torino_transit_preferiti_v1';
export const POSIZIONE_SIMULATA_KEY = 'torino_transit_posizione_sim_v1';
export const MODALITA_POSIZIONE_KEY = 'torino_transit_modalita_pos_v1';
