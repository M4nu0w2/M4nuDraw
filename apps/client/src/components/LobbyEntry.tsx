import React, { useState, useEffect } from 'react';
import { User, Hash, Play, Plus, AlertCircle, Volume2, VolumeX, ChevronLeft, ChevronRight, Lock, Check } from 'lucide-react';
import { soundManager } from '../utils/sound';
import {
  ModularAvatar,
  BODY_COLORS,
  AVAILABLE_EYES,
  AVAILABLE_MOUTHS,
  AVAILABLE_HATS,
  AVAILABLE_GLASSES,
  AVAILABLE_AURAS,
  AVAILABLE_OUTFITS,
  DEFAULT_AVATAR
} from './ModularAvatar';
import { AvatarConfig } from '@skribbl/shared';

interface LobbyEntryProps {
  onJoinRoom: (roomId: string, username: string, avatar: AvatarConfig) => void;
}

export const LobbyEntry: React.FC<LobbyEntryProps> = ({ onJoinRoom }) => {
  const [username, setUsername] = useState(() => localStorage.getItem('m4nu_username') || '');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  // STATO ECONOMIA & PERSONALIZZAZIONE (LocalStorage)
  const [coins, setCoins] = useState<number>(() => {
    const val = localStorage.getItem('m4nu_coins');
    if (val === null) {
      localStorage.setItem('m4nu_coins', '500'); // Regalo iniziale di 500 monete!
      return 500;
    }
    return parseInt(val, 10);
  });

  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => {
    const val = localStorage.getItem('m4nu_unlocked_cosmetics');
    if (val === null) {
      const initial = ['none'];
      localStorage.setItem('m4nu_unlocked_cosmetics', JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(val);
    } catch {
      return ['none'];
    }
  });

  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const val = localStorage.getItem('m4nu_equipped_avatar');
    if (val === null) {
      localStorage.setItem('m4nu_equipped_avatar', JSON.stringify(DEFAULT_AVATAR));
      return DEFAULT_AVATAR;
    }
    try {
      return { ...DEFAULT_AVATAR, ...JSON.parse(val) };
    } catch {
      return DEFAULT_AVATAR;
    }
  });

  // Salva username nel localStorage ad ogni modifica
  useEffect(() => {
    localStorage.setItem('m4nu_username', username);
  }, [username]);

  // Salva avatar nel localStorage ad ogni modifica
  useEffect(() => {
    localStorage.setItem('m4nu_equipped_avatar', JSON.stringify(avatar));
  }, [avatar]);

  const handleToggleSound = () => {
    const nextVal = soundManager.toggle();
    setSoundEnabled(nextVal);
  };

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `M4D-${code}`;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Inserisci un nome utente valido per iniziare!');
      return;
    }
    setError('');
    const newRoomCode = generateRoomCode();
    onJoinRoom(newRoomCode, username.trim(), avatar);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Inserisci un nome utente valido!');
      return;
    }
    if (!roomCode.trim()) {
      setError('Inserisci un codice stanza per entrare!');
      return;
    }
    setError('');
    onJoinRoom(roomCode.trim().toUpperCase(), username.trim(), avatar);
  };

  // FUNZIONI DI NAVIGAZIONE E ACQUISTO CUSTOMIZER
  const getNextItem = (list: any[], currentId: string, direction: 'next' | 'prev') => {
    const currentIndex = list.findIndex(item => (typeof item === 'string' ? item === currentId : item.id === currentId));
    if (currentIndex === -1) return typeof list[0] === 'string' ? list[0] : list[0].id;
    
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= list.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = list.length - 1;

    return typeof list[nextIndex] === 'string' ? list[nextIndex] : list[nextIndex].id;
  };

  const handleCycleColor = (direction: 'next' | 'prev') => {
    const colorsList = BODY_COLORS.map(c => c.value);
    const nextColor = getNextItem(colorsList, avatar.bodyColor, direction);
    setAvatar(prev => ({ ...prev, bodyColor: nextColor }));
  };

  const handleCycleEyes = (direction: 'next' | 'prev') => {
    const nextEyes = getNextItem(AVAILABLE_EYES, avatar.eyes, direction);
    setAvatar(prev => ({ ...prev, eyes: nextEyes }));
  };

  const handleCycleMouth = (direction: 'next' | 'prev') => {
    const nextMouth = getNextItem(AVAILABLE_MOUTHS, avatar.mouth, direction);
    setAvatar(prev => ({ ...prev, mouth: nextMouth }));
  };

  const handleCycleHat = (direction: 'next' | 'prev') => {
    const nextHat = getNextItem(AVAILABLE_HATS, avatar.hat, direction);
    setAvatar(prev => ({ ...prev, hat: nextHat }));
  };

  const handleCycleGlasses = (direction: 'next' | 'prev') => {
    const nextGlasses = getNextItem(AVAILABLE_GLASSES, avatar.glasses, direction);
    setAvatar(prev => ({ ...prev, glasses: nextGlasses }));
  };

  const handleCycleAura = (direction: 'next' | 'prev') => {
    const nextAura = getNextItem(AVAILABLE_AURAS, avatar.aura, direction);
    setAvatar(prev => ({ ...prev, aura: nextAura }));
  };

  const handleCycleOutfit = (direction: 'next' | 'prev') => {
    const nextOutfit = getNextItem(AVAILABLE_OUTFITS, avatar.outfit, direction);
    setAvatar(prev => ({ ...prev, outfit: nextOutfit }));
  };

  // Controllo stato sbloccato
  const isItemUnlocked = (id: string) => {
    return unlockedItems.includes(id) || id === 'none';
  };

  // Trova costo dell'elemento attualmente selezionato
  const getSelectedCategoryItem = (category: 'hat' | 'glasses' | 'aura' | 'outfit') => {
    if (category === 'hat') {
      return AVAILABLE_HATS.find(h => h.id === avatar.hat)!;
    }
    if (category === 'glasses') {
      return AVAILABLE_GLASSES.find(g => g.id === avatar.glasses)!;
    }
    if (category === 'aura') {
      return AVAILABLE_AURAS.find(a => a.id === avatar.aura)!;
    }
    return AVAILABLE_OUTFITS.find(o => o.id === avatar.outfit)!;
  };

  const handlePurchase = (category: 'hat' | 'glasses' | 'aura' | 'outfit') => {
    const selectedItem = getSelectedCategoryItem(category);
    if (isItemUnlocked(selectedItem.id)) return;

    if (coins >= selectedItem.cost) {
      const nextCoins = coins - selectedItem.cost;
      const nextUnlocked = [...unlockedItems, selectedItem.id];
      
      setCoins(nextCoins);
      setUnlockedItems(nextUnlocked);
      
      localStorage.setItem('m4nu_coins', nextCoins.toString());
      localStorage.setItem('m4nu_unlocked_cosmetics', JSON.stringify(nextUnlocked));
      
      soundManager.playCorrectGuess(); // Suono di sblocco festivo!
    } else {
      setError(`Monete insufficienti! Ti servono ancora ${selectedItem.cost - coins} M4C per sbloccare questo elemento.`);
      setTimeout(() => setError(''), 4000);
    }
  };

  // Categorie correnti per determinare se serve il bottone "Sblocca"
  const currentHat = getSelectedCategoryItem('hat');
  const currentGlasses = getSelectedCategoryItem('glasses');
  const currentAura = getSelectedCategoryItem('aura');
  const currentOutfit = getSelectedCategoryItem('outfit');

  const needsPurchase = 
    (!isItemUnlocked(avatar.hat)) || 
    (!isItemUnlocked(avatar.glasses)) || 
    (!isItemUnlocked(avatar.aura)) ||
    (!isItemUnlocked(avatar.outfit));

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blobs for premium glassmorphism effect */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full filter blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full filter blur-[100px] animate-pulse delay-700"></div>

      {/* Floating Header Audio controls */}
      <button
        onClick={handleToggleSound}
        className="absolute top-6 right-6 p-3 rounded-full backdrop-blur-md bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 shadow-xl active:scale-95 transition-all duration-200 z-50 cursor-pointer"
        title={soundEnabled ? 'Disattiva Audio' : 'Attiva Audio'}
      >
        {soundEnabled ? <Volume2 size={20} className="text-blue-400" /> : <VolumeX size={20} className="text-slate-500" />}
      </button>

      {/* DUAL COLUMN PREMIUM LAYOUT */}
      <div className="relative w-full max-w-4xl flex flex-col md:flex-row gap-8 items-stretch z-10 animate-[fadeIn_0.5s_ease-out]">
        
        {/* COLONNA SINISTRA: LOBBY ENTRY FORM */}
        <div className="flex-1 backdrop-blur-xl bg-slate-900/65 border border-slate-850 shadow-2xl rounded-3xl p-8 flex flex-col items-center justify-between">
          <div className="w-full">
            {/* Brand Logo Icon */}
            <div className="mb-4 flex justify-center hover:scale-105 transition-transform duration-300 cursor-default select-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-20 h-20 drop-shadow-[0_0_15px_rgba(139,92,246,0.35)]">
                <defs>
                  <linearGradient id="logoMGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                  <linearGradient id="logoPencilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f43f5e" />
                  </linearGradient>
                  <linearGradient id="logoEraserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f472b6" />
                    <stop offset="100%" stopColor="#fb7185" />
                  </linearGradient>
                  <filter id="logoNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <path d="M 256,50 L 259,65 L 274,68 L 259,71 L 256,86 L 253,71 L 238,68 L 253,65 Z" fill="#facc15" filter="url(#logoNeonGlow)" />
                <path d="M 70,260 L 72,270 L 82,273 L 72,276 L 70,286 L 68,276 L 58,273 L 68,270 Z" fill="#38bdf8" filter="url(#logoNeonGlow)" />
                
                <g filter="url(#logoNeonGlow)">
                  <rect x="110" y="140" width="48" height="230" rx="24" fill="url(#logoMGrad)" />
                  <path d="M 134,164 L 256,286 L 378,164" fill="none" stroke="url(#logoMGrad)" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                <g>
                  <path d="M 354,140 C 354,116 402,116 402,140 Z" fill="url(#logoEraserGrad)" stroke="#1e293b" strokeWidth="11" strokeLinejoin="round" />
                  <rect x="354" y="140" width="48" height="24" fill="#e2e8f0" stroke="#1e293b" strokeWidth="11" />
                  <rect x="354" y="164" width="48" height="140" rx="6" fill="url(#logoPencilGrad)" stroke="#1e293b" strokeWidth="11" />
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

            {/* Logo Text */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                M4nuDraw
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-widest">Multiplayer Drawing Game</p>
            </div>

            {/* Form Input Fields */}
            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                  Nome Utente
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    maxLength={15}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Inserisci il tuo nome..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 transition-all duration-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 space-y-3.5">
                <button
                  onClick={handleCreateRoom}
                  disabled={needsPurchase}
                  className={`w-full group relative flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold shadow-lg shadow-blue-900/10 active:scale-[0.98] transition-all duration-150 cursor-pointer ${needsPurchase ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Plus size={16} className="transition-transform group-hover:rotate-90 duration-300" />
                  Crea Nuova Stanza
                </button>

                <div className="relative flex py-1.5 items-center">
                  <div className="flex-grow border-t border-slate-850"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-slate-555 font-bold uppercase tracking-widest">Oppure</span>
                  <div className="flex-grow border-t border-slate-850"></div>
                </div>

                <form onSubmit={handleJoinRoom} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">
                      Codice Stanza
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                        <Hash size={16} />
                      </span>
                      <input
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value)}
                        placeholder="Esempio: M4D-XXXXXX"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/80 uppercase transition-all duration-200 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={needsPurchase}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-650 rounded-xl font-bold active:scale-[0.98] transition-all duration-150 cursor-pointer ${needsPurchase ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Play size={14} />
                    Entra in Stanza
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Animated Error Banner */}
          {error && (
            <div className="w-full mt-4 flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl animate-shake">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* COLONNA DESTRA: M4NUSTORE & CUSTOMIZER CARD */}
        <div className="flex-1 backdrop-blur-xl bg-slate-900/65 border border-slate-850 shadow-2xl rounded-3xl p-6 flex flex-col items-center">
          
          {/* Valuta a specchio dorato in alto */}
          <div className="w-full flex items-center justify-between bg-slate-950/70 border border-slate-850 px-4 py-2.5 rounded-2xl mb-4">
            <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Il Tuo Saldo M4C:</span>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-3 py-1 rounded-xl border border-yellow-500/20">
              <span className="text-yellow-400 font-bold text-sm animate-bounce">🪙</span>
              <span className="text-yellow-300 font-black text-sm font-mono tracking-wide">{coins} M4C</span>
            </div>
          </div>

          {/* Modular Avatar Preview */}
          <div className="relative group p-4 bg-slate-950/80 border border-slate-850 rounded-2xl w-40 h-40 flex items-center justify-center mb-4 overflow-visible">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
            <ModularAvatar avatar={avatar} size={110} animate={true} />
          </div>

          {/* Selettori ed acquisto */}
          <div className="w-full space-y-2.5 flex-grow overflow-y-auto max-h-[260px] pr-1.5 scrollbar-thin">
            
            {/* 1. Pelle Color */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/45 border border-slate-850/50 p-2 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider pl-1 text-[10px]">Colore Corpo</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCycleColor('prev')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronLeft size={16} /></button>
                <span className="w-16 text-center font-bold text-slate-200 text-[10px] truncate">{BODY_COLORS.find(c => c.value === avatar.bodyColor)?.name || 'Custom'}</span>
                <button onClick={() => handleCycleColor('next')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* 2. Occhi Style */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/45 border border-slate-850/50 p-2 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider pl-1 text-[10px]">Espressione Occhi</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCycleEyes('prev')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronLeft size={16} /></button>
                <span className="w-16 text-center font-bold text-slate-200 text-[10px] uppercase tracking-wider">{avatar.eyes}</span>
                <button onClick={() => handleCycleEyes('next')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* 3. Bocca Style */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/45 border border-slate-850/50 p-2 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider pl-1 text-[10px]">Bocca / Viso</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCycleMouth('prev')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronLeft size={16} /></button>
                <span className="w-16 text-center font-bold text-slate-200 text-[10px] uppercase tracking-wider">{avatar.mouth}</span>
                <button onClick={() => handleCycleMouth('next')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* 4. Cappello (Sbloccabile) */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/45 border border-slate-850/50 p-2 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider pl-1 text-[10px]">Copricapo</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCycleHat('prev')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronLeft size={16} /></button>
                <span className="w-24 text-center font-bold text-slate-200 text-[10px] truncate">{currentHat.name}</span>
                <button onClick={() => handleCycleHat('next')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* 5. Occhiali (Sbloccabile) */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/45 border border-slate-850/50 p-2 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider pl-1 text-[10px]">Occhiali</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCycleGlasses('prev')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronLeft size={16} /></button>
                <span className="w-24 text-center font-bold text-slate-200 text-[10px] truncate">{currentGlasses.name}</span>
                <button onClick={() => handleCycleGlasses('next')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronRight size={16} /></button>
              </div>
            </div>
            {/* 6. Aura (Sbloccabile) */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/45 border border-slate-850/50 p-2 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider pl-1 text-[10px]">Effetto Aura</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCycleAura('prev')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronLeft size={16} /></button>
                <span className="w-24 text-center font-bold text-slate-200 text-[10px] truncate">{currentAura.name}</span>
                <button onClick={() => handleCycleAura('next')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronRight size={16} /></button>
              </div>
            </div>

            {/* 7. Vestito (Sbloccabile) */}
            <div className="flex items-center justify-between gap-2 bg-slate-950/45 border border-slate-850/50 p-2 rounded-xl text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider pl-1 text-[10px]">Abbigliamento</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleCycleOutfit('prev')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronLeft size={16} /></button>
                <span className="w-24 text-center font-bold text-slate-200 text-[10px] truncate">{currentOutfit.name}</span>
                <button onClick={() => handleCycleOutfit('next')} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 active:scale-90"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>

          {/* BOTTONE DI ACQUISTO CON COINS (Se elemento selezionato è bloccato) */}
          {needsPurchase && (
            <div className="w-full mt-4 flex flex-col gap-2">
              {!isItemUnlocked(avatar.hat) && (
                <button
                  onClick={() => handlePurchase('hat')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-450 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-yellow-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Lock size={12} />
                  Sblocca {currentHat.name} per {currentHat.cost} M4C
                </button>
              )}
              {!isItemUnlocked(avatar.glasses) && (
                <button
                  onClick={() => handlePurchase('glasses')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-450 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-yellow-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Lock size={12} />
                  Sblocca {currentGlasses.name} per {currentGlasses.cost} M4C
                </button>
              )}
              {!isItemUnlocked(avatar.aura) && (
                <button
                  onClick={() => handlePurchase('aura')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-450 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-yellow-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Lock size={12} />
                  Sblocca {currentAura.name} per {currentAura.cost} M4C
                </button>
              )}
              {!isItemUnlocked(avatar.outfit) && (
                <button
                  onClick={() => handlePurchase('outfit')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-450 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-yellow-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  <Lock size={12} />
                  Sblocca {currentOutfit.name} per {currentOutfit.cost} M4C
                </button>
              )}
            </div>
          )}

          {/* Badge di approvazione se l'avatar è totalmente sbloccato */}
          {!needsPurchase && (
            <div className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold animate-[fadeIn_0.3s]">
              <Check size={14} />
              Avatar Sbloccato ed Equipaggiato!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
