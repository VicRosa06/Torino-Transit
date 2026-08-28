import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { calcolaPercorso } from '../../services/routing';

export default function GestionePreferiti() {
  const {
    preferiti,
    rimuoviPreferito,
    rinominaPreferito,
    setMostraGestionePreferiti,
    posizione,
    setDestinazione,
    setOpzioniPercorso,
    setCalcolandoPercorso,
    setQueryRicerca,
  } = useAppStore();

  const [rinominandoId, setRinominandoId] = useState<string | null>(null);
  const [nuovoNome, setNuovoNome] = useState('');

  function iniziaRinomina(id: string, nomeAttuale: string) {
    setRinominandoId(id);
    setNuovoNome(nomeAttuale);
  }

  function confermaRinomina() {
    if (rinominandoId && nuovoNome.trim()) {
      rinominaPreferito(rinominandoId, nuovoNome.trim());
    }
    setRinominandoId(null);
    setNuovoNome('');
  }

  async function selezionaPreferito(id: string) {
    const pref = preferiti.find((p) => p.id === id);
    if (!pref) return;

    setMostraGestionePreferiti(false);
    setQueryRicerca(pref.nome);
    setDestinazione({
      tipo: pref.tipo,
      nome: pref.nome,
      coords: pref.coords,
      stop_id: pref.stop_id,
    });

    if (!posizione) return;

    setCalcolandoPercorso(true);
    try {
      const opzioni = await calcolaPercorso(posizione, pref.coords);
      setOpzioniPercorso(opzioni);
    } catch {
      setOpzioniPercorso([]);
    } finally {
      setCalcolandoPercorso(false);
    }
  }

  return (
    <>
      <div
        className="bottom-sheet-backdrop"
        onClick={() => setMostraGestionePreferiti(false)}
      />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" />

        <div style={{ padding: '0 20px 16px' }}>
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">⭐ I tuoi preferiti</div>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setMostraGestionePreferiti(false)}
              style={{ fontSize: '20px' }}
            >
              ✕
            </button>
          </div>
        </div>

        {preferiti.length === 0 ? (
          <div
            className="text-sm text-muted"
            style={{ textAlign: 'center', padding: '32px 20px' }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⭐</div>
            <div className="text-base font-medium text-primary mb-2">
              Nessun preferito ancora
            </div>
            Cerca una fermata o un luogo e salvalo
            <br />
            per accedervi rapidamente.
          </div>
        ) : (
          <div style={{ padding: '0 12px' }}>
            {preferiti.map((pref) => (
              <div
                key={pref.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '4px',
                }}
              >
                {/* Icona */}
                <div
                  className="fermata-icon"
                  style={{
                    background: 'rgba(251,191,36,0.12)',
                    fontSize: '16px',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                  onClick={() => selezionaPreferito(pref.id)}
                >
                  {pref.tipo === 'fermata' ? '🚏' : '📍'}
                </div>

                {/* Nome (normale o in modifica) */}
                {rinominandoId === pref.id ? (
                  <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={nuovoNome}
                      onChange={(e) => setNuovoNome(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && confermaRinomina()}
                      autoFocus
                      style={{
                        flex: 1,
                        background: 'var(--color-bg-tertiary)',
                        border: '1px solid var(--color-accent)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'inherit',
                        fontSize: '15px',
                        outline: 'none',
                      }}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={confermaRinomina}
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <div
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => selezionaPreferito(pref.id)}
                  >
                    <div className="text-base font-medium">{pref.nome}</div>
                    <div className="text-xs text-muted">
                      {pref.tipo === 'fermata' ? '🚏 Fermata' : '📍 Luogo'}
                    </div>
                  </div>
                )}

                {/* Azioni */}
                {rinominandoId !== pref.id && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ fontSize: '14px', width: '36px', height: '36px' }}
                      onClick={() => iniziaRinomina(pref.id, pref.nome)}
                      title="Rinomina"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ fontSize: '14px', width: '36px', height: '36px', color: 'var(--color-error)' }}
                      onClick={() => rimuoviPreferito(pref.id)}
                      title="Rimuovi"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
