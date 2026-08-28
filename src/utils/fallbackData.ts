// Dati di fallback per Torino Transit
// Include le principali fermate e linee di Torino (Porta Susa, Palazzo Nuovo, Piazza Castello, Lingotto, ecc.)
// Usato se il download del GTFS completo fallisce o è offline

import type { Stop, Route, Trip, StopTime, CalendarEntry } from '../types';

export const FERMATE_FALLBACK: Stop[] = [
  // Zona Porta Susa
  { stop_id: '1001', stop_name: 'Porta Susa FS', stop_lat: 45.0707, stop_lon: 7.6668, stop_code: 'PS1' },
  { stop_id: '1002', stop_name: 'Porta Susa Capolinea (XVIII Dicembre)', stop_lat: 45.0718, stop_lon: 7.6685, stop_code: 'PS2' },
  { stop_id: '1003', stop_name: 'Cernaia', stop_lat: 45.0712, stop_lon: 7.6730, stop_code: 'CER' },
  { stop_id: '1004', stop_name: 'Siccardi', stop_lat: 45.0710, stop_lon: 7.6775, stop_code: 'SIC' },

  // Zona Centro / Piazza Castello
  { stop_id: '1010', stop_name: 'Castello', stop_lat: 45.0706, stop_lon: 7.6858, stop_code: 'CAS' },
  { stop_id: '1011', stop_name: 'Garibaldi', stop_lat: 45.0715, stop_lon: 7.6820, stop_code: 'GAR' },
  { stop_id: '1012', stop_name: 'Bertola', stop_lat: 45.0688, stop_lon: 7.6815, stop_code: 'BER' },
  { stop_id: '1013', stop_name: 'Roma', stop_lat: 45.0675, stop_lon: 7.6830, stop_code: 'ROM' },

  // Zona Palazzo Nuovo / Università (Via Verdi)
  { stop_id: '1020', stop_name: 'Palazzo Nuovo (Via Verdi)', stop_lat: 45.0647, stop_lon: 7.6867, stop_code: 'PN1' },
  { stop_id: '1021', stop_name: 'Sant\'Ottavio (Università)', stop_lat: 45.0655, stop_lon: 7.6890, stop_code: 'SO1' },
  { stop_id: '1022', stop_name: 'Rossini', stop_lat: 45.0665, stop_lon: 7.6880, stop_code: 'ROS' },
  { stop_id: '1023', stop_name: 'Mole Antonelliana', stop_lat: 45.0690, stop_lon: 7.6931, stop_code: 'MOL' },

  // Zona Piazza Vittorio Veneto
  { stop_id: '1030', stop_name: 'Piazza Vittorio Veneto', stop_lat: 45.0638, stop_lon: 7.6930, stop_code: 'PVV' },
  { stop_id: '1031', stop_name: 'Gran Madre', stop_lat: 45.0615, stop_lon: 7.6980, stop_code: 'GMA' },
  { stop_id: '1032', stop_name: 'Vanchiglia', stop_lat: 45.0670, stop_lon: 7.6960, stop_code: 'VAN' },

  // Zona Lingotto
  { stop_id: '1040', stop_name: 'Lingotto Expo', stop_lat: 45.0345, stop_lon: 7.6619, stop_code: 'LIN' },
  { stop_id: '1041', stop_name: 'Metro Lingotto', stop_lat: 45.0335, stop_lon: 7.6610, stop_code: 'MLI' },
  { stop_id: '1042', stop_name: 'Spezia', stop_lat: 45.0420, stop_lon: 7.6650, stop_code: 'SPE' },
  { stop_id: '1043', stop_name: 'Carducci-Molinette', stop_lat: 45.0470, stop_lon: 7.6670, stop_code: 'CAR' },

  // Metro / Stazioni principali
  { stop_id: '1050', stop_name: 'Porta Nuova FS / Metro', stop_lat: 45.0620, stop_lon: 7.6785, stop_code: 'PNU' },
  { stop_id: '1051', stop_name: 'Re Umberto', stop_lat: 45.0645, stop_lon: 7.6740, stop_code: 'RUM' },
  { stop_id: '1052', stop_name: 'Vinzaglio', stop_lat: 45.0675, stop_lon: 7.6690, stop_code: 'VIN' },
];

