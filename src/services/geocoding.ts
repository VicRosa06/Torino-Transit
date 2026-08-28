// Servizio geocoding — ricerca indirizzi via Nominatim (OpenStreetMap)
// Gratuito, max 1 req/secondo, attribuzione richiesta

import type { RisultatoRicerca } from '../types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'TorinoTransit/1.0 (assistente-trasporti-torino; non-commercial)';

// Throttle: massimo 1 richiesta al secondo
let ultimaRichiesta = 0;

async function attendiThrottle(): Promise<void> {
  const attesa = 1100 - (Date.now() - ultimaRichiesta);
  if (attesa > 0) {
    await new Promise((r) => setTimeout(r, attesa));
  }
  ultimaRichiesta = Date.now();
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  addresstype: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
  };
}

/**
 * Cerca un indirizzo o luogo a Torino
 */
export async function cercaIndirizzo(
  query: string,
  max = 5
): Promise<RisultatoRicerca[]> {
  if (!query.trim()) return [];

  await attendiThrottle();

  const params = new URLSearchParams({
    q: `${query}, Torino`,
    format: 'json',
    limit: String(max),
    countrycodes: 'it',
    viewbox: '7.5,44.9,7.9,45.2', // Bounding box Torino e dintorni
    bounded: '1',
    addressdetails: '1',
  });

  const risposta = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'it',
    },
  });

  if (!risposta.ok) throw new Error('Geocoding non disponibile');

  const dati: NominatimResult[] = await risposta.json();

  return dati.map((item) => ({
    tipo: 'luogo' as const,
    nome: estraiNomePrincipale(item.display_name),
    descrizione: estraiDescrizioneBreve(item),
    coords: {
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    },
  }));
}

function estraiNomePrincipale(displayName: string): string {
  // Prende solo la prima parte prima della virgola
  return displayName.split(',')[0].trim();
}

function estraiDescrizioneBreve(item: NominatimResult): string {
  const parti: string[] = [];
  const addr = item.address;
  if (addr?.road) parti.push(addr.road);
  if (addr?.suburb) parti.push(addr.suburb);
  if (parti.length === 0) {
    // Fallback: prima 2 parti del display_name
    const sezioni = item.display_name.split(',');
    return sezioni.slice(1, 3).map((s) => s.trim()).join(', ');
  }
  return parti.join(', ');
}

/**
 * Geocoding inverso — da coordinate a indirizzo
 */
export async function invertiCoordinate(
  lat: number,
  lon: number
): Promise<string | null> {
  await attendiThrottle();

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: 'json',
    zoom: '17',
  });

  try {
    const risposta = await fetch(`${NOMINATIM_BASE}/reverse?${params}`, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'it',
      },
    });
    if (!risposta.ok) return null;
    const dati = await risposta.json();
    return dati.display_name ? estraiNomePrincipale(dati.display_name) : null;
  } catch {
    return null;
  }
}
