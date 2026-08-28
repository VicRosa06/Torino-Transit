# 🚋 Torino Transit

**Assistente personale mobile-first per il trasporto pubblico di Torino**

---

## 🎯 Obiettivo del Progetto

Torino Transit è una web application personale progettata con approccio **mobile-first** per gli spostamenti quotidiani a Torino. Risponde rapidamente alle domande fondamentali:

> **DOVE SONO? → COSA C'È VICINO? → DOVE POSSO ANDARE? → QUANTO CI METTO?**

---

## ✨ Funzionalità Principali

- 🗺️ **Mappa Interattiva Minimal & Dark**: mappa fluida con Leaflet e tile Carto Dark ottimizzata per smartphone.
- 📡 **Geolocalizzazione Reale o Simulata**: supporta GPS reale con fallback immediato a modalità di simulazione per sviluppare e testare da remoto (posizioni di test: *Porta Susa, Piazza Castello, Palazzo Nuovo - Università, Piazza Vittorio Veneto, Lingotto*).
- 🚏 **Fermate Vicine con Raggio Intelligente**: calcolo istantaneo delle fermate più vicine (formula Haversine) e visualizzazione a scorrimento rapido o su mappa.
- 📅 **Orari Programmati GTT**: visualizzazione delle corse in partenza nelle successive 2 ore con indicazione chiara del tipo di dato (*Programmato*).
- 🔍 **Ricerca Indirizzi e Fermate**: motore di ricerca ibrido (dataset locale fermate GTT + geocoding Nominatim OpenStreetMap con throttle 1 req/s).
- ⚡ **Pianificazione Percorsi (3 Modalità)**:
  - ⚡ **Più Veloce**: percorso con il minor tempo stimato.
  - 🚶 **Meno a Piedi**: percorso che riduce al minimo il tratto pedonale.
  - 🔄 **Meno Cambi**: percorso diretto o con il minor numero di cambi.
- ⭐ **Destinazioni Preferite Personali**: salvataggio locale (localStorage) con possibilità di rinominare ed eliminare i preferiti con un tocco.
- 🗺️ **Navigazione Esterna**: deep link integrato per aprire direttamente le indicazioni a piedi verso la fermata su Google Maps.
- 🎟️ **Acquisto Biglietti TO Move**: collegamento rapido verso l'applicazione ufficiale TO Move (App Store).
- 📱 **Progressive Web App (PWA)**: installabile sulla schermata Home di iPhone/Android, con manifest, icone e Service Worker per caching offline.

---

## 🛠️ Stack Tecnologico & Vincolo €0

L'intera applicazione è stata progettata e realizzata a **costo operativo pari a €0**:

| Componente | Tecnologia | Motivazione & Costo |
|---|---|---|
| **Frontend** | React 18 + TypeScript + Vite | Veloce, leggero, tipi sicuri (€0) |
| **Stile** | Vanilla CSS con Custom Properties | Design system personalizzato, no overhead Tailwind (€0) |
| **Mappa** | Leaflet + React-Leaflet | Open source, touch friendly, senza limiti API (€0) |
| **Tile Map** | OpenStreetMap / CARTO Dark | Gratuito, tema scuro coerente con il design (€0) |
| **Geocoding** | Nominatim (OpenStreetMap) | Gratuito con limite 1 req/s (€0) |
| **Dati Trasporto** | GTT Open Data GTFS | Dati ufficiali gratuiti non commerciali (€0) |
| **Stato & Storage** | Zustand + localStorage | Leggero, nessun database server a pagamento (€0) |
| **Hosting & CI/CD** | GitHub Pages + GitHub Actions | Deploy automatico gratuito ad ogni push (€0) |

---

## 📊 Fonti Dati Ufficiali GTT / 5T

- **GTFS Statico GTT**: `https://www.gtt.to.it/open_data/gtt_gtfs.zip`
  - Fermate (`stops.txt`), Linee (`routes.txt`), Corse (`trips.txt`), Orari (`stop_times.txt`), Calendari (`calendar.txt`, `calendar_dates.txt`).
- **Attribuzione Obbligatoria**: *Fonte dati: GTT S.p.A. – Gruppo Torinese Trasporti* ([www.gtt.to.it](https://www.gtt.to.it)).
- **Resilienza Offline**: In caso di mancata connessione al server GTT o blocchi CORS, l'app attiva istantaneamente un dataset locale integrato con le principali linee metropolitane, tramviarie e bus di Torino.

---

## 🚀 Come Eseguire in Locale

### Prerequisiti
- Node.js (versione 18 o superiore)
- npm

### Installazione ed Avvio

```bash
# 1. Clona il repository
git clone https://github.com/VicRosa06/Torino-Transit.git
cd Torino-Transit

# 2. Installa le dipendenze
npm install

# 3. Avvia il server di sviluppo
npm run dev
```

L'applicazione sarà accessibile su `http://localhost:5173/Torino-Transit/`.

### Build di Produzione

```bash
npm run build
npm run preview
```

---

## 🌐 Pubblicazione su GitHub Pages

Il progetto include già il workflow GitHub Actions in `.github/workflows/deploy.yml`.

Per attivare la pubblicazione automatica su GitHub:
1. Fai il push del codice sul tuo repository GitHub:
   ```bash
   git add .
   git commit -m "feat: Torino Transit V1 release"
   git push origin main
   ```
2. Sul repository GitHub, vai in **Settings** > **Pages**.
3. Sotto **Build and deployment** > **Source**, seleziona **GitHub Actions**.
4. Ogni push sul branch `main` compilerà e pubblicherà automaticamente l'app all'indirizzo:
   `https://<tuo-utente>.github.io/Torino-Transit/`

---

## 🔒 Sicurezza e Privacy

- **Nessuna API Key Segreta**: L'app non contiene password, token privati o credenziali.
- **Nessun Database Remoto**: I preferiti e le impostazioni restano memorizzati esclusivamente nella memoria locale del dispositivo dell'utente.
- **Nessun Tracciamento**: Nessun servizio di analytics o monetizzazione di terze parti.
- **Nessun Servizio a Pagamento**: Rispetta rigorosamente il vincolo di costo operativo €0.

---

## 📱 Aggiungere alla Schermata Home (iOS / iPhone)

1. Apri l'app in Safari su iPhone.
2. Tocca l'icona **Condividi** (il quadrato con la freccia verso l'alto).
3. Scorri verso il basso e seleziona **Aggiungi alla schermata Home**.
4. Tocca **Aggiungi** in alto a destra: l'icona apparirà sulla schermata principale come un'app nativa.
