import { Server } from 'socket.io';
import { ClientToServerEvents, ServerToClientEvents, Room, User, DrawData, RoundResult } from '@skribbl/shared';

const rooms = new Map<string, Room>();
const socketToUserMap = new Map<string, { roomId: string; username: string }>();
const roomTurnIndexMap = new Map<string, number>();
const roomChoicesMap = new Map<string, string[]>();
const roomDrawHistoryMap = new Map<string, DrawData[]>();
const roomTimerMap = new Map<string, NodeJS.Timeout>();
const roomTurnScoresMap = new Map<string, Map<string, number>>();

const WORD_PACKS: Record<string, string[]> = {
  generale: [
    'CASA', 'MELA', 'GATTO', 'CANE', 'SOLE', 'PIZZA', 'MACCHINA', 'COMPUTER', 'LIBRO', 'ALBERO',
    'TAVOLO', 'FIORE', 'TRENO', 'MARE', 'LUNA', 'PANE', 'CASTELLO', 'SCUOLA', 'TELEFONO', 'CHITARRA',
    'PESCE', 'PALLONE', 'LEONE', 'BOTTIGLIA', 'FINESTRA', 'SEDIA', 'OROLOGIO', 'MATITA', 'STREGA', 'DINOSAURO',
    'RUOTA PANORAMICA', 'TORRE EIFFEL', 'MONTAGNE RUSSE', 'SACCO A PELO', 'ISOLA DEL TESORO', 'PIRATA DEI CARAIBI',
    'CANE DA GUARDIA', 'GELATO AL CIOCCOLATO', 'SPAGHETTI AL POMODORO', 'CARTA IGIENICA', 'AEROPLANO', 'ARCOBALENO',
    'SPAZIO APERTO', 'TORTA DI COMPLEANNO', 'SPAZZOLINO DA DENTI', 'FUOCHI D ARTIFICIO', 'VALIGIA DI CARTONE'
  ],
  animali: [
    'LEONE', 'GATTO', 'CANE', 'ELEFANTE', 'DELFINO', 'SERPENTE', 'AQUILA', 'ORSO', 'TARTARUGA', 'PANDA',
    'RANA', 'PINGUINO', 'SCIMMIA', 'TIGRE', 'GIRAFFA', 'BALENA', 'SQUALO', 'CORVO', 'FARFALLA', 'ZANZARA',
    'LUPO', 'VOLPE', 'CONIGLIO', 'PIPISTRELLO', 'CAMMELLO', 'FOCA', 'LEOPARDO', 'PAPPAGALLO', 'IPPOPOTAMO'
  ],
  cibo: [
    'PIZZA', 'PANE', 'GELATO', 'SPAGHETTI', 'HAMBURGER', 'SUSHI', 'MELA', 'BANANA', 'CIOCCOLATO', 'FORMAGGIO',
    'PATATINE', 'CAFFE', 'BIRRA', 'TORTA', 'POMODORO', 'GELATO AL CIOCCOLATO', 'LASAGNA', 'BISCOTTO', 'CROSTATINA',
    'PANINO', 'INSALATA', 'ZUPPA', 'WURSTEL', 'COCA COLA', 'ARANCIA', 'FRAGOLA', 'LIMONE', 'PESCA', 'ANGURIA'
  ],
  geek: [
    'SUPER MARIO', 'MINECRAFT', 'PLAYSTATION', 'JOYSTICK', 'POKEMON', 'FORTNITE', 'ZELDA', 'TETRIS', 'PACMAN',
    'SPIDERMAN', 'BATMAN', 'MINIONS', 'SHREK', 'STEVE JOBS', 'HARRY POTTER', 'STAR WARS', 'DARTH VADER',
    'SPACESHIP', 'ALIENO', 'ROBOT', 'TIKTOK', 'YOUTUBE', 'NETFLIX', 'SMARTPHONE', 'CYBERPUNK', 'MATRIX'
  ]
};

const revealRandomHint = (room: Room, roomId: string, io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  if (!room.currentWord || !room.currentWordDisguised) return;
  const word = room.currentWord;
  const disguised = room.currentWordDisguised.split('');
  
  // Trova gli indici delle lettere che sono ancora coperte
  const hiddenIndices: number[] = [];
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== ' ' && disguised[i] === '_') {
      hiddenIndices.push(i);
    }
  }

  // Svela una lettera se ce ne sono almeno 2 coperte (lascia un mistero fino alla fine)
  if (hiddenIndices.length > 1) {
    const randIndex = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    disguised[randIndex] = word[randIndex];
    room.currentWordDisguised = disguised.join('');
    
    // Invia messaggio di sistema a tutti per annunciare l'indizio!
    // Usiamo SYSTEM_WARNING in modo che si distingua in chat
    io.to(roomId).emit('chatMessage', 'SYSTEM_WARNING', `💡 Indizio svelato: la parola contiene la lettera "${word[randIndex]}" alla posizione ${randIndex + 1}! 🎯`);
  }
};