export const LINEE_FALLBACK: Route[] = [
  { route_id: 'M1', route_short_name: 'M1', route_long_name: 'Fermi - Bengasi (Metropolitana)', route_type: 1, route_color: 'ec4899' },
  { route_id: '4', route_short_name: '4', route_long_name: 'Falchera - Drosso (Tram)', route_type: 0, route_color: 'f59e0b' },
  { route_id: '13', route_short_name: '13', route_long_name: 'Campanella - Gran Madre (Tram/Bus)', route_type: 0, route_color: 'f59e0b' },
  { route_id: '15', route_short_name: '15', route_long_name: 'Corradini - Tortona (Tram)', route_type: 0, route_color: 'f59e0b' },
  { route_id: '18', route_short_name: '18', route_long_name: 'Settembrini - Sofia (Bus)', route_type: 3, route_color: '6366f1' },
  { route_id: '55', route_short_name: '55', route_long_name: 'Grugliasco - Vanchiglia (Bus)', route_type: 3, route_color: '6366f1' },
  { route_id: '56', route_short_name: '56', route_long_name: 'Grugliasco - Tabacchi (Bus)', route_type: 3, route_color: '6366f1' },
  { route_id: '68', route_short_name: '68', route_long_name: 'Frejus - San Mauro (Bus)', route_type: 3, route_color: '6366f1' },
];

export const CALENDARIO_FALLBACK: CalendarEntry[] = [
  {
    service_id: 'SERVIZIO_BASE',
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
    start_date: '20240101',
    end_date: '20301231',
  },
];

/**
 * Genera trips e orari realistici distribuiti nelle 24h per le linee di fallback
 */
export function generaOrariFallback(): { trips: Trip[]; stopTimes: StopTime[] } {
  const trips: Trip[] = [];
  const stopTimes: StopTime[] = [];

  // Definizione percorsi delle linee
  const percorsiLinee: Record<string, { stops: string[]; headsign: string }> = {
    M1: { stops: ['1052', '1001', '1051', '1050', '1043', '1042', '1041', '1040'], headsign: 'Bengasi' },
    '4': { stops: ['1002', '1011', '1010', '1012', '1050', '1043', '1040'], headsign: 'Drosso' },
    '13': { stops: ['1001', '1003', '1004', '1010', '1020', '1021', '1030', '1031'], headsign: 'Gran Madre' },
    '15': { stops: ['1001', '1003', '1010', '1022', '1023', '1030', '1032'], headsign: 'Tortona' },
    '18': { stops: ['1040', '1041', '1050', '1012', '1010', '1020', '1032'], headsign: 'Sofia' },
    '55': { stops: ['1001', '1003', '1011', '1010', '1020', '1021', '1030'], headsign: 'Vanchiglia' },
    '56': { stops: ['1001', '1003', '1004', '1010', '1020', '1030', '1031'], headsign: 'Tabacchi' },
    '68': { stops: ['1052', '1051', '1050', '1012', '1020', '1022', '1032'], headsign: 'San Mauro' },
  };

  let tripCount = 1;
  const ore = Array.from({ length: 24 }, (_, i) => i);

  // Per ogni linea generiamo partenze ogni 8-15 minuti tutto il giorno
  for (const [routeId, info] of Object.entries(percorsiLinee)) {
    for (const h of ore) {
      for (const m of [5, 15, 25, 35, 45, 55]) {
        const tripId = `TRIP_${routeId}_${tripCount++}`;
        trips.push({
          trip_id: tripId,
          route_id: routeId,
          service_id: 'SERVIZIO_BASE',
          trip_headsign: info.headsign,
          direction_id: 0,
        });

        // Genera stop_times per ogni fermata del percorso
        info.stops.forEach((stopId, seq) => {
          const minutiArrivo = (h * 60 + m + seq * 3) % (24 * 60);
          const stopH = Math.floor(minutiArrivo / 60);
          const stopM = minutiArrivo % 60;
          const timeStr = `${String(stopH).padStart(2, '0')}:${String(stopM).padStart(2, '0')}:00`;

          stopTimes.push({
            trip_id: tripId,
            arrival_time: timeStr,
            departure_time: timeStr,
            stop_id: stopId,
            stop_sequence: seq,
          });
        });
      }
    }
  }

  return { trips, stopTimes };
}
