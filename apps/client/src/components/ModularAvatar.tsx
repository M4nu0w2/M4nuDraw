import React from 'react';
import { AvatarConfig } from '@skribbl/shared';

interface ModularAvatarProps {
  avatar?: AvatarConfig;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  bodyColor: '#6366f1', // Indigo
  eyes: 'normal',
  mouth: 'smile',
  hat: 'none',
  glasses: 'none',
  aura: 'none',
  outfit: 'none'
};

export const BODY_COLORS = [
  { name: 'Indaco', value: '#6366f1' },
  { name: 'Smeraldo', value: '#10b981' },
  { name: 'Roseo', value: '#f43f5e' },
  { name: 'Ambra', value: '#f59e0b' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Viola Neon', value: '#d946ef' },
  { name: 'Zaffiro', value: '#3b82f6' }
];

export const AVAILABLE_EYES = ['normal', 'wink', 'happy', 'cute', 'angry'];
export const AVAILABLE_MOUTHS = ['smile', 'tongue', 'mustache', 'bubblegum', 'surprised'];

export const AVAILABLE_HATS = [
  { id: 'none', name: 'Nessuno', cost: 0 },
  { id: 'beanie', name: 'Berretto Neon', cost: 100 },
  { id: 'pirate', name: 'Tricorno Pirata', cost: 250 },
  { id: 'chef', name: 'Cappello Chef', cost: 400 },
  { id: 'crown', name: 'Corona Regale', cost: 600 }
];

export const AVAILABLE_GLASSES = [
  { id: 'none', name: 'Nessuno', cost: 0 },
  { id: 'pixel', name: 'Occhiali Thug', cost: 150 },
  { id: 'vr', name: 'Visore Cyber', cost: 300 },
  { id: 'monocle', name: 'Monocolo Oro', cost: 450 }
];

export const AVAILABLE_AURAS = [
  { id: 'none', name: 'Nessuno', cost: 0 },
  { id: 'neon', name: 'Aura Neon', cost: 350 },
  { id: 'gold', name: 'Aureola Oro', cost: 700 },
  { id: 'fire', name: 'Aura di Fuoco', cost: 1000 }
];

export const AVAILABLE_OUTFITS = [
  { id: 'none', name: 'Spalle Scoperte', cost: 0 },
  { id: 'retro', name: 'T-Shirt Neon', cost: 200 },
  { id: 'suit', name: 'Smoking Elegante', cost: 400 },
  { id: 'pirate', name: 'Gabbana Pirata', cost: 600 },
  { id: 'space', name: 'Tuta Spaziale', cost: 800 }
];

export const ModularAvatar: React.FC<ModularAvatarProps> = ({
  avatar = DEFAULT_AVATAR,
  size = 64,
  className = '',
  animate = true
}) => {
  const { bodyColor, eyes, mouth, hat, glasses, aura, outfit = 'none' } = avatar;

  // Render dell'Aura (sfondo retrostante)
  const renderAura = () => {
    if (aura === 'none') return null;

    if (aura === 'neon') {
      return (
        <g className={animate ? 'animate-[spin_8s_linear_infinite]' : ''}>
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#auraNeonGrad)" strokeWidth="6" strokeDasharray="15 8" opacity="0.85" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#auraNeonGrad2)" strokeWidth="3" opacity="0.5" />
        </g>
      );
    }

    if (aura === 'gold') {
      return (
        <g>
          {/* Aureola dorata oscillante */}
          <ellipse
            cx="50"
            cy="10"
            rx="20"
            ry="6"
            fill="none"
            stroke="url(#auraGoldGrad)"
            strokeWidth="3.5"
            className={animate ? 'animate-[float_2.5s_easeInOut_infinite]' : ''}
            filter="url(#glowGold)"
          />
          {/* Stelline luminose */}
          <path d="M 25,25 L 27,27 L 25,29 L 23,27 Z" fill="#fef08a" opacity="0.8" className={animate ? 'animate-pulse' : ''} />
          <path d="M 75,22 L 77,24 L 75,26 L 73,24 Z" fill="#fef08a" opacity="0.8" className={animate ? 'animate-pulse' : ''} />
          <path d="M 18,60 L 20,62 L 18,64 L 16,62 Z" fill="#fef08a" opacity="0.6" className={animate ? 'animate-pulse' : ''} />
        </g>
      );
    }

    if (aura === 'fire') {
      return (
        <g className={animate ? 'animate-[pulse_1.5s_ease-in-out_infinite]' : ''} filter="url(#glowFire)">
          {/* Fiamme stilizzate rosa e arancio dietro */}
          <path
            d="M 12,85 C 5,75 5,45 22,30 C 15,45 20,55 25,60 C 20,40 32,20 45,8 C 42,32 50,45 55,52 C 55,25 68,15 78,12 C 72,35 78,50 84,58 C 88,40 95,50 88,85 Z"
            fill="url(#auraFireGrad)"
            opacity="0.45"
          />
          <path
            d="M 18,85 C 12,77 15,55 28,42 C 22,55 28,62 32,66 C 28,52 38,32 48,22 C 46,40 52,50 56,56 C 58,35 68,28 75,25 C 70,42 74,54 78,60 C 82,48 87,56 82,85 Z"
            fill="url(#auraFireGrad2)"
            opacity="0.65"
          />
        </g>
      );
    }

    return null;
  };

  // Render dei Vestiti / Outfit (torso)
  const renderOutfit = () => {
    switch (outfit) {
      case 'retro':
        return (
          <g>
            <path d="M 20,95 C 20,70 32,64 50,64 C 68,64 80,70 80,95 Z" fill="#ec4899" stroke="#1e293b" strokeWidth="4.5" />
            <path d="M 24,84 Q 50,78 76,84" stroke="#06b6d4" strokeWidth="6" fill="none" />
            <path d="M 38,65 Q 50,74 62,65" fill="none" stroke="#1e293b" strokeWidth="4.5" />
          </g>
        );
      case 'suit':
        return (
          <g>
            {/* Giacca dello smoking */}
            <path d="M 20,95 C 20,70 32,64 50,64 C 68,64 80,70 80,95 Z" fill="#1e293b" stroke="#1e293b" strokeWidth="4.5" />
            {/* Camicia a V bianca */}
            <path d="M 38,64 L 50,82 L 62,64 Z" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
            {/* Papillon rosso */}
            <path d="M 44,71 L 56,71 L 50,76 Z" fill="#ef4444" />
            <circle cx="50" cy="71" r="2.5" fill="#ef4444" />
            <path d="M 44,71 L 50,66 L 50,71 Z" fill="#ef4444" />
            <path d="M 56,71 L 50,66 L 50,71 Z" fill="#ef4444" />
          </g>
        );
      case 'pirate':
        return (
          <g>
            {/* Giubba pirata rossa */}
            <path d="M 20,95 C 20,70 32,64 50,64 C 68,64 80,70 80,95 Z" fill="#b91c1c" stroke="#1e293b" strokeWidth="4.5" />
            {/* Fazzoletto/Colletto bianco */}
            <path d="M 34,64 Q 50,78 66,64" fill="#ffffff" stroke="#1e293b" strokeWidth="3" />
            {/* Bottoncini dorati */}
            <circle cx="44" cy="80" r="2.5" fill="#facc15" stroke="#1e293b" strokeWidth="1" />
            <circle cx="56" cy="80" r="2.5" fill="#facc15" stroke="#1e293b" strokeWidth="1" />
          </g>
        );
      case 'space':
        return (
          <g>
            {/* Tuta astronautica bianca */}
            <path d="M 20,95 C 20,70 32,64 50,64 C 68,64 80,70 80,95 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="4.5" />
            {/* Dettagli spalline azzurro neon */}
            <path d="M 22,80 Q 32,70 35,64" stroke="#38bdf8" strokeWidth="4.5" fill="none" />
            <path d="M 78,80 Q 68,70 65,64" stroke="#38bdf8" strokeWidth="4.5" fill="none" />
            {/* Logo/Badge rotondo spaziale sul petto */}
            <circle cx="50" cy="78" r="5" fill="#3b82f6" stroke="#1e293b" strokeWidth="1.5" />
            <circle cx="48" cy="76.5" r="1.5" fill="#ffffff" />
          </g>
        );
      case 'none':
      default:
        // Spalle scoperte coordinate con la tonalità della pelle
        return (
          <path d="M 20,95 C 20,70 32,64 50,64 C 68,64 80,70 80,95 Z" fill="url(#bodyGrad)" stroke="#1e293b" strokeWidth="4.5" />
        );
    }
  };

  // Render dei Gestures/Occhi
  const renderEyes = () => {
    switch (eyes) {
      case 'wink':
        return (
          <g stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none">
            {/* Occhio sinistro aperto */}
            <circle cx="38" cy="46" r="1" fill="#1e293b" />
            {/* Occhio destro ammiccante */}
            <path d="M 56,46 Q 62,41 64,46" />
          </g>
        );
      case 'happy':
        return (
          <g stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none">
            <path d="M 32,48 Q 38,41 44,48" />
            <path d="M 56,48 Q 62,41 68,48" />
          </g>
        );
      case 'cute':
        return (
          <g fill="#1e293b">
            <circle cx="38" cy="46" r="5.5" />
            <circle cx="62" cy="46" r="5.5" />
            {/* Riflessi bianchi kawaii */}
            <circle cx="36.5" cy="44.5" r="2" fill="#ffffff" />
            <circle cx="60.5" cy="44.5" r="2" fill="#ffffff" />
            <circle cx="39.5" cy="47.5" r="0.8" fill="#ffffff" />
            <circle cx="63.5" cy="47.5" r="0.8" fill="#ffffff" />
          </g>
        );
      case 'angry':
        return (
          <g>
            <g stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none">
              <circle cx="38" cy="47" r="1.5" fill="#1e293b" />
              <circle cx="62" cy="47" r="1.5" fill="#1e293b" />
              {/* Sopracciglia arrabbiate */}
              <path d="M 30,37 L 44,43" />
              <path d="M 70,37 L 56,43" />
            </g>
          </g>
        );
      case 'normal':
      default:
        return (
          <g fill="#1e293b">
            <circle cx="38" cy="46" r="4.5" />
            <circle cx="62" cy="46" r="4.5" />
            {/* Riflesso occhi standard */}
            <circle cx="36.5" cy="44.5" r="1.5" fill="#ffffff" />
            <circle cx="60.5" cy="44.5" r="1.5" fill="#ffffff" />
          </g>
        );
    }
  };

  // Render della Bocca
  const renderMouth = () => {
    switch (mouth) {
      case 'tongue':
        return (
          <g>
            {/* Bocca aperta */}
            <path d="M 42,58 Q 50,56 58,58" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Lingua rosa sporgente */}
            <path d="M 46,58 C 46,67 54,67 54,58 Z" fill="#fb7185" stroke="#1e293b" strokeWidth="3" />
          </g>
        );
      case 'mustache':
        return (
          <g fill="#1e293b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round">
            {/* Baffi gentleman */}
            <path d="M 50,56 C 45,52 36,54 36,58 C 36,60 42,60 48,57 C 49,57 51,57 52,57 C 58,60 64,60 64,58 C 64,54 55,52 50,56 Z" />
            <path d="M 44,61 Q 50,65 56,61" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        );
      case 'bubblegum':
        return (
          <g>
            <path d="M 44,59 Q 50,57 56,59" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Bolla chewing gum rosa neon */}
            <circle
              cx="55"
              cy="62"
              r="7"
              fill="url(#gumGrad)"
              stroke="#e21c83"
              strokeWidth="1.5"
              className={animate ? 'animate-[pulse_1.2s_easeInOut_infinite]' : ''}
            />
            <circle cx="53" cy="60" r="2.5" fill="#ffffff" opacity="0.6" />
          </g>
        );
      case 'surprised':
        return (
          <circle cx="50" cy="60" r="5" fill="#1e293b" />
        );
      case 'smile':
      default:
        return (
          <path d="M 40,56 C 42,65 58,65 60,56" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        );
    }
  };

  // Render degli Occhiali
  const renderGlasses = () => {
    if (glasses === 'none') return null;

    if (glasses === 'pixel') {
      return (
        <g fill="#111827" stroke="#111827" strokeWidth="1">
          {/* Lente Sinistra Pixel */}
          <rect x="26" y="38" width="16" height="12" rx="1" />
          {/* Lente Destra Pixel */}
          <rect x="58" y="38" width="16" height="12" rx="1" />
          {/* Ponte e Stanghette */}
          <rect x="42" y="41" width="16" height="4" />
          <rect x="16" y="41" width="10" height="3" />
          <rect x="74" y="41" width="10" height="3" />
          {/* Riflessi bianchi pixelati */}
          <rect x="28" y="40" width="4" height="3" fill="#ffffff" />
          <rect x="60" y="40" width="4" height="3" fill="#ffffff" />
        </g>
      );
    }

    if (glasses === 'vr') {
      return (
        <g className={animate ? 'animate-[float_3s_easeInOut_infinite]' : ''}>
          {/* Visore Cyber con gradiente neon */}
          <path d="M 22,36 L 78,36 C 82,36 84,39 84,43 L 80,53 C 79,56 76,58 72,58 L 28,58 C 24,58 21,56 20,53 L 16,43 C 16,39 18,36 22,36 Z" fill="url(#vrGrad)" stroke="#06b6d4" strokeWidth="2.5" />
          {/* Striscia LED interna pulsante */}
          <path d="M 26,47 L 74,47" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.9" className={animate ? 'animate-pulse' : ''} filter="url(#glowCyan)" />
        </g>
      );
    }

    if (glasses === 'monocle') {
      return (
        <g>
          {/* Lente destra con montatura oro */}
          <circle cx="62" cy="46" r="10" fill="none" stroke="url(#goldMetal)" strokeWidth="3" filter="url(#glowGold)" />
          {/* Catena pendente d'oro */}
          <path d="M 72,46 Q 80,54 75,70" fill="none" stroke="url(#goldMetal)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
        </g>
      );
    }

    return null;
  };

  // Render del Cappello
  const renderHat = () => {
    if (hat === 'none') return null;

    if (hat === 'beanie') {
      return (
        <g>
          {/* Berretto in maglia neon rosa/viola */}
          <path d="M 26,32 C 26,12 74,12 74,32 Z" fill="url(#beanieGrad)" stroke="#db2777" strokeWidth="2" />
          <rect x="22" y="27" width="56" height="8" rx="4" fill="#ec4899" stroke="#db2777" strokeWidth="1.5" />
          {/* Pon-pon */}
          <circle cx="50" cy="10" r="5" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" />
        </g>
      );
    }

    if (hat === 'pirate') {
      return (
        <g>
          {/* Cappello da pirata nero */}
          <path d="M 12,28 C 30,12 70,12 88,28 C 76,28 72,20 50,22 C 28,20 24,28 12,28 Z" fill="#1f2937" stroke="#111827" strokeWidth="2" />
          <path d="M 40,23 C 45,21 55,21 60,23 L 50,30 Z" fill="#9ca3af" />
          {/* Teschio dei pirati */}
          <circle cx="50" cy="20" r="3.5" fill="#ffffff" />
          <rect x="48.5" y="22.5" width="3" height="3" fill="#ffffff" />
          <circle cx="49" cy="19.5" r="0.8" fill="#111827" />
          <circle cx="51" cy="19.5" r="0.8" fill="#111827" />
        </g>
      );
    }

    if (hat === 'chef') {
      return (
        <g>
          {/* Cappello da Chef bianco */}
          <path d="M 32,25 C 22,25 22,8 35,8 C 35,4 45,4 50,8 C 55,4 65,4 65,8 C 78,8 78,25 68,25 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" />
          <rect x="30" y="22" width="40" height="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2.5" />
        </g>
      );
    }

    if (hat === 'crown') {
      return (
        <g className={animate ? 'animate-[float_2s_easeInOut_infinite]' : ''}>
          {/* Corona d'oro con gemme rosse e azzurre */}
          <path d="M 28,24 L 32,10 L 41,17 L 50,6 L 59,17 L 68,10 L 72,24 Z" fill="url(#goldMetal)" stroke="#b45309" strokeWidth="2.5" filter="url(#glowGold)" />
          <rect x="26" y="22" width="48" height="5" rx="1.5" fill="#d97706" />
          {/* Gemme incastonate */}
          <circle cx="34" cy="20" r="2" fill="#ef4444" />
          <circle cx="50" cy="20" r="2" fill="#06b6d4" />
          <circle cx="66" cy="20" r="2" fill="#ef4444" />
          {/* Gemme sulle punte */}
          <circle cx="32" cy="9" r="1.8" fill="#facc15" />
          <circle cx="50" cy="5" r="1.8" fill="#ef4444" />
          <circle cx="68" cy="9" r="1.8" fill="#facc15" />
        </g>
      );
    }

    return null;
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        {/* DEFINIZIONI GRADIENTI E FILTRI */}
        <defs>
          {/* Gradienti */}
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bodyColor} />
            <stop offset="100%" stopColor={darkenColor(bodyColor, 35)} />
          </linearGradient>
          <linearGradient id="auraNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="auraNeonGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="auraGoldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="auraFireGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="auraFireGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="80%" stopColor="#ef4444" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>
          <linearGradient id="vrGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="beanieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#be185d" />
          </linearGradient>
          <linearGradient id="goldMetal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Filtri Glow */}
          <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowFire" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. LAYER AURA (Sfondo) */}
        {renderAura()}

        {/* 2. LAYER VESTITO / TORSO */}
        {renderOutfit()}

        {/* 3. LAYER TESTA BASE */}
        <g>
          {/* Sfumatura 3D della testa rotonda shifted up */}
          <circle cx="50" cy="46" r="26" fill="url(#bodyGrad)" stroke="#1e293b" strokeWidth="4.5" />
          {/* Effetto guance arrossate kawaii */}
          <circle cx="34" cy="48" r="3" fill="#f43f5e" opacity="0.45" />
          <circle cx="66" cy="48" r="3" fill="#f43f5e" opacity="0.45" />
        </g>

        {/* 4. LAYER OCCHI */}
        {renderEyes()}

        {/* 5. LAYER BOCCA */}
        {renderMouth()}

        {/* 6. LAYER OCCHIALI */}
        {renderGlasses()}

        {/* 7. LAYER CAPPELLO */}
        {renderHat()}
      </svg>
    </div>
  );
};

// Funzione helper per scurire i colori HEX ed ottenere gradienti tridimensionali
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) - amt,
    G = ((num >> 8) & 0x00ff) - amt,
    B = (num & 0x0000ff) - amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 0 ? 0 : R > 255 ? 255 : R) * 0x10000 +
      (G < 0 ? 0 : G > 255 ? 255 : G) * 0x100 +
      (B < 0 ? 0 : B > 255 ? 255 : B)
    )
      .toString(16)
      .slice(1)
  );
}
