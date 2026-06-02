const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
const ROOM_ID = 'EMANU-TEST-ROOM';
const NUM_BOTS = 7;

console.log(`=== M4NUDRAW HYBRID MATCH SIMULATOR (7 BOTS + 1 USER) ===`);
console.log(`Server: ${SERVER_URL}`);
console.log(`Stanza da inserire nel browser: ${ROOM_ID}`);
console.log(`Numero di Bot pronti ad entrare: ${NUM_BOTS}\n`);
console.log(`ISTRUZIONI:`);
console.log(`1. Apri http://localhost:3000 nel tuo browser.`);
console.log(`2. Scegli un nickname, inserisci ID stanza "${ROOM_ID}" e clicca su Entra.`);
console.log(`3. Una volta dentro, i Bot si connetteranno ed entreranno nella tua stanza!`);
console.log(`4. Clicca su "Avvia Partita" dal tuo browser per giocare in diretta con loro!`);
console.log(`========================================================\n`);

const sockets = [];
let currentSecretWord = '';
let roomState = null;
let gameStarted = false;

const avatars = [
  { bodyColor: '#ef4444', hat: 'antenna', glasses: 'glasses3d', aura: 'rainbow', outfit: 'wizard' }, 
  { bodyColor: '#3b82f6', hat: 'beanie', glasses: 'pixel', aura: 'none', outfit: 'retro' },
  { bodyColor: '#10b981', hat: 'none', glasses: 'none', aura: 'fire', outfit: 'none' },
  { bodyColor: '#f59e0b', hat: 'crown', glasses: 'monocle', aura: 'none', outfit: 'none' },
  { bodyColor: '#8b5cf6', hat: 'none', glasses: 'glasses3d', aura: 'rainbow', outfit: 'wizard' },
  { bodyColor: '#ec4899', hat: 'antenna', glasses: 'none', aura: 'none', outfit: 'retro' },
  { bodyColor: '#14b8a6', hat: 'beanie', glasses: 'pixel', aura: 'fire', outfit: 'none' }
];

function connectBot(index) {
  const socket = io(SERVER_URL, {
    transports: ['websocket'],
    forceNew: true
  });
  
  const username = `Bot_${index + 1}`;
  sockets.push({ socket, username, index });

  socket.on('connect', () => {
    console.log(`🤖 [${username}] Connesso e in attesa nella stanza "${ROOM_ID}"...`);
    socket.emit('joinRoom', ROOM_ID, username, avatars[index]);
  });

  socket.on('roomState', (state) => {
    roomState = state;
    
    if (index === 0) {
      const hasRealPlayer = state.players.some(p => !p.username.startsWith('Bot_'));
      
      if (state.status === 'LOBBY' && hasRealPlayer && !gameStarted) {
        gameStarted = true;
        console.log(`\n>>> RILEVATO GIOCATORE REALE NELLA LOBBY!`);
        console.log(`>>> Bot_1 avvierà la partita in automatico tra 2 secondi...`);
        setTimeout(() => {
          console.log(`>>> Partita avviata automaticamente da Bot_1! Categoria: GEEK 🎮`);
          socket.emit('startGame', 3, 'geek');
        }, 2000);
      }
      
      // Resetta se il giocatore reale esce o torniamo in lobby
      if (state.status === 'LOBBY' && !hasRealPlayer && gameStarted) {
        gameStarted = false;
        console.log(`>>> Il giocatore reale è uscito. Reset stato avvio.`);
      }
    }

    if (state.status === 'FINISHED' && index === 0) {
      gameStarted = false; // reset per consentire una nuova partita
      console.log(`\n👑 PARTITA TERMINATA! Classifica finale stampata sul browser.`);
    }
  });

  socket.on('wordChoices', (choices) => {
    console.log(`✏️ [${username}] sta scegliendo la parola tra: [${choices.join(', ')}]`);
    const pickedWord = choices[0];
    setTimeout(() => {
      console.log(`✏️ [${username}] Ha selezionato: "${pickedWord}"`);
      socket.emit('selectWord', pickedWord);
      
      // Avvia il disegno automatico di una spirale artistica colorata sul canvas!
      setTimeout(() => {
        startDrawing(socket, username);
      }, 1000);
    }, 1500);
  });

  socket.on('secretWord', (word) => {
    currentSecretWord = word;
    console.log(`\n🔑 [SPOILER PER TE!] Il bot ${username} ha scelto la parola segreta: "${word.toUpperCase()}"!`);
    console.log(`💬 Digitala velocemente nella chat del tuo browser per indovinarla e fare punti!\n`);
  });
}

// Funzione per simulare il disegno in tempo reale sul canvas
function startDrawing(socket, username) {
  let strokeId = Math.floor(Math.random() * 100000);
  let step = 0;
  const maxSteps = 45;
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
  const drawColor = colors[Math.floor(Math.random() * colors.length)];
  
  // Svuota prima la lavagna per iniziare a disegnare!
  socket.emit('clearCanvas');
  
  // Calcola coordinate centrali
  const centerX = 200 + Math.random() * 100;
  const centerY = 150 + Math.random() * 80;
  let lastX = centerX;
  let lastY = centerY;
  
  const intervalId = setInterval(() => {
    // Esci se lo stato cambia, il turno finisce o finiamo il nostro disegno
    if (!roomState || roomState.status !== 'PLAYING' || roomState.currentDrawerId !== socket.id || step >= maxSteps) {
      clearInterval(intervalId);
      return;
    }
    
    // Genera una spirale armonica
    const theta = step * 0.45;
    const r = 4 + step * 3;
    const nextX = centerX + r * Math.cos(theta);
    const nextY = centerY + r * Math.sin(theta);
    
    // Invia il segmento di disegno al server!
    socket.emit('draw', {
      tool: 'pen',
      color: drawColor,
      size: 5,
      points: [lastX, lastY, nextX, nextY],
      strokeId: strokeId
    });
    
    lastX = nextX;
    lastY = nextY;
    step++;
  }, 120); // Velocità del tratto
}

// Controllo delle risposte esatte per i Bot
setInterval(() => {
  if (roomState && roomState.status === 'PLAYING' && roomState.wordChosen && currentSecretWord) {
    const drawerId = roomState.currentDrawerId;
    const wordToGuess = currentSecretWord;
    currentSecretWord = ''; // Consuma la parola
    
    sockets.forEach(({ socket, username, index }) => {
      const socketId = socket.id;
      if (socketId !== drawerId) {
        const alreadyGuessed = roomState.correctGuesserIds && roomState.correctGuesserIds.includes(socketId);
        if (!alreadyGuessed) {
          // I Bot rispondono a intervalli umani (tra 1 e 3 secondi)
          const delay = 1000 + (index * 300) + Math.random() * 500; 
          setTimeout(() => {
            socket.emit('chatMessage', wordToGuess);
          }, delay);
        }
      }
    });
  }
}, 500);

// Avvia la connessione dei bot
for (let i = 0; i < NUM_BOTS; i++) {
  setTimeout(() => {
    connectBot(i);
  }, i * 300);
}
