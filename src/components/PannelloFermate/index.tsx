// Lista e dettaglio fermate vicine integrati nel layout mobile-first

import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { FermataVicina, PartenzaFermata } from '../../types';
import { formattaDistanza, formattaOra, emojMezzo, classeBadge } from '../../utils/matematica';
import { caricaPartenzeFermata } from '../../services/fermate';
import { calcolaPercorso, linkGoogleMapsNavigazione } from '../../services/routing';

// ==============================
// Componente riga partenza
// ==============================

function RigaPartenza({ partenza }: { partenza: PartenzaFermata }) {
  const urgente = partenza.minutiArrivo <= 3;
  const arrivo =
    partenza.minutiArrivo <= 0
      ? 'In arrivo'
      : partenza.minutiArrivo === 1
      ? '1 min'
      : `${partenza.minutiArrivo} min`;

  return (
    <div className="partenza-row">
      <span className={`badge-linea ${classeBadge(partenza.route_type)}`}>
        {emojMezzo(partenza.route_type)} {partenza.route_short_name}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-sm font-medium truncate">
          {partenza.headsign}
        </div>
        <div className="text-xs text-muted">
          {formattaOra(partenza.oraPartenza)} · programmato
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          className={`partenza-minuti ${urgente ? 'urgente' : ''}`}
          style={{ fontSize: urgente ? '20px' : '17px' }}
        >
          {arrivo}
        </div>
        {urgente && (
          <div className="text-xs" style={{ color: 'var(--color-warning)' }}>
            ⚡ Presto
          </div>
        )}
      </div>
    </div>
  );
}

// ==============================
// Dettaglio fermata (bottom sheet)
// ==============================

export function DettaglioFermata({ fermata }: { fermata: FermataVicina }) {
  const {
    posizione,
    setFermataSelezionata,
    setDestinazione,
    setOpzioniPercorso,
    setCalcolandoPercorso,
    aggiungiPreferito,
    preferiti,
  } = useAppStore();

  const [partenze, setPartenze] = useState<PartenzaFermata[]>([]);
  const [caricando, setCaricando] = useState(true);
  const [mostraTutte, setMostraTutte] = useState(false);
  const [aggiuntoAiPreferiti, setAggiuntoAiPreferiti] = useState(false);

  const isGiaPreferito = preferiti.some((p) => p.stop_id === fermata.stop_id);

  useEffect(() => {
    setCaricando(true);
    const risultato = caricaPartenzeFermata(fermata.stop_id, 120, 12);
    setPartenze(risultato);
    setCaricando(false);
  }, [fermata.stop_id]);

  async function apriPercorso() {
    setFermataSelezionata(null);
    setDestinazione({
      tipo: 'fermata',
      nome: fermata.stop_name,
      coords: { lat: fermata.stop_lat, lon: fermata.stop_lon },
      stop_id: fermata.stop_id,
    });

    if (!posizione) return;

    setCalcolandoPercorso(true);
    try {
      const opzioni = await calcolaPercorso(posizione, {
        lat: fermata.stop_lat,
        lon: fermata.stop_lon,
      });
      setOpzioniPercorso(opzioni);
    } catch (e) {
      console.error(e);
    } finally {
      setCalcolandoPercorso(false);
    }
  }

  function apriMaps() {
    if (!posizione) return;
    const url = linkGoogleMapsNavigazione(
      posizione,
      { lat: fermata.stop_lat, lon: fermata.stop_lon },
      fermata.stop_name
    );
    window.open(url, '_blank');
  }

  function salvaPreferito() {
    aggiungiPreferito({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      nome: fermata.stop_name,
      tipo: 'fermata',
      coords: { lat: fermata.stop_lat, lon: fermata.stop_lon },
      stop_id: fermata.stop_id,
      creatoIl: new Date().toISOString(),
    });
    setAggiuntoAiPreferiti(true);
    setTimeout(() => setAggiuntoAiPreferiti(false), 2000);
  }

  const partenzeVisibili = mostraTutte ? partenze : partenze.slice(0, 6);

  return (
    <>
      <div
        className="bottom-sheet-backdrop"
        onClick={() => setFermataSelezionata(null)}
      />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />

        {/* Header fermata */}
        <div style={{ padding: '0 20px 14px' }}>
          <div className="flex items-center justify-between">
            <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
              <div className="text-lg font-bold truncate">🚏 {fermata.stop_name}</div>
              <div className="text-sm text-muted mt-1 flex items-center gap-2">
                <span>📍 {formattaDistanza(fermata.distanza)} a piedi</span>
                <span className="pill pill-info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  📅 Dati programmati
                </span>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setFermataSelezionata(null)}
              style={{ fontSize: '20px', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Partenze */}
        <div style={{ padding: '0 20px' }}>
          <div className="text-xs text-muted font-semibold mb-2" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Prossimi passaggi GTT
          </div>

          {caricando ? (
            <div className="flex items-center justify-center" style={{ padding: '24px 0' }}>
              <div className="spinner" />
              <span className="text-sm text-muted" style={{ marginLeft: '12px' }}>
                Caricamento orari…
              </span>
            </div>
          ) : partenze.length === 0 ? (
            <div
              className="text-sm text-muted"
              style={{ textAlign: 'center', padding: '24px 0' }}
            >
              Nessuna corsa programmata nelle prossime 2 ore
            </div>
          ) : (
            <>
              {partenzeVisibili.map((p, i) => (
                <RigaPartenza key={i} partenza={p} />
              ))}
              {partenze.length > 6 && !mostraTutte && (
                <button
                  className="btn btn-ghost w-full"
                  style={{ fontSize: '13px', marginTop: '8px' }}
                  onClick={() => setMostraTutte(true)}
                >
                  Vedi tutte le {partenze.length} corse ↓
                </button>
              )}
            </>
          )}
        </div>

        {/* Azioni */}
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={apriMaps}>
              🗺 Indicazioni Maps
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={apriPercorso}>
              🔍 Calcola percorso
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isGiaPreferito ? (
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={salvaPreferito}
              >
                {aggiuntoAiPreferiti ? '✅ Aggiunto!' : '⭐ Salva tra i preferiti'}
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ flex: 1, opacity: 0.6 }} disabled>
                ⭐ Nei preferiti
              </button>
            )}
            <a
              href="https://apps.apple.com/it/app/to-move/id1403883785"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
            >
              🎟 Biglietto TO Move
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ==============================
// Scheda singola fermata nella lista principale
// ==============================

