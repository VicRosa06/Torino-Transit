// Store globale dell'applicazione — Zustand
// Gestisce lo stato condiviso tra tutti i componenti

import { create } from 'zustand';
import type {
  Coordiante,
  FermataVicina,
  Preferito,
  OpzionePercorso,
  StatoGTFS,
  StatoPosizione,
  RisultatoRicerca,
  PosizioneSimulata,
  ModalitaPosizione,
} from '../types';
import {
  caricaPreferiti,
  aggiungiPreferito,
  rimuoviPreferito,
  rinominaPreferito,
  caricaPosizioneSimulata,
  salvaPosizioneSimulata,
  caricaModalitaPosizione,
  salvaModalitaPosizione,
} from '../services/storage';

interface AppStore {
  // ==============================
  // Posizione
  // ==============================
  posizione: Coordiante | null;
  statoPosizione: StatoPosizione;
  modalitaPosizione: ModalitaPosizione;
  posizioneSimulata: PosizioneSimulata;
  setPosizione: (coords: Coordiante) => void;
  setStatoPosizione: (stato: StatoPosizione) => void;
  setModalitaPosizione: (modalita: ModalitaPosizione) => void;
  setPosizioneSimulata: (pos: PosizioneSimulata) => void;

  // ==============================
  // GTFS
  // ==============================
  statoGTFS: StatoGTFS;
  progressoGTFS: number;
  messaggioGTFS: string;
  ultimoAggiornamento: Date | null;
  setStatoGTFS: (stato: StatoGTFS) => void;
  setProgressoGTFS: (p: number) => void;
  setMessaggioGTFS: (msg: string) => void;
  setUltimoAggiornamento: (data: Date) => void;

  // ==============================
  // Fermate vicine
  // ==============================
  fermateVicine: FermataVicina[];
  fermataSelezionata: FermataVicina | null;
  setFermateVicine: (fermate: FermataVicina[]) => void;
  setFermataSelezionata: (fermata: FermataVicina | null) => void;

  // ==============================
  // Ricerca
  // ==============================
  queryRicerca: string;
  risultatiRicerca: RisultatoRicerca[];
  cercando: boolean;
  mostraRicerca: boolean;
  setQueryRicerca: (q: string) => void;
  setRisultatiRicerca: (r: RisultatoRicerca[]) => void;
  setCercando: (b: boolean) => void;
  setMostraRicerca: (b: boolean) => void;

  // ==============================
  // Destinazione e percorso
  // ==============================
  destinazione: RisultatoRicerca | null;
  opzioniPercorso: OpzionePercorso[];
  opzioneSelezionata: OpzionePercorso | null;
  calcolandoPercorso: boolean;
  setDestinazione: (dest: RisultatoRicerca | null) => void;
  setOpzioniPercorso: (opzioni: OpzionePercorso[]) => void;
  setOpzioneSelezionata: (opzione: OpzionePercorso | null) => void;
  setCalcolandoPercorso: (b: boolean) => void;

  // ==============================
  // Preferiti
  // ==============================
  preferiti: Preferito[];
  aggiungiPreferito: (pref: Preferito) => void;
  rimuoviPreferito: (id: string) => void;
  rinominaPreferito: (id: string, nome: string) => void;

  // ==============================
  // UI
  // ==============================
  mostraModalSimulazione: boolean;
  mostraGestionePreferiti: boolean;
  aggiornando: boolean;
  setMostraModalSimulazione: (b: boolean) => void;
  setMostraGestionePreferiti: (b: boolean) => void;
  setAggiornando: (b: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => {
  // Carica dati persistiti al boot
  const posizioneSimulataIniziale = caricaPosizioneSimulata();
  const modalitaIniziale = caricaModalitaPosizione();
  const preferitiIniziali = caricaPreferiti();

  return {
    // Posizione
    posizione: modalitaIniziale === 'simulata'
      ? posizioneSimulataIniziale.coords
      : null,
    statoPosizione: modalitaIniziale === 'simulata' ? 'ok' : 'rilevamento',
    modalitaPosizione: modalitaIniziale,
    posizioneSimulata: posizioneSimulataIniziale,

    setPosizione: (coords) => set({ posizione: coords, statoPosizione: 'ok' }),
    setStatoPosizione: (stato) => set({ statoPosizione: stato }),
    setModalitaPosizione: (modalita) => {
      salvaModalitaPosizione(modalita);
      if (modalita === 'simulata') {
        const sim = get().posizioneSimulata;
        set({
          modalitaPosizione: modalita,
          posizione: sim.coords,
          statoPosizione: 'ok',
        });
      } else {
        set({ modalitaPosizione: modalita, statoPosizione: 'rilevamento' });
      }
    },
    setPosizioneSimulata: (pos) => {
      salvaPosizioneSimulata(pos);
      set({
        posizioneSimulata: pos,
        posizione: pos.coords,
        statoPosizione: 'ok',
      });
    },

    // GTFS
    statoGTFS: 'non_caricato',
    progressoGTFS: 0,
    messaggioGTFS: '',
    ultimoAggiornamento: null,
    setStatoGTFS: (stato) => set({ statoGTFS: stato }),
    setProgressoGTFS: (p) => set({ progressoGTFS: p }),
    setMessaggioGTFS: (msg) => set({ messaggioGTFS: msg }),
    setUltimoAggiornamento: (data) => set({ ultimoAggiornamento: data }),

    // Fermate
    fermateVicine: [],
    fermataSelezionata: null,
    setFermateVicine: (fermate) => set({ fermateVicine: fermate }),
    setFermataSelezionata: (fermata) => set({ fermataSelezionata: fermata }),

    // Ricerca
    queryRicerca: '',
    risultatiRicerca: [],
    cercando: false,
    mostraRicerca: false,
    setQueryRicerca: (q) => set({ queryRicerca: q }),
    setRisultatiRicerca: (r) => set({ risultatiRicerca: r }),
    setCercando: (b) => set({ cercando: b }),
    setMostraRicerca: (b) => set({ mostraRicerca: b }),

    // Destinazione e percorso
    destinazione: null,
    opzioniPercorso: [],
    opzioneSelezionata: null,
    calcolandoPercorso: false,
    setDestinazione: (dest) => set({
      destinazione: dest,
      opzioniPercorso: [],
      opzioneSelezionata: null,
    }),
    setOpzioniPercorso: (opzioni) => set({ opzioniPercorso: opzioni }),
    setOpzioneSelezionata: (opzione) => set({ opzioneSelezionata: opzione }),
    setCalcolandoPercorso: (b) => set({ calcolandoPercorso: b }),

    // Preferiti
    preferiti: preferitiIniziali,
    aggiungiPreferito: (pref) => {
      const nuovi = aggiungiPreferito(pref);
      set({ preferiti: nuovi });
    },
    rimuoviPreferito: (id) => {
      const nuovi = rimuoviPreferito(id);
      set({ preferiti: nuovi });
    },
    rinominaPreferito: (id, nome) => {
      const nuovi = rinominaPreferito(id, nome);
      set({ preferiti: nuovi });
    },

    // UI
    mostraModalSimulazione: false,
    mostraGestionePreferiti: false,
    aggiornando: false,
    setMostraModalSimulazione: (b) => set({ mostraModalSimulazione: b }),
    setMostraGestionePreferiti: (b) => set({ mostraGestionePreferiti: b }),
    setAggiornando: (b) => set({ aggiornando: b }),
  };
});
