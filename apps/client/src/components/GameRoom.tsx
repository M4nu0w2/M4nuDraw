import React, { useState, useEffect, useRef } from 'react';
import { Room, RoundResult } from '@m4nudraw/shared';
import { Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@m4nudraw/shared';
import { Copy, Check, Send, LogOut, Users, MessageSquare, Shield, HelpCircle, Palette, Volume2, VolumeX } from 'lucide-react';
import { getAvatarStyles } from '../utils/avatar';
import { ModularAvatar } from './ModularAvatar';
import { DrawingCanvas } from './DrawingCanvas';
import { WordSelector } from './WordSelector';
import { soundManager } from '../utils/sound';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
}

interface GameRoomProps {
  room: Room;
  currentPlayerId: string;
  messages: Message[];
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  wordChoices: string[];
  secretWord: string;
  onSendMessage: (message: string) => void;
  onLeaveRoom: () => void;
  onStartGame: (maxRounds?: number, category?: string) => void;
  onSelectWord: (word: string) => void;
  roundSummary: { word: string; results: RoundResult[] } | null;
  onBackToLobby?: () => void;
}

const EMOJIS = ['😂', '😮', '🔥', '🎉', '👑', '💩'];

const THEMES = [
  { id: 'sketch', name: 'Sketchbook', icon: '✏️' },
  { id: 'cyberpunk', name: 'Cyberpunk', icon: '🌌' },
  { id: 'matrix', name: 'Matrix', icon: '🟢' },
  { id: 'sunset', name: 'Sunset', icon: '🌅' },
  { id: 'vaporwave', name: 'Vaporwave', icon: '🌸' }
];

