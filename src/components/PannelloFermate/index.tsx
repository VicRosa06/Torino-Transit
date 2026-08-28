// Pannello fermate vicine — bottom panel con lista fermate e dettaglio

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
      <div style={{ flex: 1 }}>
        <div className="text-sm font-medium truncate" style={{ maxWidth: '160px' }}>
          {partenza.headsign}
        </div>
        <div className="text-xs text-muted">
          {formattaOra(partenza.oraPartenza)} · programmato
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div
          className={`partenza-minuti ${urgente ? 'urgente' : ''}`}
          style={{ fontSize: urgente ? '22px' : '18px' }}
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

function DettaglioFermata({ fermata }: { fermata: FermataVicina }) {
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

  const partenzeVisibili = mostraTutte ? partenze : partenze.slice(0, 5);

  return (
    <>
      <div
        className="bottom-sheet-backdrop"
        onClick={() => setFermataSelezionata(null)}
      />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />

        {/* Header fermata */}
        <div style={{ padding: '0 20px 16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold">🚏 {fermata.stop_name}</div>
              <div className="text-sm text-muted mt-1">
                📍 {formattaDistanza(fermata.distanza)} · a piedi
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setFermataSelezionata(null)}
              style={{ fontSize: '20px' }}
            >
              ✕
            </button>
          </div>

          {/* Pill tipo dati */}
          <div className="mt-2">
            <span className="pill pill-info">📅 Orari programmati</span>
          </div>
        </div>

        {/* Partenze */}
        <div style={{ padding: '0 20px' }}>
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
              Nessuna corsa nelle prossime 2 ore
            </div>
          ) : (
            <>
              {partenzeVisibili.map((p, i) => (
                <RigaPartenza key={i} partenza={p} />
              ))}
              {partenze.length > 5 && !mostraTutte && (
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
              🗺 Indicazioni
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={apriPercorso}>
              🔍 Percorso
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isGiaPreferito ? (
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={salvaPreferito}
              >
                {aggiuntoAiPreferiti ? '✅ Aggiunto!' : '⭐ Salva tra preferiti'}
              </button>
            ) : (
              <button className="btn btn-secondary" style={{ flex: 1, opacity: 0.5 }} disabled>
                ⭐ Già nei preferiti
              </button>
            )}
            <a
              href="https://apps.apple.com/it/app/to-move/id1403883785"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
            >
              🎟 Biglietto
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

// ==============================
// Lista fermate vicine (panel in basso)
// ==============================

export default function PannelloFermate() {
  const { fermateVicine, fermataSelezionata, setFermataSelezionata } = useAppStore();

  if (fermataSelezionata) {
    return <DettaglioFermata fermata={fermataSelezionata} />;
  }

  if (fermateVicine.length === 0) return null;

  return (
    <div className="nearby-panel">
      <div
        style={{
          background: 'rgba(22,22,42,0.96)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '12px 0 4px',
          maxHeight: '200px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{ padding: '0 16px 8px', fontSize: '11px', fontWeight: 600,
            color: 'var(--color-text-muted)', letterSpacing: '0.5px',
            textTransform: 'uppercase' }}
        >
          🚏 Fermate vicine
        </div>

        <div
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '8px',
            padding: '0 16px 12px',
            scrollbarWidth: 'none',
          }}
        >
          {fermateVicine.map((fermata) => (
            <div
              key={fermata.stop_id}
              onClick={() => setFermataSelezionata(fermata)}
              style={{
                flexShrink: 0,
                background: 'var(--color-bg-tertiary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                cursor: 'pointer',
                minWidth: '120px',
                maxWidth: '160px',
                transition: 'all 150ms ease',
              }}
            >
              <div className="text-xs text-muted mb-1">🚏</div>
              <div
                className="text-sm font-semibold"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '130px',
                }}
              >
                {fermata.stop_name}
              </div>
              <div className="fermata-distanza mt-1">
                {formattaDistanza(fermata.distanza)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