function CardFermataVicina({
  fermata,
  onSelect,
}: {
  fermata: FermataVicina;
  onSelect: () => void;
}) {
  const [partenze, setPartenze] = useState<PartenzaFermata[]>([]);

  useEffect(() => {
    const p = caricaPartenzeFermata(fermata.stop_id, 90, 2);
    setPartenze(p);
  }, [fermata.stop_id]);

  return (
    <div className="fermata-card" onClick={onSelect}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="fermata-badge-icon">🚏</span>
          <span className="font-semibold text-base text-primary truncate" style={{ maxWidth: '190px' }}>
            {fermata.stop_name}
          </span>
        </div>
        <span className="pill pill-accent font-semibold">
          {formattaDistanza(fermata.distanza)}
        </span>
      </div>

      {/* Prossime corse preview */}
      {partenze.length > 0 ? (
        <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span className="text-xs text-muted">Prossimi arrivi:</span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {partenze.map((p, i) => (
              <span
                key={i}
                className="text-xs font-medium"
                style={{
                  background: 'var(--color-bg-hover)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: p.minutiArrivo <= 3 ? 'var(--color-warning)' : 'var(--color-text-primary)',
                }}
              >
                {p.route_short_name} → {p.minutiArrivo <= 0 ? 'ora' : `${p.minutiArrivo} min`}
              </span>
            ))}
          </div>
          <span className="text-muted text-sm">›</span>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-muted mt-2 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <span>Tocca per vedere orari e percorsi</span>
          <span className="text-muted text-sm">›</span>
        </div>
      )}
    </div>
  );
}

// ==============================
// Lista fermate vicine integrata nel layout
// ==============================

export default function PannelloFermate() {
  const { fermateVicine, setFermataSelezionata } = useAppStore();

  if (fermateVicine.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '24px 16px' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚏</div>
        <div className="text-base font-semibold mb-1">Nessuna fermata trovata</div>
        <div className="text-xs text-muted">
          Verifica la posizione selezionata o cerca una destinazione dalla barra in alto.
        </div>
      </div>
    );
  }

  return (
    <div className="fermate-section">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="text-sm font-bold text-secondary uppercase tracking-wider">
          🚏 Fermate vicine ({fermateVicine.length})
        </div>
        <div className="text-xs text-muted">
          Ordinati per distanza
        </div>
      </div>

      <div className="fermate-grid">
        {fermateVicine.map((fermata) => (
          <CardFermataVicina
            key={fermata.stop_id}
            fermata={fermata}
            onSelect={() => setFermataSelezionata(fermata)}
          />
        ))}
      </div>
    </div>
  );
}