export const GameRoom: React.FC<GameRoomProps> = ({
  room,
  currentPlayerId,
  messages,
  socket,
  wordChoices,
  secretWord,
  onSendMessage,
  onLeaveRoom,
  onStartGame,
  onSelectWord,
  roundSummary,
  onBackToLobby
}) => {
  const [messageText, setMessageText] = useState('');
  const [selectedRounds, setSelectedRounds] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState('generale');
  const [copied, setCopied] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());
  
  // STATO PER TEMI E PARTICLE DI REACTION EMOJI
  const [theme, setTheme] = useState(() => localStorage.getItem('m4nu_theme') || 'sketch');
  const [emojiParticles, setEmojiParticles] = useState<{ id: number; char: string; left: number }[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Applica il tema al body
  useEffect(() => {
    THEMES.forEach((t) => {
      document.body.classList.remove(`theme-${t.id}`);
    });
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('m4nu_theme', theme);
  }, [theme]);

  // Gestione Socket per Emojis
  useEffect(() => {
    const handleEmojiReaction = (_userId: string, emoji: string) => {
      const id = Date.now() + Math.random();
      const left = Math.random() * 85 + 5; // dal 5% al 90%
      setEmojiParticles((prev) => [...prev, { id, char: emoji, left }]);
      
      // Auto-rimozione della particle dopo 3 secondi (fine animazione floatUp)
      setTimeout(() => {
        setEmojiParticles((prev) => prev.filter((p) => p.id !== id));
      }, 3000);
    };

    socket.on('emojiReaction', handleEmojiReaction);
    return () => {
      socket.off('emojiReaction', handleEmojiReaction);
    };
  }, [socket]);

  const handleSendEmoji = (emoji: string) => {
    socket.emit('emojiReaction', emoji);
  };

  const handleToggleSound = () => {
    const nextVal = soundManager.toggle();
    setSoundEnabled(nextVal);
  };

  // Auto-scroll all'ultimo messaggio
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    onSendMessage(messageText.trim());
    setMessageText('');
  };

  const isHost = room.ownerId === currentPlayerId;
  const isDrawer = room.currentDrawerId === currentPlayerId;
  const currentDrawer = room.players.find(p => p.id === room.currentDrawerId);

  // Visualizza la parola segreta o i trattini spaziatati correttamente
  const renderWordDisplay = () => {
    if (isDrawer) {
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Parola da Disegnare:</span>
          <span className="text-2xl font-black tracking-widest text-slate-100 uppercase bg-blue-900/30 px-4 py-1.5 rounded-xl border border-blue-500/20">{secretWord || room.currentWord}</span>
        </div>
      );
    }

    if (room.currentWordDisguised) {
      // Sostituisce la stringa senza spazi (es: "____") con spazi ampi (es: "_ _ _ _")
      const formatted = room.currentWordDisguised.split('').join(' ');
      return (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Parola da Indovinare:</span>
          <span className="text-2xl font-mono font-black tracking-[0.4em] pl-[0.4em] text-slate-200 bg-purple-900/20 px-4 py-1.5 rounded-xl border border-purple-500/10">{formatted}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-slate-400 animate-pulse py-1">
        <HelpCircle size={18} />
        <span className="text-sm font-medium">In attesa che la parola venga scelta...</span>
      </div>
    );
  };

  return (
    <div className="h-screen max-h-screen w-full bg-slate-950/40 bg-doodle-grid text-slate-100 flex flex-col p-4 md:p-5 relative overflow-hidden font-sans box-border">
      {/* Background blobs decorativi */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full filter blur-[120px] pointer-events-none"></div>

      {/* Renders Floating Emojis Reaction Particles */}
      {emojiParticles.map((p) => (
        <div
          key={p.id}
          style={{ left: `${p.left}%`, bottom: '20px' }}
          className="emoji-particle select-none"
        >
          {p.char}
        </div>
      ))}

      {/* MODALE DI SCELTA PAROLA PER IL DISEGNATORE */}
      {room.status === 'PLAYING' && isDrawer && !room.wordChosen && wordChoices.length > 0 && (
        <WordSelector words={wordChoices} onSelectWord={onSelectWord} />
      )}

      {/* Header Panel */}
      <header className="relative z-10 w-full max-w-7xl mx-auto mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 md:p-4 backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 hover:scale-105 transition-transform duration-200 cursor-default select-none">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]">
              <defs>
                <linearGradient id="headerMGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="headerPencilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <linearGradient id="headerEraserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f472b6" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
                <filter id="headerNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d="M 256,50 L 259,65 L 274,68 L 259,71 L 256,86 L 253,71 L 238,68 L 253,65 Z" fill="#facc15" filter="url(#headerNeonGlow)" />
              <g filter="url(#headerNeonGlow)">
                <rect x="110" y="140" width="48" height="230" rx="24" fill="url(#headerMGrad)" />
                <path d="M 134,164 L 256,286 L 378,164" fill="none" stroke="url(#headerMGrad)" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <g>
                <path d="M 354,140 C 354,116 402,116 402,140 Z" fill="url(#headerEraserGrad)" stroke="#1e293b" strokeWidth="11" strokeLinejoin="round" />
                <rect x="354" y="140" width="48" height="24" fill="#e2e8f0" stroke="#1e293b" strokeWidth="11" />
                <rect x="354" y="164" width="48" height="140" rx="6" fill="url(#headerPencilGrad)" stroke="#1e293b" strokeWidth="11" />
                <path d="M 354,304 L 378,360 L 402,304 Z" fill="#fed7aa" stroke="#1e293b" strokeWidth="11" strokeLinejoin="round" />
                <path d="M 370,340 L 378,360 L 386,340 Z" fill="#ec4899" stroke="#1e293b" strokeWidth="3" strokeLinejoin="round" />
                <circle cx="367" cy="220" r="5" fill="#1e293b" />
                <circle cx="389" cy="220" r="5" fill="#1e293b" />
                <circle cx="361" cy="228" r="3.5" fill="#f43f5e" opacity="0.6" />
                <circle cx="395" cy="228" r="3.5" fill="#f43f5e" opacity="0.6" />
                <path d="M 372,229 C 374,235 382,235 384,229" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              </g>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2.5">
              {room.status === 'LOBBY' ? 'Stanza di Attesa' : 'Stanza di Gioco'}
              {room.status === 'PLAYING' && room.currentRound !== undefined && room.maxRounds !== undefined && (
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-0.5 rounded-full select-none tracking-wide animate-pulse">
                  Turno {room.currentRound} di {room.maxRounds}
                </span>
              )}
              {room.status === 'PLAYING' && room.wordCategory && (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full select-none tracking-wide uppercase">
                  🎨 {room.wordCategory}
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {room.status === 'LOBBY' ? 'In attesa dell\'inizio della partita' : 'Disegna e indovina!'}
            </p>
          </div>
        </div>

        {/* STATO PAROLA CORRENTE (SOLO IN GIOCO) */}
        {room.status === 'PLAYING' && room.wordChosen && (
          <div className="flex-grow flex items-center justify-center">
            {renderWordDisplay()}
          </div>
        )}

        <div className="flex items-center flex-wrap gap-3">
          {/* Theme Customizer Switcher */}
          <div className="flex gap-1 items-center bg-slate-950/85 border border-slate-850 p-1 rounded-xl">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all active:scale-90 cursor-pointer ${
                  theme === t.id
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-500 hover:text-slate-350'
                }`}
                title={`Attiva tema ${t.name}`}
              >
                <span>{t.icon}</span>
              </button>
            ))}
          </div>

          {/* Room ID Tag */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-850 px-3 py-1.5 rounded-xl text-sm font-semibold">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Codice:</span>
            <span className="text-blue-400 tracking-wide">{room.id}</span>
            <button
              onClick={copyRoomCode}
              className="ml-1 p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 active:scale-95 transition-all duration-150"
              title="Copia codice stanza"
            >
              {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Sound Toggle Button */}
          <button
            onClick={handleToggleSound}
            className="flex items-center justify-center p-2 bg-slate-950/80 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200 rounded-xl active:scale-95 transition-all duration-150 cursor-pointer"
            title={soundEnabled ? 'Disattiva Audio' : 'Attiva Audio'}
          >
            {soundEnabled ? <Volume2 size={14} className="text-blue-400" /> : <VolumeX size={14} className="text-slate-500" />}
          </button>

          {/* Leave Button */}
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 font-semibold rounded-xl text-xs active:scale-95 transition-all duration-150"
          >
            <LogOut size={14} />
            Esci
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden min-h-0 h-full pb-2">
        
        {/* Left Side: Players List */}
        <section className="lg:col-span-1 flex flex-col backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 h-full overflow-hidden">
          <h2 className="text-sm font-bold flex items-center justify-between mb-4 text-slate-200 border-b border-slate-850 pb-2">
            <span>Giocatori ({room.players.length}/8)</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">Max 8</span>
          </h2>

          <div className="flex-grow space-y-2 overflow-y-auto pr-1 min-h-0">
            {(() => {
              const displayedPlayers = [...room.players];
              if (room.status !== 'LOBBY') {
                displayedPlayers.sort((a, b) => b.score - a.score);
              }
              return displayedPlayers.map((player, index) => {
                const rank = index + 1;
                const isMe = player.id === currentPlayerId;
                const isPlayerHost = player.id === room.ownerId;
                const isPlayerDrawer = player.id === room.currentDrawerId;
                const hasGuessed = room.correctGuesserIds?.includes(player.id);

                return (
                  <div
                    key={player.id}
                    className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                      hasGuessed
                        ? 'bg-emerald-500/5 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.06)]'
                        : isPlayerDrawer
                        ? 'bg-purple-600/10 border-purple-500/30 hover:border-purple-500/40'
                        : isMe
                        ? 'bg-blue-600/10 border-blue-500/30 hover:border-blue-500/40'
                        : room.status !== 'LOBBY' && rank === 1
                        ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
                        : room.status !== 'LOBBY' && rank === 2
                        ? 'bg-slate-400/5 border-slate-400/20 hover:border-slate-400/30'
                        : room.status !== 'LOBBY' && rank === 3
                        ? 'bg-amber-600/5 border-amber-600/20 hover:border-amber-600/30'
                        : 'bg-slate-950/60 border-slate-850/60 hover:border-slate-800 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Rank Number Badge */}
                      {room.status !== 'LOBBY' && (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black select-none flex-shrink-0 transition-transform duration-200 group-hover:scale-110 shadow-sm ${
                          rank === 1
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                            : rank === 2
                            ? 'bg-gradient-to-r from-slate-300 to-slate-450 text-slate-950 shadow-[0_0_6px_rgba(148,163,184,0.3)]'
                            : rank === 3
                            ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-[0_0_6px_rgba(180,83,9,0.3)]'
                            : 'bg-slate-950/80 text-slate-400 border border-slate-850'
                        }`}>
                          {rank}°
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="w-9 h-9 flex items-center justify-center transition-transform group-hover:scale-105 duration-200 overflow-visible bg-transparent flex-shrink-0">
                        <ModularAvatar avatar={player.avatar} size={36} animate={false} />
                      </div>

                      {/* Details */}
                      <div>
                        <div className="font-bold text-xs text-slate-200 flex items-center gap-1.5 flex-wrap">
                          {room.status !== 'LOBBY' && rank === 1 && (
                            <span className="text-yellow-400 animate-bounce select-none mr-0.5" title="Primo Posto!">👑</span>
                          )}
                          {room.status !== 'LOBBY' && rank === 2 && (
                            <span className="text-slate-350 select-none mr-0.5" title="Secondo Posto!">🥈</span>
                          )}
                          {room.status !== 'LOBBY' && rank === 3 && (
                            <span className="text-amber-600 select-none mr-0.5" title="Terzo Posto!">🥉</span>
                          )}
                          <span>{player.username}</span>
                          {isMe && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 font-bold px-1 py-0.2 rounded border border-blue-500/25">
                              Tu
                            </span>
                          )}
                          {isPlayerHost && (
                            <span className="text-yellow-500" title="Host della Stanza">
                              <Shield size={10} className="fill-yellow-500/20" />
                            </span>
                          )}
                          {isPlayerDrawer && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-400 font-bold px-1 py-0.2 rounded border border-purple-500/25 flex items-center gap-0.5">
                              <Palette size={8} />
                              Disegna
                            </span>
                          )}
                          {hasGuessed && (
                            <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-0.5 animate-bounce">
                              ✓ Indovinato
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          Punteggio: <span className={
                            room.status !== 'LOBBY' && rank === 1 ? 'text-yellow-400 font-bold' :
                            room.status !== 'LOBBY' && rank === 2 ? 'text-slate-300 font-bold' :
                            room.status !== 'LOBBY' && rank === 3 ? 'text-amber-500 font-bold' :
                            'text-slate-400'
                          }>{player.score} XP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Start Game Action Bar (LOBBY ONLY) */}
          {room.status === 'LOBBY' && (
            <div className="mt-4 pt-4 border-t border-slate-850/60 flex flex-col items-center justify-center gap-3 flex-shrink-0">
              {isHost ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold px-1 tracking-wider">
                    <span>TURNI DI GIOCO:</span>
                    <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-extrabold">{selectedRounds} Turni</span>
                  </div>
                  <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-850/60">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRounds(r)}
                        className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all duration-150 ${
                          selectedRounds === r
                            ? 'bg-blue-600 border border-blue-500 text-white shadow-md shadow-blue-500/25'
                            : 'text-slate-500 hover:text-slate-350 hover:bg-slate-900/30'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-extrabold px-1 tracking-wider mt-1">
                    <span>CATEGORIA DIZIONARIO:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850/60 w-full">
                    {[
                      { id: 'generale', name: 'Classico 🇮🇹' },
                      { id: 'animali', name: 'Animali 🦊' },
                      { id: 'cibo', name: 'Cibo 🍕' },
                      { id: 'geek', name: 'Geek 🎮' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex-1 py-1 text-[10px] font-black rounded-lg transition-all duration-150 truncate ${
                          selectedCategory === cat.id
                            ? 'bg-purple-600 border border-purple-500 text-white shadow-md shadow-purple-500/25'
                            : 'text-slate-500 hover:text-slate-350 hover:bg-slate-905'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => onStartGame(selectedRounds, selectedCategory)}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/20 text-slate-100 hover:text-white rounded-xl font-bold active:scale-[0.98] shadow-lg shadow-blue-900/30 transition-all duration-150 mt-2"
                  >
                    Avvia Partita
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-bold text-center px-4 py-2 border border-slate-850 rounded-xl bg-slate-950/40 w-full animate-pulse">
                  In attesa dell'Host per avviare...
                </div>
              )}
            </div>
          )}
        </section>

        {/* Center: Drawing Area */}
        <section className="lg:col-span-2 flex flex-col backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 lg:p-5 h-full overflow-hidden min-h-0 justify-between">
          {room.status === 'FINISHED' ? (
            /* Winner podium */
            <div className="flex flex-col items-center justify-center flex-grow p-4 animate-fadeIn overflow-y-auto max-h-full pr-1">
              <h2 className="text-xl font-black bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 bg-clip-text text-transparent uppercase tracking-wider text-center filter drop-shadow-[0_2px_12px_rgba(245,158,11,0.2)] animate-pulse">
                👑 Partita Terminata! 👑
              </h2>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1 mb-6">Ecco il Podio Finale dei Campioni</p>
              
              <div className="flex items-end justify-center gap-4 w-full max-w-sm mb-6 mt-2 h-[200px]">
                {/* 2° Posto */}
                {room.players[1] && (
                  <div className="flex flex-col items-center flex-1 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
                    <div className="relative group mb-2">
                      <div className="w-12 h-12 flex items-center justify-center overflow-visible group-hover:scale-105 transition-transform duration-200">
                        <ModularAvatar avatar={room.players[1].avatar} size={48} animate={true} />
                      </div>
                      <span className="absolute -top-3.5 -right-1 text-base filter drop-shadow">🥈</span>
                    </div>
                    <span className="text-xs font-black text-slate-300 truncate max-w-[80px]">{room.players[1].username}</span>
                    <span className="text-[9px] font-bold text-slate-500">{room.players[1].score} XP</span>
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mt-1 flex items-center gap-0.5">🪙 +5</span>
                    
                    <div className="w-full h-16 bg-gradient-to-t from-slate-900 via-slate-800 to-slate-700/80 border border-slate-700/40 rounded-t-xl mt-2 flex items-center justify-center shadow-lg">
                      <span className="text-sm font-black text-slate-400">2°</span>
                    </div>
                  </div>
                )}

                {/* 1° Posto */}
                {room.players[0] && (
                  <div className="flex flex-col items-center flex-1 animate-[fadeIn_0.5s_ease-out]">
                    <div className="relative group mb-2">
                      <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
                      <div className="w-16 h-16 flex items-center justify-center overflow-visible shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:scale-105 transition-transform duration-200">
                        <ModularAvatar avatar={room.players[0].avatar} size={64} animate={true} />
                      </div>
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)] animate-bounce">👑</span>
                    </div>
                    <span className="text-sm font-black bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent truncate max-w-[90px]">{room.players[0].username}</span>
                    <span className="text-xs font-extrabold text-yellow-500">{room.players[0].score} XP</span>
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded mt-1 flex items-center gap-0.5 shadow-sm shadow-amber-500/15">🪙 +10</span>
                    
                    <div className="w-full h-24 bg-gradient-to-t from-yellow-950/40 via-amber-900/40 to-yellow-600/30 border border-yellow-500/40 rounded-t-xl mt-2 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.15)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(245,158,11,0.15)_50%,transparent_75%)] bg-[length:250px_250px] animate-[shimmer_3s_infinite_linear]" />
                      <span className="text-lg font-black text-yellow-400 filter drop-shadow-[0_2px_5px_rgba(245,158,11,0.4)]">1°</span>
                      <span className="text-[7px] text-yellow-550/80 font-black tracking-widest uppercase">Campione</span>
                    </div>
                  </div>
                )}

                {/* 3° Posto */}
                {room.players[2] && (
                  <div className="flex flex-col items-center flex-1 animate-[fadeIn_0.5s_ease-out_0.4s_both]">
                    <div className="relative group mb-2">
                      <div className="w-12 h-12 flex items-center justify-center overflow-visible group-hover:scale-105 transition-transform duration-200">
                        <ModularAvatar avatar={room.players[2].avatar} size={48} animate={true} />
                      </div>
                      <span className="absolute -top-3.5 -left-1 text-base filter drop-shadow">🥉</span>
                    </div>
                    <span className="text-xs font-black text-orange-400 truncate max-w-[80px]">{room.players[2].username}</span>
                    <span className="text-[9px] font-bold text-orange-550">{room.players[2].score} XP</span>
                    <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded mt-1 flex items-center gap-0.5">🪙 +3</span>
                    
                    <div className="w-full h-12 bg-gradient-to-t from-slate-900 via-orange-950/20 to-orange-900/20 border border-orange-900/30 rounded-t-xl mt-2 flex items-center justify-center shadow-lg">
                      <span className="text-xs font-black text-orange-455">3°</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full max-w-sm mt-4">
                {isHost ? (
                  <button
                    onClick={onBackToLobby}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-500/20 text-slate-100 hover:text-white rounded-xl font-bold active:scale-[0.98] shadow-lg shadow-emerald-950/30 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    🔄 Riapri Stanza & Nuova Partita
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-500 font-extrabold text-center px-4 py-2.5 border border-slate-850 rounded-xl bg-slate-950/40 w-full animate-pulse tracking-wide">
                    In attesa dell'Host per iniziare una nuova partita...
                  </div>
                )}
              </div>
            </div>
          ) : room.status === 'LOBBY' ? (
            /* Lobby screen with real-time settings card */
            <div className="flex flex-col items-center justify-center text-center p-6 flex-grow animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <Users size={28} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-black bg-gradient-to-r from-slate-100 to-indigo-300 bg-clip-text text-transparent uppercase tracking-wider">Benvenuto nella Stanza!</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                Condividi il codice in alto per invitare i tuoi amici (massimo 8 persone).
              </p>
              
              {/* Show selected settings card in real-time to everyone in the lobby! */}
              <div className="mt-5 p-4 bg-slate-950/60 border border-slate-850/80 rounded-2xl w-full max-w-xs flex flex-col gap-2.5 shadow-lg shadow-indigo-950/10">
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest border-b border-slate-900/60 pb-1.5 flex items-center justify-between">
                  <span>Impostazioni Partita</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-450 font-medium">Turni Totali:</span>
                  <span className="font-extrabold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">{room.maxRounds || 3} Turni</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-450 font-medium">Dizionario / Categoria:</span>
                  <span className="font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wide">🎨 {room.wordCategory || 'Generale'}</span>
                </div>
                <div className="mt-1 text-[9px] text-indigo-400/80 font-bold uppercase tracking-wider animate-pulse">
                  {isHost ? 'Pronto ad avviare la partita!' : 'In attesa dell\'Host per l\'avvio...'}
                </div>
              </div>
            </div>
          ) : (
            /* Drawing Canvas area */
            <div className="flex flex-col flex-grow justify-center relative h-full overflow-hidden min-h-0">
              {roundSummary && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-30 rounded-2xl flex flex-col items-center justify-center p-6 border border-purple-500/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] animate-[fadeIn_0.3s_ease-out]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-bounce">
                    <span className="text-3xl">🏆</span>
                  </div>

                  <h3 className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent uppercase tracking-wider">
                    Fine del Turno!
                  </h3>
                  
                  <div className="flex flex-col items-center mt-2 mb-4">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">La parola segreta era:</span>
                    <span className="mt-1 text-2xl font-black tracking-widest bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_8px_rgba(139,92,246,0.3)]">
                      {roundSummary.word}
                    </span>
                  </div>

                  <div className="w-full max-w-sm bg-slate-900/60 border border-slate-850/80 rounded-2xl p-4 flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold pb-1.5 border-b border-slate-850">
                      Punti Guadagnati in questo Turno:
                    </div>
                    {roundSummary.results.map((result) => {
                      const playerAvatar = room.players.find(p => p.id === result.userId)?.avatar;
                      const isDrawer = result.isDrawer;
                      const hasGuessed = result.hasGuessed;
                      
                      return (
                        <div 
                          key={result.userId}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-850/40 hover:border-slate-800 transition-all duration-150"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 flex items-center justify-center overflow-visible bg-transparent">
                              <ModularAvatar avatar={playerAvatar} size={28} animate={false} />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-200">{result.username}</span>
                                {isDrawer && (
                                  <span className="text-[8px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                                    ✏️ Disegnatore
                                  </span>
                                )}
                                {hasGuessed && (
                                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-extrabold flex items-center gap-0.5">
                                    ✓ Indovinato
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {result.pointsEarned > 0 ? (
                              <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg animate-[pulse_1.5s_infinite]">
                                +{result.pointsEarned} XP
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 bg-slate-950 border border-slate-900 px-2 py-0.5 rounded-lg">
                                +0 XP
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Time progress bar */}
              {room.timeLeft !== undefined && room.maxTime !== undefined && (
                <div className="w-full mb-4 flex flex-col gap-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span className="uppercase tracking-wider flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${room.timerType === 'CHOOSE_WORD' ? 'bg-purple-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                      {room.timerType === 'CHOOSE_WORD' ? 'Scelta della parola' : 'Tempo rimanente per disegnare'}
                    </span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-850 font-mono text-slate-200 text-xs">
                      {room.timeLeft}s
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-950 border border-slate-850 rounded-full overflow-hidden p-[2px]">
                    <div
                      style={{
                        width: `${room.timeLeft && room.maxTime ? (room.timeLeft / room.maxTime) * 100 : 0}%`,
                        transition: 'width 1s linear, background-color 0.5s ease'
                      }}
                      className={`h-full rounded-full ${
                        (room.timeLeft / room.maxTime) > 0.5
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : (room.timeLeft / room.maxTime) > 0.2
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-gradient-to-r from-rose-600 to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Waiting overlay for word choice */}
              {!room.wordChosen && (
                <div className="absolute inset-0 bg-slate-950/90 z-20 rounded-2xl flex flex-col items-center justify-center text-center p-6 border border-slate-850">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3 animate-spin">
                    <Palette size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    {isDrawer ? 'Scegli una parola segreta!' : `Scelta parola in corso...`}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mt-1 font-medium">
                    {isDrawer
                      ? 'Seleziona una delle opzioni dal menu a schermo.'
                      : `Il disegnatore ${currentDrawer?.username || ''} sta decidendo quale parola disegnare.`}
                  </p>
                </div>
              )}
              
              <DrawingCanvas isDrawer={isDrawer && room.wordChosen === true} socket={socket} />
            </div>
          )}
        </section>

        {/* Right Side: Chat & Emoji Reaction Panel */}
        <section className="lg:col-span-1 flex flex-col backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden h-full">
          {/* Chat Header */}
          <div className="px-4 py-3 border-b border-slate-850/60 flex items-center gap-2 bg-slate-900/20">
            <MessageSquare size={16} className="text-slate-400" />
            <h2 className="font-bold text-slate-200 text-xs tracking-wide">CHAT DELLA LOBBY</h2>
          </div>

          {/* Messages list */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-slate-950/20 min-h-0">
            {messages.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-4 text-slate-600">
                <MessageSquare size={24} className="stroke-[1.5] mb-2 opacity-35" />
                <p className="text-[10px] font-semibold uppercase tracking-wider">Nessun messaggio ancora</p>
                <p className="text-[10px] mt-0.5">Saluta i tuoi compagni di gioco!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isSystem = msg.senderId === 'SYSTEM';
                const isSystemWarning = msg.senderId === 'SYSTEM_WARNING';
                
                if (isSystem || isSystemWarning) {
                  return (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg text-center animate-fadeIn border ${
                        isSystemWarning
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-blue-500/10 border-blue-500/10 text-blue-400'
                      }`}
                    >
                      <p className="text-[10px] font-bold select-text leading-tight">{msg.text}</p>
                    </div>
                  );
                }

                const isGuessedMessage = msg.senderId.startsWith('GUESSED_');
                const actualSenderId = isGuessedMessage ? msg.senderId.replace('GUESSED_', '') : msg.senderId;
                const isMe = actualSenderId === currentPlayerId;
                const avatar = getAvatarStyles(msg.senderName);
                
                return (
                  <div key={msg.id} className="flex gap-2 items-start animate-fadeIn">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden border border-slate-800/30 bg-slate-950"
                      dangerouslySetInnerHTML={{ __html: avatar.svgHtml }}
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-[11px] font-extrabold truncate ${isMe ? 'text-blue-400' : 'text-slate-300'}`}>
                          {msg.senderName}
                        </span>
                        <span className="text-[8px] text-slate-600 flex-shrink-0">{msg.time}</span>
                      </div>
                      <p className={`text-[11px] leading-normal mt-0.5 font-medium select-text break-words ${
                        isGuessedMessage 
                          ? 'text-emerald-400 font-semibold' 
                          : 'text-slate-400'
                      }`}>
                        {isGuessedMessage && (
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded mr-1.5 select-none font-black uppercase tracking-wider">
                            ⭐ Indovinato
                          </span>
                        )}
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Interactive Emojis reactions strip */}
          <div className="flex justify-around bg-slate-950/65 border-t border-slate-850/60 p-2 gap-1 flex-shrink-0">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSendEmoji(emoji)}
                className="text-lg hover:scale-130 active:scale-95 transition-transform duration-150 p-1 bg-slate-950 border border-slate-850 hover:border-slate-750 rounded-xl cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-850/60 bg-slate-900/40 flex-shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  room.status === 'PLAYING' && isDrawer
                    ? 'Disegna! Non puoi scrivere...'
                    : 'Scrivi un messaggio o indovina...'
                }
                disabled={room.status === 'PLAYING' && isDrawer}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-4 pr-11 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              />
              <button
                type="submit"
                disabled={room.status === 'PLAYING' && isDrawer}
                className="absolute right-1.5 p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
              >
                <Send size={12} />
              </button>
            </div>
          </form>
        </section>

      </main>
    </div>
  );
};
