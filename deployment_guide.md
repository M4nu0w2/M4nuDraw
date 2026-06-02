# 🚀 Guida al Deploy di M4nuDraw

Questa guida descrive passo-passo come configurare e pubblicare in produzione l'applicazione **M4nuDraw** su **Render** (per il server Socket.IO) e su **Vercel** (per il client React/Vite).

Dato che il progetto utilizza una struttura **Monorepo (npm workspaces)**, è fondamentale seguire le istruzioni relative alle cartelle di build per evitare errori di compilazione dovuti alle dipendenze condivise (come `@m4nudraw/shared`).

---

## 🛠️ Architettura del Monorepo
* **Root del repository**: Gestione complessiva e orchestrazione dei pacchetti.
* **`apps/server`**: Server Express + Socket.IO (motore di gioco in-memory).
* **`apps/client`**: Client React + Vite + TypeScript (interfaccia utente e canvas).
* **`packages/shared`**: Interfacce e tipi condivisi da client e server.

---

## 📦 1. Deploy del Backend su Render (Server)

Il backend gestisce le connessioni Socket.IO e deve essere deployato su un servizio cloud persistente. Utilizzeremo **Render** (Web Service).

### Passaggi su Render:
1. Accedi a [Render](https://render.com/) e clicca su **New +** -> **Web Service**.
2. Collega il tuo repository GitHub/GitLab.
3. Configura i seguenti campi fondamentali:
   * **Name**: `m4nudraw-backend` (o un nome a tua scelta).
   * **Region**: Scegli quella più vicina a te (es. *Frankfurt*).
   * **Branch**: `main` (o il tuo branch principale).
   * **Root Directory**: Lascia **vuoto** (o `./`). *Nota: Non impostare `apps/server` come Root Directory, altrimenti il compilatore non riuscirà a vedere `@m4nudraw/shared`!*
   * **Runtime**: `Node`.
   * **Build Command**: `npm install && npm run build -w @m4nudraw/shared && npm run build -w @m4nudraw/server`
   * **Start Command**: `npm run start -w @m4nudraw/server`
4. Clicca su **Advanced** e aggiungi le seguenti **Environment Variables**:
   * `NODE_ENV`: `production`
   * `CLIENT_URL`: `https://tuo-client.vercel.app` (Sostituisci con l'URL finale del tuo frontend Vercel per abilitare le richieste CORS!).
5. Clicca su **Create Web Service**.

---

## 🎨 2. Deploy del Frontend su Vercel (Client)

Il frontend è un'app statica React compilata tramite Vite, ottimale da ospitare gratuitamente su **Vercel**.

### Passaggi su Vercel:
1. Accedi a [Vercel](https://vercel.com/) e clicca su **Add New** -> **Project**.
2. Seleziona il tuo repository monorepo.
3. Nella schermata di configurazione del progetto:
   * **Framework Preset**: `Vite` (rilevato automaticamente).
   * **Root Directory**: Lascia **vuoto** (o `./`). *Nota: Lasciamo la root del monorepo per permettere a Vercel di compilare prima il pacchetto `@m4nudraw/shared`.*
   * **Build and Output Settings** (Espandi la sezione):
     * **Build Command**: Abilita l'override e imposta `npm run build:client`
     * **Output Directory**: Abilita l'override e imposta `apps/client/dist`
     * **Install Command**: Abilita l'override e imposta `npm install`
   * **Environment Variables** (Espandi la sezione):
     * Aggiungi `VITE_WS_URL` con il valore dell'URL del backend su Render (es. `https://m4nudraw-backend.onrender.com`).
4. Clicca su **Deploy**.

---

## 🔄 3. Verifica e Risoluzione dei Problemi

### CORS Errors (Connessione fallita)
Se riscontri errori di connessione Socket.IO in console (errore CORS), assicurati che la variabile d'ambiente `CLIENT_URL` impostata su Render corrisponda perfettamente all'indirizzo HTTPS generato da Vercel per il tuo client (senza barra `/` finale).

### Errore `@m4nudraw/shared` non trovato
Se la build fallisce indicando che `@m4nudraw/shared` non è risolto o non è stato trovato, verifica di non aver configurato la "Root Directory" di Vercel o Render all'interno delle sotto-cartelle `apps/*`. Per i monorepo, i comandi di installazione e orchestrazione devono sempre essere lanciati a partire dalla cartella principale (Root).
