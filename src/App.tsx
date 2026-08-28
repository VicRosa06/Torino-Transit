// Layout Mobile-First Integrato per Torino Transit
// La mappa è un elemento integrato nel flusso visivo e non copre l'interfaccia né intercetta lo scroll della pagina.

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './store/appStore';
import { caricaGTFS } from './services/gtfs';
import { trovaFermateVicine } from './services/fermate';
import { calcolaPercorso } from './services/routing';

import Mappa from './components/Mappa';
import SchermataCaricamento from './components/SchermataCaricamento';
import BannerSimulazione from './components/BannerSimulazione';
import ModalSimulazione from './components/ModalSimulazione';
import BarraRicerca from './components/BarraRicerca';
import PannelloFermate, { DettaglioFermata } from './components/PannelloFermate';
import PannelloPercorso from './components/PannelloPercorso';
import GestionePreferiti from './components/GestionePreferiti';

// Hook per geolocalizzazione GPS
function useGeolocalizzazione() {
  const {
    modalitaPosizione,
    setPosizione,
    setStatoPosizione,
  } = useAppStore();

  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (modalitaPosizione !== 'gps') {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      setStatoPosizione('non_disponibile');
      return;
    }

    setStatoPosizione('rilevamento');

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosizione({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        if (err.code === 1) setStatoPosizione('negato');
        else if (err.code === 3) setStatoPosizione('timeout');
        else setStatoPosizione('non_disponibile');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [modalitaPosizione, setPosizione, setStatoPosizione]);
}

export default function App() {
  const {
    statoGTFS,
    posizione,
    aggiornando,
    ultimoAggiornamento,
    mostraModalSimulazione,
    mostraGestionePreferiti,
    opzioniPercorso,
    calcolandoPercorso,
    fermataSelezionata,
    preferiti,
    setStatoGTFS,
    setProgressoGTFS,
    setMessaggioGTFS,
    setUltimoAggiornamento,
    setFermateVicine,
    setAggiornando,
    setMostraModalSimulazione,
    setMostraGestionePreferiti,
    modalitaPosizione,
    setModalitaPosizione,
    statoPosizione,
    setDestinazione,
    setOpzioniPercorso,
    setCalcolandoPercorso,
    setQueryRicerca,
  } = useAppStore();

  // Attiva GPS se necessario
  useGeolocalizzazione();

  // Carica GTFS all'avvio
  useEffect(() => {
    async function avvia() {
      setStatoGTFS('caricamento');
      setProgressoGTFS(0);

      try {
        await caricaGTFS((msg, pct) => {
          setMessaggioGTFS(msg);
          setProgressoGTFS(pct);
        });
        setStatoGTFS('pronto');
        setUltimoAggiornamento(new Date());
      } catch (err) {
        const messaggio = err instanceof Error ? err.message : 'Errore sconosciuto';
        setMessaggioGTFS(messaggio);
        setStatoGTFS('errore');
      }
    }

    avvia();
  }, []);

  // Aggiorna fermate quando cambia la posizione o vengono caricati i dati
  useEffect(() => {
    if (!posizione || statoGTFS !== 'pronto') return;
    const fermate = trovaFermateVicine(posizione, 800, 15);
    setFermateVicine(fermate);
  }, [posizione, statoGTFS]);

  // Funzione aggiornamento manuale
  const aggiorna = useCallback(async () => {
    if (aggiornando) return;
    setAggiornando(true);

    try {
      if (posizione && statoGTFS === 'pronto') {
        const fermate = trovaFermateVicine(posizione, 800, 15);
        setFermateVicine(fermate);
      }
      setUltimoAggiornamento(new Date());
    } finally {
      setAggiornando(false);
    }
  }, [aggiornando, posizione, statoGTFS, setAggiornando, setFermateVicine, setUltimoAggiornamento]);

  // Seleziona un preferito rapido
  async function selezionaPreferitoRapido(pref: typeof preferiti[0]) {
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

  // Mostra schermata di caricamento iniziale
  if (statoGTFS === 'non_caricato' || statoGTFS === 'caricamento' || statoGTFS === 'errore') {
    return <SchermataCaricamento />;
  }

  // Schermata errore posizione (solo se GPS abilitato e non disponibile/negato)
  const mostraErrorePosizione =
    modalitaPosizione === 'gps' &&
    (statoPosizione === 'negato' || statoPosizione === 'non_disponibile') &&
    !posizione;

  const tempoAggiornamento = ultimoAggiornamento
    ? (() => {
        const sec = Math.round((Date.now() - ultimoAggiornamento.getTime()) / 1000);
        if (sec < 10) return 'Appena aggiornato';
        if (sec < 60) return `Aggiornato ${sec}s fa`;
        return `Aggiornato ${Math.round(sec / 60)} min fa`;
      })()
    : null;

  return (
    <div className="mobile-app-layout">
      {/* HEADER PRINCIPALE */}
      <header className="app-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="app-header-logo">🚋</span>
            <div>
              <h1 className="app-title">Torino Transit</h1>
              <div className="app-subtitle">
                📅 Dati programmati GTT {tempoAggiornamento ? `· ${tempoAggiornamento}` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className={`btn-header ${aggiornando ? 'caricamento' : ''}`}
              onClick={aggiorna}
              title="Aggiorna dati"
              aria-label="Aggiorna"
            >
              <span className="aggiorna-icon">↻</span>
            </button>

            <button
              className="btn-header"
              onClick={() => setMostraGestionePreferiti(true)}
              title="Preferiti"
              aria-label="Preferiti"
            >
              ⭐ {preferiti.length > 0 && <span className="badge-count">{preferiti.length}</span>}
            </button>

            <button
              className="btn-header"
              onClick={() => setMostraModalSimulazione(true)}
              title="Modalità posizione"
              aria-label="Posizione"
            >
              📍
            </button>
          </div>
        </div>
      </header>

      {/* CONTENUTO SCORREVOLE */}
      <main className="app-main-content">
        {/* Banner Simulazione se attiva */}
        <BannerSimulazione />

        {/* Avviso errore GPS se presente */}
        {mostraErrorePosizione && (
          <div className="alert-box mb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-warning">📍 Posizione GPS non disponibile</div>
            </div>
            <p className="text-xs text-muted mb-3">
              Per continuare, attiva la posizione nel browser o passa alla modalità simulata per esplorare Torino.
            </p>
            <button
              className="btn btn-primary w-full"
              style={{ minHeight: '36px', fontSize: '13px' }}
              onClick={() => setModalitaPosizione('simulata')}
            >
              Usa posizione di test a Torino
            </button>
          </div>
        )}

        {/* BARRA DI RICERCA */}
        <div className="mb-3">
          <BarraRicerca />
        </div>

        {/* QUICK ACCESS PREFERITI (Chips a 1 tap) */}
        {preferiti.length > 0 && (
          <div className="preferiti-chips-row mb-3">
            <span className="text-xs text-muted font-medium self-center mr-1">Preferiti:</span>
            {preferiti.map((pref) => (
              <button
                key={pref.id}
                className="chip-preferito"
                onClick={() => selezionaPreferitoRapido(pref)}
              >
                <span>⭐ {pref.nome}</span>
              </button>
            ))}
          </div>
        )}

        {/* SEZIONE MAPPA INTEGRATA */}
        <section className="map-card-section mb-4">
          <div className="map-card-header">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-primary">🗺️ Mappa zona</span>
              <span className="text-xs text-muted">Tocca una fermata per gli orari</span>
            </div>
            <button
              className="btn-map-action"
              onClick={() => {
                if (modalitaPosizione === 'simulata') {
                  setMostraModalSimulazione(true);
                } else {
                  aggiorna();
                }
              }}
              title="Centra mappa sulla tua posizione"
            >
              📍 Centra
            </button>
          </div>

          <div className="map-card-body">
            <Mappa />
          </div>
        </section>

        {/* SEZIONE FERMATE VICINE */}
        <section className="mb-4">
          <PannelloFermate />
        </section>

        {/* FOOTER INFORMATIVO & ATTRIBUZIONE */}
        <footer className="app-footer">
          <div className="text-xs text-muted text-center leading-relaxed">
            Dati ufficiali GTT S.p.A. · Mappe © OpenStreetMap / CARTO
            <br />
            Applicazione gratuita per il trasporto pubblico a Torino
          </div>
        </footer>
      </main>

      {/* DETTAGLIO FERMATA SELEZIONATA (Bottom Sheet) */}
      {fermataSelezionata && <DettaglioFermata fermata={fermataSelezionata} />}

      {/* PANNELLO PERCORSO (Bottom Sheet quando viene calcolato) */}
      {(opzioniPercorso.length > 0 || calcolandoPercorso) && !fermataSelezionata && (
        <PannelloPercorso />
      )}

      {/* MODALI */}
      {mostraModalSimulazione && <ModalSimulazione />}
      {mostraGestionePreferiti && <GestionePreferiti />}
    </div>
  );
}
