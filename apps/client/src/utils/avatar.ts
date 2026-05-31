/**
 * Genera un avatar animato SVG personalizzato e deterministico a partire da un nome utente.
 * Mantiene anche un gradiente e iniziali di fallback per retrocompatibilità.
 */
export function getAvatarStyles(username: string): { gradient: string; initials: string; svgHtml: string } {
  const name = username.trim() || 'Guest';
  
  // Hash del nome
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const absHash = Math.abs(hash);
  
  // Colori vibranti adatti a un design scuro e premium
  const presets = [
    { from: 'from-pink-500', to: 'to-rose-600', text: 'text-white', hexFrom: '#EC4899', hexTo: '#E11D48' },
    { from: 'from-purple-600', to: 'to-indigo-600', text: 'text-white', hexFrom: '#7C3AED', hexTo: '#4F46E5' },
    { from: 'from-blue-500', to: 'to-cyan-500', text: 'text-white', hexFrom: '#3B82F6', hexTo: '#06B6D4' },
    { from: 'from-teal-400', to: 'to-emerald-600', text: 'text-white', hexFrom: '#2DD4BF', hexTo: '#059669' },
    { from: 'from-orange-400', to: 'to-red-500', text: 'text-white', hexFrom: '#FB923C', hexTo: '#EF4444' },
    { from: 'from-amber-400', to: 'to-orange-600', text: 'text-white', hexFrom: '#F59E0B', hexTo: '#D97706' },
    { from: 'from-violet-500', to: 'to-fuchsia-600', text: 'text-white', hexFrom: '#8B5CF6', hexTo: '#D946EF' },
    { from: 'from-cyan-400', to: 'to-blue-600', text: 'text-white', hexFrom: '#22D3EE', hexTo: '#2563EB' },
  ];
  
  const index = absHash % presets.length;
  const preset = presets[index];
  
  // Prendi le prime due lettere
  const initials = name.slice(0, 2).toUpperCase();

  // --- GENERAZIONE AVATAR ANIMATO IN SVG ---
  
  // Cute body shapes
  const bodyShapes = [
    'M 30,70 C 30,45 40,30 50,30 C 60,30 70,45 70,70 C 70,72 30,72 30,70 Z', // Jellybean / gumdrop
    'M 25,65 C 25,40 35,25 50,25 C 65,25 75,40 75,65 C 75,75 25,75 25,65 Z', // Round body
    'M 30,75 C 25,75 25,35 25,35 C 25,35 25,25 50,25 C 75,25 75,35 75,35 C 75,35 75,75 70,75 Z', // Rounded Boxy body
    'M 50,20 C 65,35 75,55 70,70 C 65,80 35,80 30,70 C 25,55 35,35 50,20 Z', // Cute drop
  ];
  
  const bodyShape = bodyShapes[absHash % bodyShapes.length];
  
  // Colori del corpo pastello e simpatici
  const bodyColors = [
    '#FFE4E6', // rose-100
    '#E0F2FE', // sky-100
    '#F3E8FF', // purple-100
    '#DCFCE7', // green-100
    '#FEF9C3', // yellow-100
    '#FFEDD5', // orange-100
    '#F1F5F9', // slate-100
  ];
  const bodyColor = bodyColors[(absHash >> 2) % bodyColors.length];
  
  const eyeColor = '#1E293B'; // slate-800
  
  // Animazione sbattito di ciglia (blink)
  const blinkAnim = `
    @keyframes blink {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }
    .eyes-${absHash} {
      transform-origin: 50px 48px;
      animation: blink 4s infinite ease-in-out;
    }
  `;

  // Animazione oscillazione/respiro (bobbing)
  const bobAnim = `
    @keyframes bob {
      0%, 100% { transform: translateY(0px) scaleY(1); }
      50% { transform: translateY(-2px) scaleY(1.03); }
    }
    .avatar-body-${absHash} {
      transform-origin: 50px 75px;
      animation: bob 3s infinite ease-in-out;
    }
  `;
  
  // Stili occhi
  const eyeStyles = [
    // 0: Big cute anime eyes
    `<g class="eyes-${absHash}">
      <circle cx="43" cy="48" r="4.5" fill="${eyeColor}" />
      <circle cx="44.5" cy="46.5" r="1.5" fill="#FFFFFF" />
      <circle cx="57" cy="48" r="4.5" fill="${eyeColor}" />
      <circle cx="58.5" cy="46.5" r="1.5" fill="#FFFFFF" />
     </g>`,
    // 1: Happy curved smiling eyes
    `<g class="eyes-${absHash}">
      <path d="M 39,49 C 41,46 44,46 46,49" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M 54,49 C 56,46 59,46 61,49" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round" fill="none" />
     </g>`,
    // 2: Sleepy eyes
    `<g class="eyes-${absHash}">
      <line x1="39" y1="48" x2="46" y2="48" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round" />
      <line x1="54" y1="48" x2="61" y2="48" stroke="${eyeColor}" stroke-width="2.5" stroke-linecap="round" />
     </g>`,
    // 3: Cool sunglasses
    `<g>
      <path d="M 36,44 L 64,44 C 64,44 63,53 58,53 C 54,53 53,48 50,48 C 47,48 46,53 42,53 C 37,53 36,44 36,44 Z" fill="#000000" />
      <line x1="35" y1="46" x2="65" y2="46" stroke="#000000" stroke-width="2" />
      <path d="M 40,46 L 43,50" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" />
      <path d="M 57,46 L 60,50" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round" />
     </g>`,
    // 4: Round glasses
    `<g>
      <circle cx="42" cy="48" r="5" fill="none" stroke="${eyeColor}" stroke-width="2" />
      <circle cx="58" cy="48" r="5" fill="none" stroke="${eyeColor}" stroke-width="2" />
      <line x1="47" y1="48" x2="53" y2="48" stroke="${eyeColor}" stroke-width="2" />
      <line x1="34" y1="48" x2="37" y2="48" stroke="${eyeColor}" stroke-width="1.5" />
      <line x1="63" y1="48" x2="66" y2="48" stroke="${eyeColor}" stroke-width="1.5" />
      <g class="eyes-${absHash}">
        <circle cx="42" cy="48" r="2.2" fill="${eyeColor}" />
        <circle cx="58" cy="48" r="2.2" fill="${eyeColor}" />
      </g>
     </g>`
  ];
  
  const eyes = eyeStyles[(absHash >> 3) % eyeStyles.length];
  
  // Stili bocca
  const mouthStyles = [
    // 0: Happy curve
    `<path d="M 44,56 C 47,59 53,59 56,56" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round" fill="none" />`,
    // 1: Open surprised mouth
    `<circle cx="50" cy="58" r="3" fill="${eyeColor}" />`,
    // 2: Cute tongue out
    `<g>
      <path d="M 46,55 C 48,58 52,58 54,55" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round" fill="none" />
      <path d="M 48,56 C 48,60 52,60 52,56 Z" fill="#EF4444" />
     </g>`,
    // 3: Flat smirk
    `<path d="M 45,57 L 55,56" stroke="${eyeColor}" stroke-width="2" stroke-linecap="round" />`,
    // 4: Cat smile (w)
    `<path d="M 45,56 C 47,57 49,57 50,56 C 51,57 53,57 55,56" stroke="${eyeColor}" stroke-width="1.8" stroke-linecap="round" fill="none" />`
  ];
  const mouth = mouthStyles[(absHash >> 4) % mouthStyles.length];
  
  // Rossetto/guance rosse
  const showBlush = (absHash >> 5) % 2 === 0;
  const blush = showBlush 
    ? `<ellipse cx="36" cy="52" rx="3" ry="1.5" fill="#EF4444" opacity="0.35" />
       <ellipse cx="64" cy="52" rx="3" ry="1.5" fill="#EF4444" opacity="0.35" />`
    : '';

  // Accessori carini
  const accessoryStyles = [
    // 0: Niente
    '',
    // 1: Ciuffo di capelli
    `<path d="M 48,25 C 48,20 45,16 48,12 C 51,16 52,20 52,25 Z" fill="${bodyColor}" stroke="${eyeColor}" stroke-width="1.5" />`,
    // 2: Corona reale dorata
    `<path d="M 38,26 L 41,17 L 50,21 L 59,17 L 62,26 Z" fill="#F59E0B" stroke="#D97706" stroke-width="1.5" stroke-linejoin="round" />
     <circle cx="41" cy="17" r="1.2" fill="#EF4444" />
     <circle cx="50" cy="21" r="1.2" fill="#3B82F6" />
     <circle cx="59" cy="17" r="1.2" fill="#EF4444" />`,
    // 3: Papillon al collo
    `<g transform="translate(0, 4)">
      <polygon points="38,65 38,71 50,68" fill="#EC4899" stroke="#BE185D" stroke-width="1" />
      <polygon points="62,65 62,71 50,68" fill="#EC4899" stroke="#BE185D" stroke-width="1" />
      <circle cx="50" cy="68" r="2.5" fill="#FFFFFF" stroke="#BE185D" stroke-width="1" />
     </g>`,
    // 4: Cappellino da festa
    `<g transform="rotate(8, 50, 25)">
      <polygon points="38,25 50,5 62,25" fill="#6366F1" stroke="#4F46E5" stroke-width="1.5" />
      <circle cx="50" cy="5" r="2.5" fill="#F59E0B" />
      <path d="M 42,18 L 58,18" stroke="#F59E0B" stroke-width="1" />
     </g>`
  ];
  const accessory = accessoryStyles[(absHash >> 6) % accessoryStyles.length];

  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
      <defs>
        <linearGradient id="bgGrad-${absHash}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${preset.hexFrom}" />
          <stop offset="100%" stop-color="${preset.hexTo}" />
        </linearGradient>
        <style>
          ${blinkAnim}
          ${bobAnim}
        </style>
      </defs>
      <!-- Cerchio di Sfondo -->
      <circle cx="50" cy="50" r="48" fill="url(#bgGrad-${absHash})" />
      
      <!-- Personaggio in Oscillazione -->
      <g class="avatar-body-${absHash}">
        <!-- Forma principale del corpo -->
        <path d="${bodyShape}" fill="${bodyColor}" stroke="${eyeColor}" stroke-width="2.5" stroke-linejoin="round" />
        
        <!-- Guance rosse -->
        ${blush}
        
        <!-- Occhi -->
        ${eyes}
        
        <!-- Bocca -->
        ${mouth}
        
        <!-- Accessorio -->
        ${accessory}
      </g>
    </svg>
  `;

  return {
    gradient: `bg-gradient-to-tr ${preset.from} ${preset.to} ${preset.text}`,
    initials,
    svgHtml
  };
}
