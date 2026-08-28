// Banner modalità simulazione — mostrato in alto quando attiva

import { useAppStore } from '../../store/appStore';

export default function BannerSimulazione() {
  const { modalitaPosizione, posizioneSimulata, setMostraModalSimulazione } =
    useAppStore();

  if (modalitaPosizione !== 'simulata') return null;

  return (
    <div
      className="banner-simulazione"
      onClick={() => setMostraModalSimulazione(true)}
      style={{ cursor: 'pointer' }}
    >
      <span>📍</span>
      <span style={{ flex: 1 }}>
        SIM: {posizioneSimulata.nome}
      </span>
      <span className="text-xs" style={{ opacity: 0.7 }}>Modifica ›</span>
    </div>
  );
}
