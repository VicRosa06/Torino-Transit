// Schermata di caricamento GTFS con barra di progresso

import { useAppStore } from '../../store/appStore';

export default function SchermataCaricamento() {
  const { progressoGTFS, messaggioGTFS, statoGTFS } = useAppStore();

  if (statoGTFS === 'errore') {
    return (
      <div className="loading-screen">
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div className="loading-title">Dati non disponibili</div>
        <div className="loading-subtitle">
          {messaggioGTFS || 'Impossibile caricare i dati GTT.'}
          <br />
          Controlla la connessione e riprova.
        </div>
      </div>
    );
  }

  return (
    <div className="loading-screen">
      <div className="loading-logo">🚋</div>
      <div>
        <div className="loading-title">Torino Transit</div>
        <div className="loading-subtitle" style={{ textAlign: 'center', marginTop: '4px' }}>
          Assistente trasporti Torino
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div className="loading-progress">
          <div
            className="loading-progress-bar"
            style={{ width: `${progressoGTFS}%` }}
          />
        </div>
        <div className="text-sm text-muted" style={{ textAlign: 'center', maxWidth: '240px' }}>
          {messaggioGTFS || 'Inizializzazione…'}
        </div>
      </div>
      <div className="text-xs text-muted" style={{ position: 'absolute', bottom: '24px', textAlign: 'center' }}>
        Dati: GTT S.p.A. – Gruppo Torinese Trasporti
      </div>
    </div>
  );
}
