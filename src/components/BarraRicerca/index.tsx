import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/appStore';
import { cercaFermatePerNome } from '../../services/fermate';
import { cercaIndirizzo } from '../../services/geocoding';
import { calcolaPercorso } from '../../services/routing';
import type { RisultatoRicerca } from '../../types';

// Debounce hook
function useDebounce<T>(valore: T, ritardo: number): T {
  const [valoreRitardato, setValoreRitardato] = useState(valore);
  useEffect(() => {
    const timer = setTimeout(() => setValoreRitardato(valore), ritardo);
    return () => clearTimeout(timer);
  }, [valore, ritardo]);
  return valoreRitardato;
}

export default function BarraRicerca() {
  const {
    queryRicerca,
    setQueryRicerca,
    risultatiRicerca,
    setRisultatiRicerca,
    cercando,
    setCercando,
    mostraRicerca,
    setMostraRicerca,
    posizione,
    setDestinazione,
    setOpzioniPercorso,
    setCalcolandoPercorso,
    preferiti,
    statoGTFS,
  } = useAppStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const queryRitardata = useDebounce(queryRicerca, 400);

  // Cerca al cambiamento del testo
  useEffect(() => {
    if (!queryRitardata.trim()) {
      setRisultatiRicerca([]);
      setCercando(false);
      return;
    }

    const eseguiRicerca = async () => {
      setCercando(true);
      const risultati: RisultatoRicerca[] = [];

      // 1. Fermate per nome (dati locali GTFS)
      if (statoGTFS === 'pronto') {
        const fermate = cercaFermatePerNome(queryRitardata, 5);
        fermate.forEach((f) => {
          risultati.push({
            tipo: 'fermata',
            nome: f.stop_name,
            descrizione: 'Fermata GTT',
            coords: { lat: f.stop_lat, lon: f.stop_lon },
            stop_id: f.stop_id,
          });
        });
      }

      // 2. Geocoding Nominatim per indirizzi
      try {
        const luoghi = await cercaIndirizzo(queryRitardata, 4);
        risultati.push(...luoghi);
      } catch {
        // Geocoding non critico, continua senza
      }

      setRisultatiRicerca(risultati.slice(0, 8));
      setCercando(false);
    };

    eseguiRicerca();
  }, [queryRitardata, statoGTFS]);

  async function selezionaRisultato(risultato: RisultatoRicerca) {
    setQueryRicerca(risultato.nome);
    setMostraRicerca(false);
    setDestinazione(risultato);
    inputRef.current?.blur();

    if (!posizione) return;

    setCalcolandoPercorso(true);
    try {
      const opzioni = await calcolaPercorso(posizione, risultato.coords);
      setOpzioniPercorso(opzioni);
    } catch {
      setOpzioniPercorso([]);
    } finally {
      setCalcolandoPercorso(false);
    }
  }

  function pulisciRicerca() {
    setQueryRicerca('');
    setRisultatiRicerca([]);
    setDestinazione(null);
    setOpzioniPercorso([]);
    setMostraRicerca(false);
    inputRef.current?.focus();
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Input ricerca */}
      <div className="search-bar">
        <span style={{ fontSize: '16px', opacity: 0.6 }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Dove vuoi andare?"
          value={queryRicerca}
          onFocus={() => setMostraRicerca(true)}
          onBlur={() => setTimeout(() => setMostraRicerca(false), 200)}
          onChange={(e) => {
            setQueryRicerca(e.target.value);
            setMostraRicerca(true);
          }}
        />
        {cercando && <div className="spinner" style={{ flexShrink: 0 }} />}
        {queryRicerca && !cercando && (
          <button
            className="btn-icon"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '16px',
              padding: '4px',
              flexShrink: 0,
            }}
            onMouseDown={(e) => { e.preventDefault(); pulisciRicerca(); }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown risultati */}
      {mostraRicerca && (queryRicerca || preferiti.length > 0) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'rgba(22,22,42,0.98)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '60vh',
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          {/* Preferiti (mostrati quando non si sta cercando) */}
          {!queryRicerca && preferiti.length > 0 && (
            <div>
              <div
                style={{
                  padding: '12px 16px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                ⭐ Destinazioni preferite
              </div>
              {preferiti.map((pref) => (
                <div
                  key={pref.id}
                  className="fermata-item"
                  onMouseDown={() =>
                    selezionaRisultato({
                      tipo: pref.tipo,
                      nome: pref.nome,
                      coords: pref.coords,
                      stop_id: pref.stop_id,
                    })
                  }
                  style={{ padding: '10px 16px' }}
                >
                  <div
                    className="fermata-icon"
                    style={{ background: 'rgba(251,191,36,0.12)', fontSize: '16px' }}
                  >
                    ⭐
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="text-base font-medium">{pref.nome}</div>
                    <div className="text-xs text-muted">
                      {pref.tipo === 'fermata' ? '🚏 Fermata' : '📍 Luogo'}
                    </div>
                  </div>
                </div>
              ))}
              <div className="divider" style={{ margin: '4px 16px' }} />
            </div>
          )}

          {/* Risultati ricerca */}
          {queryRicerca && risultatiRicerca.length > 0 && (
            <div>
              <div
                style={{
                  padding: '12px 16px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                Risultati
              </div>
              {risultatiRicerca.map((r, i) => (
                <div
                  key={i}
                  className="fermata-item"
                  onMouseDown={() => selezionaRisultato(r)}
                  style={{ padding: '10px 16px' }}
                >
                  <div
                    className="fermata-icon"
                    style={{
                      background:
                        r.tipo === 'fermata'
                          ? 'var(--color-accent-glow)'
                          : 'rgba(52,211,153,0.1)',
                      fontSize: '16px',
                    }}
                  >
                    {r.tipo === 'fermata' ? '🚏' : '📍'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-base font-medium truncate">{r.nome}</div>
                    {r.descrizione && (
                      <div className="text-xs text-muted truncate">{r.descrizione}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nessun risultato */}
          {queryRicerca && !cercando && risultatiRicerca.length === 0 && (
            <div
              className="text-sm text-muted"
              style={{ textAlign: 'center', padding: '20px 16px' }}
            >
              Nessun risultato trovato per "{queryRicerca}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
