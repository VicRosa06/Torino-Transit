// Pannello opzioni percorso e navigazione

import { useAppStore } from '../../store/appStore';
import type { OpzionePercorso, TrattoPercorso } from '../../types';
import { formattaMinuti, emojMezzo, classeBadge } from '../../utils/matematica';
import {
  linkGoogleMapsNavigazione,
  trovaPrimaFermataSalitaPercorso,
} from '../../services/routing';

function etichettaModalita(modalita: OpzionePercorso['modalita']): {
  label: string;
  emoji: string;
  colore: string;
} {
  switch (modalita) {
    case 'veloce':
      return { label: 'Più veloce', emoji: '⚡', colore: 'var(--color-accent)' };
    case 'meno_piedi':
      return { label: 'Meno a piedi', emoji: '🚶', colore: 'var(--color-success)' };
    case 'meno_cambi':
      return { label: 'Meno cambi', emoji: '🔄', colore: 'var(--color-info)' };
  }
}

function RigaTratta({ tratto }: { tratto: TrattoPercorso }) {
  if (tratto.tipo === 'piedi') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 0',
        }}
      >
        <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>🚶</span>
        <div>
          <div className="text-sm font-medium">
            A piedi · {formattaMinuti(tratto.durata_min)}
          </div>
          {tratto.distanza_m && (
            <div className="text-xs text-muted">
              {Math.round(tratto.distanza_m)} m
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '8px 0',
      }}
    >
      <span
        style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}
      >
        {emojMezzo(tratto.route_type ?? 3)}
      </span>
      <div style={{ flex: 1 }}>
        <div className="flex items-center gap-2">
          <span className={`badge-linea ${classeBadge(tratto.route_type ?? 3)}`}>
            {tratto.linea}
          </span>
          <span className="text-sm font-medium truncate">
            dir. {tratto.headsign}
          </span>
        </div>
        <div className="text-xs text-muted mt-1">
          {tratto.fermata_partenza} → {tratto.fermata_arrivo}
        </div>
        <div className="text-xs text-muted">
          {tratto.num_fermate} fermate · {formattaMinuti(tratto.durata_min)}
        </div>
      </div>
    </div>
  );
}

export default function PannelloPercorso() {
  const {
    opzioniPercorso,
    opzioneSelezionata,
    setOpzioneSelezionata,
    calcolandoPercorso,
    destinazione,
    posizione,
    setDestinazione,
    setOpzioniPercorso,
    setQueryRicerca,
  } = useAppStore();

  if (!destinazione && opzioniPercorso.length === 0 && !calcolandoPercorso) {
    return null;
  }

  function chiudi() {
    setDestinazione(null);
    setOpzioniPercorso([]);
    setOpzioneSelezionata(null);
    setQueryRicerca('');
  }

  if (calcolandoPercorso) {
    return (
      <>
        <div className="bottom-sheet-backdrop" onClick={chiudi} />
        <div className="bottom-sheet">
          <div className="bottom-sheet-handle" />
          <div
            className="flex items-center justify-center"
            style={{ padding: '32px', gap: '16px' }}
          >
            <div className="spinner" />
            <span className="text-sm text-muted">Calcolo percorso…</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={chiudi} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />

        {/* Header destinazione */}
        <div style={{ padding: '0 20px 16px' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted font-semibold" style={{ letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Destinazione
              </div>
              <div className="text-lg font-bold mt-1">
                🎯 {destinazione?.nome}
              </div>
            </div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={chiudi}
              style={{ fontSize: '20px' }}
            >
              ✕
            </button>
          </div>

          <div className="mt-2">
            <span className="pill pill-info">📅 Orari programmati · Stima</span>
          </div>
        </div>

        {/* Se non ci sono opzioni */}
        {opzioniPercorso.length === 0 ? (
          <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '24px 20px' }}>
            Nessun percorso trovato con i mezzi GTT nelle vicinanze.
            <br />
            <button
              className="btn btn-secondary"
              style={{ marginTop: '12px' }}
              onClick={() => {
                if (posizione && destinazione) {
                  const url = linkGoogleMapsNavigazione(
                    posizione,
                    destinazione.coords,
                    destinazione.tipo === 'luogo' ? destinazione.nome : undefined
                  );
                  window.open(url, '_blank');
                }
              }}
            >
              🗺 Cerca su Google Maps
            </button>
          </div>
        ) : (
          <>
            {/* Opzioni percorso */}
            {!opzioneSelezionata ? (
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="text-xs text-muted font-semibold" style={{ letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Scegli un percorso
                </div>
                {opzioniPercorso.map((opzione) => {
                  const meta = etichettaModalita(opzione.modalita);
                  return (
                    <div
                      key={opzione.modalita}
                      className="opzione-percorso"
                      onClick={() => setOpzioneSelezionata(opzione)}
                    >
                      <span style={{ fontSize: '24px' }}>{meta.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div className="text-base font-semibold" style={{ color: meta.colore }}>
                          {meta.label}
                        </div>
                        <div className="text-sm text-muted">
                          {opzione.cambi === 0 ? 'Diretto' : `${opzione.cambi} cambio/i`}
                          {' · '}
                          {(opzione.km_piedi * 1000) > 0
                            ? `${Math.round(opzione.km_piedi * 1000)} m a piedi`
                            : 'nessuna camminata'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="text-xl font-bold">
                          {formattaMinuti(opzione.durata_totale_min)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Dettaglio percorso selezionato */
              <div style={{ padding: '0 20px' }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '13px', marginBottom: '12px', paddingLeft: 0 }}
                  onClick={() => setOpzioneSelezionata(null)}
                >
                  ← Torna alle opzioni
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {opzioneSelezionata.tratti.map((tratto, i) => (
                    <div key={i}>
                      <RigaTratta tratto={tratto} />
                      {i < opzioneSelezionata.tratti.length - 1 && (
                        <div style={{ paddingLeft: '40px' }}>
                          <div style={{ width: '2px', height: '12px', background: 'var(--color-border)', margin: '0 auto 0 0' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="divider" />

                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <div>
                    <div className="text-xs text-muted">Tempo totale stimato</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                      {formattaMinuti(opzioneSelezionata.durata_totale_min)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-xs text-muted">Cambi</div>
                    <div className="text-xl font-bold">{opzioneSelezionata.cambi}</div>
                  </div>
                </div>

                {/* Azioni */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="btn btn-primary w-full"
                    onClick={() => {
                      if (!posizione) return;

                      const target =
                        trovaPrimaFermataSalitaPercorso(opzioneSelezionata) ??
                        destinazione?.coords ??
                        posizione;

                      const url = linkGoogleMapsNavigazione(posizione, target);
                      window.open(url, '_blank');
                    }}
                  >
                    🗺 Indicazioni su Maps
                  </button>
                  <a
                    href="https://apps.apple.com/it/app/to-move/id1403883785"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full"
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                  >
                    🎟 Acquista biglietto — TO Move
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
