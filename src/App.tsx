// App principale — orchestrazione di tutti i componenti
// Gestisce: caricamento GTFS, GPS, aggiornamenti fermate

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './store/appStore';
import { caricaGTFS } from './services/gtfs';
import { trovaFermateVicine } from './services/fermate';

import Mappa from './components/Mappa';
import SchermataCaricamento from './components/SchermataCaricamento';
import BannerSimulazione from './components/BannerSimulazione';
import ModalSimulazione from './components/ModalSimulazione';
import BarraRicerca from './components/BarraRicerca';
import PannelloFermate from './components/PannelloFermate';
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
    const fermate = trovaFermateVicine(posizione);
    setFermateVicine(fermate);
  }, [posizione, statoGTFS]);

  // Funzione aggiornamento manuale
  const aggiorna = useCallback(async () => {
    if (aggiornando) return;
    setAggiornando(true);

    try {
      // Ricarica fermate vicine
      if (posizione && statoGTFS === 'pronto') {
        const fermate = trovaFermateVicine(posizione);
        setFermateVicine(fermate);
      }
      setUltimoAggiornamento(new Date());
    } finally {
      setAggiornando(false);
    }
  }, [aggiornando, posizione, statoGTFS, setAggiornando, setFermateVicine, setUltimoAggiornamento]);

  // Mostra schermata di caricamento
  if (statoGTFS === 'non_caricato' || statoGTFS === 'caricamento' || statoGTFS === 'errore') {
    return <SchermataCaricamento />;
  }

  // Schermata errore posizione (solo se GPS e non disponibile/negato)
  const mostraErrorePosizione =
    modalitaPosizione === 'gps' &&
    (statoPosizione === 'negato' || statoPosizione === 'non_disponibile') &&
    !posizione;

  const mostraBottomSheet =
    (opzioniPercorso.length > 0 || calcolandoPercorso) && !fermataSelezionata;

  // Formatta il tempo dall'ultimo aggiornamento
  const tempoAggiornamento = ultimoAggiornamento
    ? (() => {
        const sec = Math.round((Date.now() - ultimoAggiornamento.getTime()) / 1000);
        if (sec < 10) return 'Appena aggiornato';
        if (sec < 60) return `Aggiornato ${sec} secondi fa`;
        return `Aggiornato ${Math.round(sec / 60)} min fa`;
      })()
    : null;

  return (
    <div className="app-container">
      {/* MAPPA — elemento principale */}
      <div className="map-container">
        <Mappa />

        {/* Schermata errore posizione sopra la mappa */}
        {mostraErrorePosizione && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15,15,26,0.92)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
              textAlign: 'center',
              gap: '16px',
              zIndex: 50,
            }}
          >
            <div style={{ fontSize: '48px' }}>📍</div>
            <div className="text-lg font-semibold">Posizione non disponibile</div>
            <div className="text-sm text-muted">
              {statoPosizione === 'negato'
                ? 'Per utilizzare le fermate vicine è necessario consentire l\'accesso alla posizione nelle impostazioni del browser.'
                : 'Impossibile ottenere la posizione. Controlla le impostazioni del dispositivo.'}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setModalitaPosizione('simulata')}
            >
              📍 Usa posizione simulata
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              🔄 Riprova
            </button>
          </div>
        )}

        {/* OVERLAY SUPERIORE */}
        <div className="top-overlay">
          <BannerSimulazione />
          <BarraRicerca />

          {/* Barra stato / tempo aggiornamento */}
          {tempoAggiornamento && !mostraModalSimulazione && (
            <div
              style={{
                marginTop: '8px',
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                opacity: 0.8,
              }}
            >
              📅 Dati programmati · {tempoAggiornamento}
            </div>
          )}
        </div>

        {/* Pulsante Centra posizione */}
        <button
          className="btn-posizione"
          onClick={() => {
            // Centra mappa (aggiorna posizione)
            if (modalitaPosizione === 'simulata') {
              setMostraModalSimulazione(true);
            } else {
              aggiorna();
            }
          }}
          title="Posizione"
        >
          📍
        </button>

        {/* Pulsante Aggiorna */}
        <button
          className={`btn-aggiorna ${aggiornando ? 'caricamento' : ''}`}
          onClick={aggiorna}
          disabled={aggiornando}
        >
          <span className="aggiorna-icon">↻</span>
          {aggiornando ? 'Aggiornamento…' : 'Aggiorna'}
        </button>

        {/* Pulsante Preferiti */}
        <button
          onClick={() => setMostraGestionePreferiti(true)}
          style={{
            position: 'absolute',
            bottom: 'calc(16px + 120px)',
            right: '16px',
            marginBottom: '52px',
            zIndex: 10,
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
            fontSize: '20px',
            transition: 'all 150ms ease',
          }}
          title="Preferiti"
        >
          ⭐
        </button>

        {/* PANNELLO FERMATE VICINE */}
        {!mostraBottomSheet && !fermataSelezionata && <PannelloFermate />}

        {/* DETTAGLIO FERMATA */}
        {fermataSelezionata && <PannelloFermate />}

        {/* PANNELLO PERCORSO */}
        {mostraBottomSheet && <PannelloPercorso />}
      </div>

      {/* MODALI */}
      {mostraModalSimulazione && <ModalSimulazione />}
      {mostraGestionePreferiti && <GestionePreferiti />}
    </div>
  );
}
