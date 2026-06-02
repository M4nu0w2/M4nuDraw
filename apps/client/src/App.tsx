import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents, Room, User, RoundResult, AvatarConfig } from '@skribbl/shared';
import { LobbyEntry } from './components/LobbyEntry';
import { GameRoom } from './components/GameRoom';
import { soundManager } from './utils/sound';

// Connessione al backend
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3001');

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
}

function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [wordChoices, setWordChoices] = useState<string[]>([]);
  const [secretWord, setSecretWord] = useState<string>('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string>(socket.id || '');
  const [roundSummary, setRoundSummary] = useState<{ word: string; results: RoundResult[] } | null>(null);
  
  const roomPlayersRef = useRef<User[]>([]);
  
  // Tracciamento dello stato precedente per i suoni del timer e degli indovini
  const prevTimeLeftRef = useRef<number | undefined>(undefined);
  const prevTimerTypeRef = useRef<string | undefined>(undefined);
  const prevCorrectGuesserIdsRef = useRef<string[]>([]);
  
  // Traccia l'ID della stanza per cui sono già state accreditate le monete a fine partita
  const lastCreditedRoomRef = useRef<string | null>(null);

  // Sincronizza il ref con l'elenco giocatori ogni volta che cambia lo stato della stanza
  useEffect(() => {
    roomPlayersRef.current = room?.players || [];
  }, [room]);

  useEffect(() => {
    socket.on('connect', () => {
      setCurrentPlayerId(socket.id || '');
      console.log('Socket.IO Connected');
    });

    socket.on('disconnect', () => {
      setCurrentPlayerId('');
      console.log('Socket.IO Disconnected');
    });

    socket.on('roomState', (newRoom) => {
      setRoom(newRoom);
      
      // Accredito monete al podio alla fine della partita (FINISHED)
      if (newRoom.status === 'FINISHED' && lastCreditedRoomRef.current !== newRoom.id) {
        lastCreditedRoomRef.current = newRoom.id;
        
        // Ordina i giocatori del podio
        const sortedPlayers = [...newRoom.players].sort((a, b) => b.score - a.score);
        const myIndex = sortedPlayers.findIndex(p => p.id === socket.id);
        
        if (myIndex !== -1 && myIndex < 3) {
          let rewardCoins = 0;
          if (myIndex === 0) rewardCoins = 10;  // 1° Posto
          else if (myIndex === 1) rewardCoins = 5;  // 2° Posto
          else if (myIndex === 2) rewardCoins = 3;  // 3° Posto
          
          if (rewardCoins > 0) {
            const currentCoinsStr = localStorage.getItem('m4nu_coins') || '500';
            const currentCoins = parseInt(currentCoinsStr, 10);
            const nextCoins = currentCoins + rewardCoins;
            localStorage.setItem('m4nu_coins', nextCoins.toString());
          }
        }
      }

      // Reimposta il ref se entriamo in LOBBY o PLAYING per prepararsi a una nuova partita
      if (newRoom.status === 'LOBBY' || newRoom.status === 'PLAYING') {
        lastCreditedRoomRef.current = null;
      }
      
      // Reset roundSummary if we enter a new active state
      if (newRoom.timerType === 'CHOOSE_WORD' || newRoom.timerType === 'DRAWING' || newRoom.status === 'LOBBY') {
        setRoundSummary(null);
      }
      
      // 1. Suono ticchettio timer (timeLeft <= 5s)
      if (
        newRoom.status === 'PLAYING' && 
        newRoom.timerType === 'DRAWING' && 
        newRoom.timeLeft !== undefined
      ) {
        const prevTime = prevTimeLeftRef.current;
        const prevType = prevTimerTypeRef.current;
        
        if (
          prevType === 'DRAWING' && 
          prevTime !== undefined && 
          newRoom.timeLeft < prevTime
        ) {
          if (newRoom.timeLeft <= 5 && newRoom.timeLeft > 0) {
            soundManager.playTimerTick(newRoom.timeLeft <= 3);
          }
        }
      }

      // 2. Suono di notifica quando qualcun altro indovina la parola
      const newGuesserIds = newRoom.correctGuesserIds || [];
      const oldGuesserIds = prevCorrectGuesserIdsRef.current;
      if (newGuesserIds.length > oldGuesserIds.length) {
        const newlyAdded = newGuesserIds.filter(id => !oldGuesserIds.includes(id));
        const otherPlayerGuessed = newlyAdded.some(id => id !== socket.id);
        if (otherPlayerGuessed) {
          soundManager.playOtherGuess();
        }
      }

      prevTimeLeftRef.current = newRoom.timeLeft;
      prevTimerTypeRef.current = newRoom.timerType;
      prevCorrectGuesserIdsRef.current = newGuesserIds;
      
      // Pulisce le parole se il turno cambia e non siamo più noi a disegnare
      if (newRoom.currentDrawerId !== socket.id) {
        setWordChoices([]);
        setSecretWord('');
      }
    });

    socket.on('userJoined', (user) => {
      setRoom((prev) => {
        if (!prev) return null;
        if (prev.players.some((p) => p.id === user.id)) return prev;
        return {
          ...prev,
          players: [...prev.players, user]
        };
      });
    });

    socket.on('userLeft', (userId) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== userId)
        };
      });
    });

    socket.on('gameStarted', () => {
      setWordChoices([]);
      setSecretWord('');
      soundManager.playGameStart();
    });

    socket.on('wordChoices', (choices) => {
      setWordChoices(choices);
    });

    socket.on('secretWord', (word) => {
      setSecretWord(word);
    });

    socket.on('correctGuess', () => {
      console.log(`Hai indovinato la parola!`);
      soundManager.playCorrectGuess();
    });

    socket.on('roundEnded', (word, results) => {
      soundManager.playRoundEnd();
      setRoundSummary({ word, results });
    });

    socket.on('chatMessage', (userId, text) => {
      const senderName = roomPlayersRef.current.find((p) => p.id === userId)?.username || 'Giocatore';
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          senderId: userId,
          senderName,
          text,
          time: timestamp
        }
      ]);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('roomState');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('gameStarted');
      socket.off('wordChoices');
      socket.off('secretWord');
      socket.off('correctGuess');
      socket.off('roundEnded');
      socket.off('chatMessage');
    };
  }, []);

  const handleJoinRoom = (roomId: string, username: string, avatar?: AvatarConfig) => {
    socket.emit('joinRoom', roomId, username, avatar);
  };

  const handleSendMessage = (text: string) => {
    socket.emit('chatMessage', text);
  };

  const handleStartGame = (maxRounds?: number, category?: string) => {
    socket.emit('startGame', maxRounds, category);
  };

  const handleBackToLobby = () => {
    socket.emit('backToLobby');
  };

  const handleSelectWord = (word: string) => {
    socket.emit('selectWord', word);
    setWordChoices([]);
  };

  const handleLeaveRoom = () => {
    socket.disconnect();
    setRoom(null);
    setMessages([]);
    setWordChoices([]);
    setSecretWord('');
    setCurrentPlayerId('');
    setRoundSummary(null);
    // Riconnetti subito per essere pronto per una nuova partita
    socket.connect();
  };

  return (
    <>
      {room === null ? (
        <LobbyEntry onJoinRoom={handleJoinRoom} />
      ) : (
        <GameRoom
          room={room}
          currentPlayerId={currentPlayerId}
          messages={messages}
          socket={socket}
          wordChoices={wordChoices}
          secretWord={secretWord}
          onSendMessage={handleSendMessage}
          onLeaveRoom={handleLeaveRoom}
          onStartGame={handleStartGame}
          onSelectWord={handleSelectWord}
          roundSummary={roundSummary}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </>
  );
}

export default App;
