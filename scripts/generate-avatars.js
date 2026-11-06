/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'public', 'avatars');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const pilots = [
  {
    name: 'marc',
    color: '#e2602c',
    glow: '#f28b44',
    bg1: '#24140e',
    bg2: '#0d0705',
    visorColor: '#f97316',
    visorReflect: '#fed7aa',
    suitColor: '#2b1d18',
    suitAccent: '#c2410c',
    hudText: 'SCOUT-01',
    symbol: 'M'
  },
  {
    name: 'bolt',
    color: '#eab308',
    glow: '#fde047',
    bg1: '#241f08',
    bg2: '#0b0903',
    visorColor: '#facc15',
    visorReflect: '#fef08a',
    suitColor: '#2b2614',
    suitAccent: '#ca8a04',
    hudText: 'DASH-317',
    symbol: 'B'
  },
  {
    name: 'nova',
    color: '#06b6d4',
    glow: '#38bdf8',
    bg1: '#091c26',
    bg2: '#030b0f',
    visorColor: '#0ea5e9',
    visorReflect: '#bae6fd',
    suitColor: '#13242e',
    suitAccent: '#0284c7',
    hudText: 'SAGAN-AI',
    symbol: 'N'
  },
  {
    name: 'elys',
    color: '#a855f7',
    glow: '#c084fc',
    bg1: '#210f30',
    bg2: '#09040e',
    visorColor: '#9333ea',
    visorReflect: '#e9d5ff',
    suitColor: '#281738',
    suitAccent: '#7e22ce',
    hudText: 'ELITE-VIP',
    symbol: 'E'
  },
  {
    name: 'kira',
    color: '#10b981',
    glow: '#34d399',
    bg1: '#0d2419',
    bg2: '#030d09',
    visorColor: '#059669',
    visorReflect: '#a7f3d0',
    suitColor: '#162e22',
    suitAccent: '#047857',
    hudText: 'FLORA-04',
    symbol: 'K'
  },
  {
    name: 'orion',
    color: '#3b82f6',
    glow: '#60a5fa',
    bg1: '#0d1b36',
    bg2: '#030814',
    visorColor: '#2563eb',
    visorReflect: '#bfdbfe',
    suitColor: '#172542',
    suitAccent: '#1d4ed8',
    hudText: 'PHOBOS-V',
    symbol: 'O'
  },
  {
    name: 'lyra',
    color: '#f43f5e',
    glow: '#fb7185',
    bg1: '#290f19',
    bg2: '#0d0407',
    visorColor: '#e11d48',
    visorReflect: '#fecdd3',
    suitColor: '#331622',
    suitAccent: '#be123c',
    hudText: 'GRAND-08',
    symbol: 'L'
  },
  {
    name: 'tarek',
    color: '#ea580c',
    glow: '#fb923c',
    bg1: '#2b170a',
    bg2: '#0d0603',
    visorColor: '#c2410c',
    visorReflect: '#ffedd5',
    suitColor: '#361f14',
    suitAccent: '#9a3412',
    hudText: 'CRATER-X',
    symbol: 'T'
  },
  {
    name: 'elena',
    color: '#38bdf8',
    glow: '#7dd3fc',
    bg1: '#0e202e',
    bg2: '#040b10',
    visorColor: '#0284c7',
    visorReflect: '#e0f2fe',
    suitColor: '#1a2e3d',
    suitAccent: '#0369a1',
    hudText: 'KOROLEV',
    symbol: 'EL'
  },
  {
    name: 'sora',
    color: '#f97316',
    glow: '#fdba74',
    bg1: '#2b190c',
    bg2: '#0d0703',
    visorColor: '#ea580c',
    visorReflect: '#ffedd5',
    suitColor: '#362214',
    suitAccent: '#c2410c',
    hudText: 'CANYON-9',
    symbol: 'S'
  },
  {
    name: 'solaris',
    color: '#eab308',
    glow: '#fef08a',
    bg1: '#29240a',
    bg2: '#0c0a03',
    visorColor: '#ca8a04',
    visorReflect: '#fef9c3',
    suitColor: '#363016',
    suitAccent: '#a16207',
    hudText: 'HELIOS-P',
    symbol: 'SO'
  },
  {
    name: 'echo',
    color: '#818cf8',
    glow: '#a5b4fc',
    bg1: '#161630',
    bg2: '#060612',
    visorColor: '#6366f1',
    visorReflect: '#e0e7ff',
    suitColor: '#202042',
    suitAccent: '#4f46e5',
    hudText: 'STEALTH',
    symbol: 'EC'
  }
];

