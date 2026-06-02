import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { ClientToServerEvents, ServerToClientEvents } from '@m4nudraw/shared';
import { setupSocket } from './socket';

dotenv.config();

// Verifica dinamica dell'origine della richiesta
const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Consente richieste server-to-server o strumenti di test

  // Consente localhost e porte di sviluppo
  if (
    origin.startsWith('http://localhost:') || 
    origin.startsWith('http://127.0.0.1:') || 
    origin.startsWith('http://[::1]:')
  ) {
    return true;
  }

  // Consente l'URL client configurato esplicitamente nelle variabili d'ambiente
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
    return true;
  }

  // Consente qualsiasi sotto-dominio di vercel.app (molto utile per i link di anteprima automatici di Vercel)
  if (origin.endsWith('.vercel.app')) {
    return true;
  }

  return false;
};

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
app.use(cors(corsOptions));

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('M4nuDraw API');
});

setupSocket(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