const getLevenshteinDistance = (a: string, b: string): number => {
  const tmp = [];
  let i, j;
  for (i = 0; i <= a.length; i++) {
    tmp.push([i]);
  }
  for (j = 1; j <= b.length; j++) {
    tmp[0].push(j);
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
};

const getRoundResults = (room: Room, roomId: string): RoundResult[] => {
  const turnScores = roomTurnScoresMap.get(roomId) || new Map<string, number>();
  const correctGuessers = room.correctGuesserIds || [];
  return room.players.map((p) => {
    const isDrawer = p.id === room.currentDrawerId;
    const hasGuessed = correctGuessers.includes(p.id);
    const pointsEarned = turnScores.get(p.id) || 0;
    return {
      userId: p.id,
      username: p.username,
      pointsEarned,
      isDrawer,
      hasGuessed
    };
  }).sort((a, b) => b.pointsEarned - a.pointsEarned);
};

export const setupSocket = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  
  const startNewTurn = (roomId: string, playerIndex: number) => {
    const room = rooms.get(roomId);
    if (!room || room.players.length === 0) return;

    // Cancella timer attivi
    const activeTimer = roomTimerMap.get(roomId);
    if (activeTimer) {
      clearInterval(activeTimer);
    }

    const maxRounds = room.maxRounds || 3;
    const roundNumber = Math.floor(playerIndex / room.players.length) + 1;

    if (roundNumber > maxRounds) {
      // La partita è finita!
      room.status = 'FINISHED';
      room.currentDrawerId = undefined;
      room.currentWord = undefined;
      room.currentWordDisguised = undefined;
      room.wordChosen = false;
      room.timerType = undefined;
      room.timeLeft = undefined;
      room.maxTime = undefined;
      
      // Ordina i giocatori per punteggio finale per comodità di visualizzazione
      room.players.sort((a, b) => b.score - a.score);
      
      io.to(roomId).emit('roomState', room);
      io.to(roomId).emit('chatMessage', 'SYSTEM', 'Partita terminata! Ecco la classifica finale!');
      return;
    }

    room.currentRound = roundNumber;

    const index = playerIndex % room.players.length;
    roomTurnIndexMap.set(roomId, index);

    room.currentDrawerId = room.players[index].id;
    room.wordChosen = false;
    room.currentWord = undefined;
    room.currentWordDisguised = undefined;
    
    // Reset statistiche del turno
    room.correctGuesserIds = [];
    roomTurnScoresMap.set(roomId, new Map<string, number>());
    room.timerType = 'CHOOSE_WORD';
    room.timeLeft = 15;
    room.maxTime = 15;
    
    // Svuota la cronologia dei disegni per il nuovo turno
    roomDrawHistoryMap.set(roomId, []);

    // Scegli 3 parole casuali dal dizionario tematico scelto
    const activePack = WORD_PACKS[room.wordCategory || 'generale'] || WORD_PACKS['generale'];
    const shuffled = [...activePack].sort(() => 0.5 - Math.random());
    const choices = shuffled.slice(0, 3);
    roomChoicesMap.set(roomId, choices);

    io.to(roomId).emit('clearCanvas');
    io.to(roomId).emit('roomState', room);
    io.to(roomId).emit('turnStarted', room.currentDrawerId);
    
    // Invia le 3 parole esclusivamente al disegnatore
    io.to(room.currentDrawerId).emit('wordChoices', choices);
    io.to(roomId).emit('chatMessage', 'SYSTEM', `È il turno di disegnare di ${room.players[index].username}!`);

    // Avvia il timer di 15 secondi per scegliere la parola
    const timerInterval = setInterval(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.status !== 'PLAYING') {
        clearInterval(timerInterval);
        return;
      }

      if (currentRoom.timeLeft && currentRoom.timeLeft > 0) {
        currentRoom.timeLeft -= 1;
        io.to(roomId).emit('roomState', currentRoom);
      } else {
        clearInterval(timerInterval);
        // Tempo scaduto per la scelta della parola!
        if (!currentRoom.wordChosen) {
          const defaultWord = choices[0];
          currentRoom.wordChosen = true;
          currentRoom.currentWord = defaultWord.toUpperCase();
          currentRoom.currentWordDisguised = currentRoom.currentWord.replace(/[A-Z]/gi, '_');

          io.to(roomId).emit('chatMessage', 'SYSTEM', `Tempo per la scelta scaduto! Parola selezionata automaticamente.`);
          io.to(currentRoom.currentDrawerId!).emit('secretWord', currentRoom.currentWord);

          // Avvia timer di disegno
          startDrawingTimer(roomId);
        }
      }
    }, 1000);
    roomTimerMap.set(roomId, timerInterval);
  };

  const startDrawingTimer = (roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const activeTimer = roomTimerMap.get(roomId);
    if (activeTimer) {
      clearInterval(activeTimer);
    }

    room.timerType = 'DRAWING';
    room.timeLeft = 60;
    room.maxTime = 60;
    io.to(roomId).emit('roomState', room);

    const timerInterval = setInterval(() => {
      const currentRoom = rooms.get(roomId);
      if (!currentRoom || currentRoom.status !== 'PLAYING') {
        clearInterval(timerInterval);
        return;
      }

      if (currentRoom.timeLeft && currentRoom.timeLeft > 0) {
        currentRoom.timeLeft -= 1;
        
        // Svela un suggerimento a 40 e 20 secondi rimanenti
        if (currentRoom.timeLeft === 40 || currentRoom.timeLeft === 20) {
          revealRandomHint(currentRoom, roomId, io);
        }
        
        io.to(roomId).emit('roomState', currentRoom);
      } else {
        clearInterval(timerInterval);
        // Tempo di disegno scaduto!
        io.to(roomId).emit('chatMessage', 'SYSTEM', `Tempo scaduto! La parola era: ${currentRoom.currentWord}`);
        const results = getRoundResults(currentRoom, roomId);
        io.to(roomId).emit('roundEnded', currentRoom.currentWord || '', results);
        
        const currentIndex = roomTurnIndexMap.get(roomId) || 0;
        setTimeout(() => {
          startNewTurn(roomId, currentIndex + 1);
        }, 5000);
      }
    }, 1000);
    roomTimerMap.set(roomId, timerInterval);
  };

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', (roomId, username, avatarConfig) => {
      const existingRoom = rooms.get(roomId);
      if (existingRoom && existingRoom.players.length >= 8) {
        socket.emit('chatMessage', 'SYSTEM', 'Impossibile entrare: la stanza è piena (massimo 8 giocatori)!');
        return;
      }

      socket.join(roomId);
      
      const user: User = {
        id: socket.id,
        username,
        score: 0,
        avatar: avatarConfig
      };

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          players: [],
          status: 'LOBBY',
          ownerId: socket.id
        });
      }

      const room = rooms.get(roomId)!;
      
      if (!room.ownerId) {
        room.ownerId = socket.id;
      }

      if (!room.players.some(p => p.id === socket.id)) {
        room.players.push(user);
      }

      socketToUserMap.set(socket.id, { roomId, username });
      
      io.to(roomId).emit('userJoined', user);
      io.to(roomId).emit('roomState', room);

      // Invia la cronologia dei tratti di disegno correnti se presenti
      const history = roomDrawHistoryMap.get(roomId) || [];
      if (history.length > 0) {
        socket.emit('drawHistory', history);
      }
      
      console.log(`User ${username} (${socket.id}) joined room ${roomId}`);
    });

    socket.on('startGame', (maxRounds?: number, category?: string) => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        const room = rooms.get(roomId);
        if (room && room.ownerId === socket.id && room.status === 'LOBBY') {
          room.status = 'PLAYING';
          room.maxRounds = maxRounds || 3;
          room.currentRound = 1;
          room.wordCategory = category || 'generale';
          io.to(roomId).emit('gameStarted');
          io.to(roomId).emit('chatMessage', 'SYSTEM', `La partita sta per iniziare! Categoria: ${room.wordCategory.toUpperCase()}`);
          
          startNewTurn(roomId, 0);
        }
      }
    });

    socket.on('backToLobby', () => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        const room = rooms.get(roomId);
        if (room && room.ownerId === socket.id && room.status === 'FINISHED') {
          room.status = 'LOBBY';
          room.currentRound = undefined;
          room.maxRounds = undefined;
          room.currentDrawerId = undefined;
          room.currentWord = undefined;
          room.currentWordDisguised = undefined;
          room.wordChosen = false;
          room.timerType = undefined;
          room.timeLeft = undefined;
          room.maxTime = undefined;
          room.correctGuesserIds = [];
          
          room.players.forEach(p => {
            p.score = 0;
          });

          io.to(roomId).emit('roomState', room);
          io.to(roomId).emit('chatMessage', 'SYSTEM', 'L\'Host ha riportato la stanza in Lobby! Punteggi azzerati.');
        }
      }
    });

    socket.on('selectWord', (word) => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        const room = rooms.get(roomId);
        if (room && room.currentDrawerId === socket.id && !room.wordChosen) {
          room.wordChosen = true;
          room.currentWord = word.toUpperCase();
          room.currentWordDisguised = room.currentWord.replace(/[A-Z]/gi, '_');

          socket.emit('secretWord', room.currentWord);
          io.to(roomId).emit('roomState', room);
          io.to(roomId).emit('chatMessage', 'SYSTEM', 'Il disegnatore ha scelto la parola! Inizia il tempo!');
          
          startDrawingTimer(roomId);
        }
      }
    });

    socket.on('draw', (data) => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        
        if (!roomDrawHistoryMap.has(roomId)) {
          roomDrawHistoryMap.set(roomId, []);
        }
        roomDrawHistoryMap.get(roomId)!.push(data);

        socket.to(roomId).emit('drawData', data);
      }
    });

    socket.on('clearCanvas', () => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        roomDrawHistoryMap.set(roomId, []);
        io.to(roomId).emit('clearCanvas');
      }
    });

    socket.on('bombCanvas', () => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        roomDrawHistoryMap.set(roomId, []);
        io.to(roomId).emit('bombCanvas');
      }
    });

    socket.on('emojiReaction', (emoji) => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        io.to(roomId).emit('emojiReaction', socket.id, emoji);
      }
    });

    socket.on('undoStroke', () => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId } = userInfo;
        const room = rooms.get(roomId);
        
        // Permetti l'annullamento solo al disegnatore attivo nel turno
        if (room && room.status === 'PLAYING' && room.currentDrawerId === socket.id) {
          const history = roomDrawHistoryMap.get(roomId) || [];
          if (history.length > 0) {
            // Trova l'ultimo ID di tratto valido
            let lastStrokeId: number | undefined;
            for (let i = history.length - 1; i >= 0; i--) {
              if (history[i].strokeId !== undefined) {
                lastStrokeId = history[i].strokeId;
                break;
              }
            }
            
            if (lastStrokeId !== undefined) {
              // Rimuovi tutti i segmenti dell'ultimo tratto
              const updatedHistory = history.filter(segment => segment.strokeId !== lastStrokeId);
              roomDrawHistoryMap.set(roomId, updatedHistory);
              
              io.to(roomId).emit('clearCanvas');
              io.to(roomId).emit('drawHistory', updatedHistory);
            } else {
              // Fallback se nessun tratto ha ID: rimuove gli ultimi 15 segmenti
              const updatedHistory = history.slice(0, Math.max(0, history.length - 15));
              roomDrawHistoryMap.set(roomId, updatedHistory);
              
              io.to(roomId).emit('clearCanvas');
              io.to(roomId).emit('drawHistory', updatedHistory);
            }
          }
        }
      }
    });

    socket.on('chatMessage', (message) => {
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId, username } = userInfo;
        const room = rooms.get(roomId);
        
        if (room && room.status === 'PLAYING' && room.wordChosen && room.currentWord) {
          if (socket.id === room.currentDrawerId) {
            socket.emit('chatMessage', 'SYSTEM', 'Non puoi suggerire o scrivere in chat mentre stai disegnando!');
            return;
          }

          // Se l'utente ha già indovinato, non gli permettiamo di indovinare di nuovo
          if (room.correctGuesserIds?.includes(socket.id)) {
            return;
          }

          const cleanGuess = message.trim().toUpperCase();
          const cleanWord = room.currentWord.trim().toUpperCase();
          
          const noSpacesGuess = cleanGuess.replace(/\s+/g, '');
          const noSpacesWord = cleanWord.replace(/\s+/g, '');

          if (cleanGuess === cleanWord || noSpacesGuess === noSpacesWord) {
            // Risposta indovinata!
            const timeLeft = room.timeLeft || 0;
            const maxTime = room.maxTime || 60;
            
            // Formula di precisione temporale: da 50 a 200 punti per l'indovino
            const guesserPoints = Math.round(50 + (150 * (timeLeft / maxTime)));
            // Da 10 a 40 punti per il disegnatore (in base alla velocità dell'indovino)
            const drawerPoints = Math.round(10 + (30 * (timeLeft / maxTime)));

            const player = room.players.find(p => p.id === socket.id);
            if (player) {
              player.score += guesserPoints;
              
              // Registra i punti del turno
              const turnScores = roomTurnScoresMap.get(roomId) || new Map<string, number>();
              turnScores.set(player.id, guesserPoints);
              
              const drawer = room.players.find(p => p.id === room.currentDrawerId);
              if (drawer) {
                drawer.score += drawerPoints;
                turnScores.set(drawer.id, (turnScores.get(drawer.id) || 0) + drawerPoints);
              }
              roomTurnScoresMap.set(roomId, turnScores);
            }

            if (!room.correctGuesserIds) {
              room.correctGuesserIds = [];
            }
            room.correctGuesserIds.push(socket.id);

            socket.emit('correctGuess', socket.id);
            io.to(roomId).emit('chatMessage', 'SYSTEM', `${username} ha indovinato la parola segreta (+${guesserPoints} XP)!`);
            io.to(roomId).emit('roomState', room);

            // Se tutti gli indovini hanno indovinato, passa al turno successivo!
            const guessingPlayers = room.players.filter(p => p.id !== room.currentDrawerId);
            const allGuessed = guessingPlayers.every(p => room.correctGuesserIds?.includes(p.id));

            if (allGuessed && guessingPlayers.length > 0) {
              const activeTimer = roomTimerMap.get(roomId);
              if (activeTimer) {
                clearInterval(activeTimer);
              }

              io.to(roomId).emit('chatMessage', 'SYSTEM', `Tutti hanno indovinato! La parola era: ${room.currentWord}`);
              const results = getRoundResults(room, roomId);
              io.to(roomId).emit('roundEnded', room.currentWord || '', results);
              
              const currentIndex = roomTurnIndexMap.get(roomId) || 0;
              setTimeout(() => {
                startNewTurn(roomId, currentIndex + 1);
              }, 5000);
            }
            return;
          } else if (
            getLevenshteinDistance(cleanGuess, cleanWord) === 1 ||
            getLevenshteinDistance(noSpacesGuess, noSpacesWord) === 1
          ) {
            // Notifica PRIVATA solo all'utente locale di colore giallo/ambra
            socket.emit('chatMessage', 'SYSTEM_WARNING', `"${message}" è quasi corretta! Ci sei quasi! 🎯`);
            return;
          }
        }

        io.to(roomId).emit('chatMessage', socket.id, message);
        console.log(`[Chat - ${roomId}] ${username}: ${message}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const userInfo = socketToUserMap.get(socket.id);
      if (userInfo) {
        const { roomId, username } = userInfo;
        const room = rooms.get(roomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== socket.id);
          
          if (room.ownerId === socket.id && room.players.length > 0) {
            room.ownerId = room.players[0].id;
          }

          io.to(roomId).emit('userLeft', socket.id);
          console.log(`User ${username} left room ${roomId}`);

          if (room.players.length === 0) {
            const activeTimer = roomTimerMap.get(roomId);
            if (activeTimer) {
              clearInterval(activeTimer);
            }
            roomTimerMap.delete(roomId);
            rooms.delete(roomId);
            roomTurnIndexMap.delete(roomId);
            roomChoicesMap.delete(roomId);
            roomDrawHistoryMap.delete(roomId);
            console.log(`Room ${roomId} deleted as it is empty`);
          } else {
            if (room.status === 'PLAYING' && room.currentDrawerId === socket.id) {
              const nextIndex = roomTurnIndexMap.get(roomId) || 0;
              io.to(roomId).emit('chatMessage', 'SYSTEM', `Il disegnatore si è disconnesso. Cambio turno!`);
              startNewTurn(roomId, nextIndex);
            } else {
              // Rimuovi dai corretti indovini se presente
              if (room.correctGuesserIds) {
                room.correctGuesserIds = room.correctGuesserIds.filter(id => id !== socket.id);
              }
              io.to(roomId).emit('roomState', room);
            }
          }
        }
        socketToUserMap.delete(socket.id);
      }
    });
  });
};

// Antigravity Wild Features Reload Hook
