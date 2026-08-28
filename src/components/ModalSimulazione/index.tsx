// Modal selezione posizione simulata

import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { POSIZIONI_SIMULATE } from '../../utils/costanti';
import type { PosizioneSimulata } from '../../types';

export default function ModalSimulazione() {
  const {
    modalitaPosizione,
    posizioneSimulata,
    setModalitaPosizione,
    setPosizioneSimulata,
    setMostraModalSimulazione,
  } = useAppStore();

  const [selezionata, setSelezionata] = useState<PosizioneSimulata>(posizioneSimulata);

  function conferma() {
    setModalitaPosizione('simulata');
    setPosizioneSimulata(selezionata);
    setMostraModalSimulazione(false);
  }

  function usaGPS() {
    setModalitaPosizione('gps');
    setMostraModalSimulazione(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="bottom-sheet-backdrop"
        onClick={() => setMostraModalSimulazione(false)}
      />

      {/* Sheet */}
      <div className="bottom-sheet" style={{ padding: '0 0 0 0' }}>
        <div className="bottom-sheet-handle" />

        <div style={{ padding: '0 20px 16px' }}>
          <div className="text-lg font-semibold">Posizione di test</div>
          <div className="text-sm text-muted mt-2">
            Scegli una posizione simulata per sviluppare e testare l'app
          </div>
        </div>

        {/* Opzione GPS reale */}
        <div style={{ padding: '0 12px 8px' }}>
          <div
            className="fermata-item"
            onClick={usaGPS}
            style={{
              background: modalitaPosizione === 'gps'
                ? 'rgba(99,102,241,0.12)'
                : undefined,
              border: modalitaPosizione === 'gps'
                ? '1px solid var(--color-border-accent)'
                : '1px solid transparent',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="fermata-icon" style={{ background: 'rgba(52,211,153,0.15)' }}>
              📡
            </div>
            <div style={{ flex: 1 }}>
              <div className="text-base font-medium">Posizione GPS reale</div>
              <div className="text-sm text-muted">Usa il GPS del dispositivo</div>
            </div>
            {modalitaPosizione === 'gps' && (
              <span style={{ color: 'var(--color-accent)' }}>✓</span>
            )}
          </div>
        </div>

        <div className="divider" style={{ margin: '4px 20px' }} />
        <div className="text-xs text-muted" style={{ padding: '0 20px 8px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          Posizioni simulate
        </div>

        {/* Lista posizioni simulate */}
        <div style={{ padding: '0 12px' }}>
          {POSIZIONI_SIMULATE.map((pos) => {
            const isSelezionata =
              selezionata.coords.lat === pos.coords.lat &&
              selezionata.coords.lon === pos.coords.lon;

            return (
              <div
                key={pos.nome}
                className="fermata-item"
                onClick={() => setSelezionata(pos)}
                style={{
                  background: isSelezionata
                    ? 'rgba(99,102,241,0.12)'
                    : undefined,
                  border: isSelezionata
                    ? '1px solid var(--color-border-accent)'
                    : '1px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '4px',
                }}
              >
                <div className="fermata-icon">📍</div>
                <div style={{ flex: 1 }}>
                  <div className="text-base font-medium">{pos.nome}</div>
                  {pos.descrizione && (
                    <div className="text-sm text-muted">{pos.descrizione}</div>
                  )}
                </div>
                {isSelezionata && (
                  <span style={{ color: 'var(--color-accent)' }}>✓</span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px 20px 8px', display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => setMostraModalSimulazione(false)}
          >
            Annulla
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={conferma}
          >
            Conferma
          </button>
        </div>
      </div>
    </>
  );
}