pilots.forEach((p) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
  <defs>
    <radialGradient id="bg-${p.name}" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="${p.bg1}" />
      <stop offset="100%" stop-color="${p.bg2}" />
    </radialGradient>
    <linearGradient id="visor-${p.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${p.visorReflect}" stop-opacity="0.95" />
      <stop offset="35%" stop-color="${p.visorColor}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${p.suitAccent}" stop-opacity="1" />
    </linearGradient>
    <linearGradient id="suit-${p.name}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${p.suitColor}" />
      <stop offset="100%" stop-color="#0a0807" />
    </linearGradient>
    <filter id="glow-${p.name}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Fundo Cósmico Marciano -->
  <rect width="240" height="240" rx="36" fill="url(#bg-${p.name})" />
  
  <!-- Anel Orbital Externo de Telemetria -->
  <circle cx="120" cy="120" r="108" fill="none" stroke="${p.color}" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="4 8" />
  <circle cx="120" cy="120" r="114" fill="none" stroke="${p.glow}" stroke-opacity="0.2" stroke-width="1" />

  <!-- Traje Espacial / Ombros de Titânio -->
  <path d="M28,240 C35,185 75,166 120,166 C165,166 205,185 212,240 Z" fill="url(#suit-${p.name})" />
  <path d="M68,185 L120,195 L172,185 L177,240 L63,240 Z" fill="${p.suitColor}" opacity="0.75" />
  
  <!-- Gola Pressurizada com Anel de Bloqueio -->
  <ellipse cx="120" cy="166" rx="46" ry="16" fill="#171413" stroke="${p.color}" stroke-width="2" />
  
  <!-- Capacete Marciano Futurista -->
  <ellipse cx="120" cy="106" rx="60" ry="64" fill="#181514" stroke="${p.color}" stroke-width="2.5" />

  <!-- Viseira Holográfica de Alta Densidade -->
  <path d="M72,94 C72,66 92,58 120,58 C148,58 168,66 168,94 C168,122 148,138 120,138 C92,138 72,122 72,94 Z" 
        fill="url(#visor-${p.name})" 
        filter="url(#glow-${p.name})" />

  <!-- Linha de Reflexo de Luz Estelar na Viseira -->
  <path d="M86,76 C100,68 140,68 154,78 C142,72 102,72 86,76 Z" fill="#ffffff" opacity="0.8" />
  <path d="M80,92 C95,88 120,88 138,91" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.45" />

  <!-- Display HUD na Viseira -->
  <text x="120" y="115" fill="#ffffff" font-family="monospace" font-size="9" font-weight="bold" text-anchor="middle" letter-spacing="1" opacity="0.95">${p.hudText}</text>
  <circle cx="90" cy="94" r="2.5" fill="#ffffff" opacity="0.85" />
  <line x1="84" y1="94" x2="96" y2="94" stroke="#ffffff" stroke-width="0.75" opacity="0.85" />
  <circle cx="150" cy="94" r="2.5" fill="#ffffff" opacity="0.85" />
  <line x1="144" y1="94" x2="156" y2="94" stroke="#ffffff" stroke-width="0.75" opacity="0.85" />

  <!-- Headset / ComLink Neural Lateral -->
  <rect x="54" y="96" width="8" height="24" rx="4" fill="${p.color}" stroke="#ffffff" stroke-width="1" />
  <rect x="178" y="96" width="8" height="24" rx="4" fill="${p.color}" stroke="#ffffff" stroke-width="1" />
  
  <!-- Microfone do ComLink -->
  <path d="M58,116 Q66,142 96,144" fill="none" stroke="${p.glow}" stroke-width="2.5" stroke-linecap="round" />
  <circle cx="96" cy="144" r="3.5" fill="${p.glow}" filter="url(#glow-${p.name})" />

  <!-- Insígnia da Colônia / Patente RedRide -->
  <g transform="translate(106, 188)">
    <circle cx="14" cy="14" r="13" fill="#0e0b0a" stroke="${p.color}" stroke-width="1.5" />
    <text x="14" y="18" fill="${p.glow}" font-family="sans-serif" font-size="10" font-weight="900" text-anchor="middle">${p.symbol}</text>
  </g>

  <!-- Status Online Pulsante -->
  <circle cx="198" cy="42" r="7" fill="#10b981" filter="url(#glow-${p.name})" />
  <circle cx="198" cy="42" r="3.5" fill="#ffffff" />
</svg>`;

  fs.writeFileSync(path.join(dir, `${p.name}.svg`), svg, 'utf-8');
  console.log(`Generated avatar: ${p.name}.svg`);
});
console.log('All 12 pilot avatars successfully created!');
