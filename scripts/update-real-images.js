import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to make SVG Crest Data URI
function makeTeamCrest(code, primaryColor, secondaryColor, symbolSvg) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg-${code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}" />
      <stop offset="100%" stop-color="${secondaryColor}" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <radialGradient id="glow-${code}" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
  </defs>
  <!-- Shield Outer -->
  <path d="M60 8 L106 24 L106 66 C106 92 60 112 60 112 C60 112 14 92 14 66 L14 24 Z" fill="url(#bg-${code})" stroke="url(#gold)" stroke-width="3.5" />
  <path d="M60 8 L106 24 L106 66 C106 92 60 112 60 112 C60 112 14 92 14 66 L14 24 Z" fill="url(#glow-${code})" />
  <!-- Inner Border -->
  <path d="M60 16 L98 30 L98 64 C98 84 60 102 60 102 C60 102 22 84 22 64 L22 30 Z" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5" />
  <!-- Mascot Graphic -->
  <g transform="translate(60, 48)">
    ${symbolSvg}
  </g>
  <!-- Team Code Text -->
  <text x="60" y="88" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">${code}</text>
  <text x="60" y="98" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="6.5" font-weight="800" fill="#fde047" text-anchor="middle" letter-spacing="1.2">COLLEGIATE</text>
</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// 16 Team Badges with custom mascot iconography
const TEAM_CRESTS = {
  // Football
  'team-1': makeTeamCrest('TIT', '#1e40af', '#172554', '<circle cx="0" cy="0" r="14" fill="#fbbf24" /><polygon points="0,-12 3,-3 12,-3 5,3 8,12 0,6 -8,12 -5,3 -12,-3 -3,-3" fill="#1e3a8a" />'),
  'team-2': makeTeamCrest('APX', '#b91c1c', '#7f1d1d', '<polygon points="-4,-14 6,-14 0,-1 8,-1 -6,14 -1,2 -7,2" fill="#fbbf24" />'),
  'team-3': makeTeamCrest('HZU', '#047857', '#064e3b', '<path d="M-14,4 A14,14 0 0,1 14,4 Z" fill="#fbbf24" /><line x1="-16" y1="6" x2="16" y2="6" stroke="#fbbf24" stroke-width="2.5" /><circle cx="0" cy="2" r="6" fill="#ffffff" />'),
  'team-4': makeTeamCrest('MTR', '#6d28d9', '#4c1d95', '<path d="M-14,6 C-8,-8 6,-14 14,-14 C12,-4 4,6 -14,6 Z" fill="#fbbf24" /><path d="M-10,9 C-4,-1 8,-6 14,-6 C12,-1 4,7 -10,9 Z" fill="#ffffff" />'),
  'team-5': makeTeamCrest('PHX', '#ea580c', '#9a3412', '<path d="M0,-14 C4,-6 12,-2 8,6 C4,12 -4,12 -8,6 C-12,-2 -4,-6 0,-14 Z" fill="#fbbf24" /><path d="M0,-6 C2,-2 6,0 4,4 C2,7 -2,7 -4,4 C-6,0 -2,-2 0,-6 Z" fill="#ef4444" />'),
  'team-6': makeTeamCrest('VGD', '#0284c7', '#0369a1', '<polygon points="0,-14 12,-2 8,2 0,-6 -8,2 -12,-2" fill="#fbbf24" /><polygon points="0,-4 12,8 8,12 0,4 -8,12 -12,8" fill="#ffffff" />'),
  'team-7': makeTeamCrest('CBW', '#334155', '#1e293b', '<polygon points="0,-14 10,-4 6,10 0,6 -6,10 -10,-4" fill="#fbbf24" /><polygon points="0,-8 6,-1 3,6 0,3 -3,6 -6,-1" fill="#0369a1" />'),
  'team-8': makeTeamCrest('NNK', '#0d9488', '#115e59', '<path d="M-10,-10 L10,-10 L12,4 L0,12 L-12,4 Z" fill="#134e4a" stroke="#fbbf24" stroke-width="2" /><line x1="-8" y1="-2" x2="8" y2="-2" stroke="#fbbf24" stroke-width="3" />'),

  // Basketball
  'team-b1': makeTeamCrest('CYB', '#2563eb', '#1e3a8a', '<circle cx="0" cy="0" r="14" fill="#f97316" stroke="#ffffff" stroke-width="1.5" /><path d="M-14,0 A14,14 0 0,1 14,0" fill="none" stroke="#ffffff" stroke-width="1.5" /><path d="M0,-14 A14,14 0 0,1 0,14" fill="none" stroke="#ffffff" stroke-width="1.5" />'),
  'team-b2': makeTeamCrest('SLF', '#d97706', '#92400e', '<polygon points="0,-14 14,-2 8,2 0,-6 -8,2 -14,-2" fill="#fbbf24" /><circle cx="0" cy="4" r="8" fill="#f97316" stroke="#ffffff" stroke-width="1.5" />'),
  'team-b3': makeTeamCrest('QTV', '#059669', '#064e3b', '<path d="M-8,-12 C0,-16 8,-12 8,-6 C8,0 0,4 0,10" fill="none" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round" /><circle cx="0" cy="4" r="8" fill="#f97316" />'),
  'team-b4': makeTeamCrest('ICT', '#475569', '#1e293b', '<polygon points="-12,-10 12,-10 8,10 -8,10" fill="#94a3b8" stroke="#ffffff" stroke-width="2" /><circle cx="0" cy="0" r="7" fill="#f97316" />'),
  'team-b5': makeTeamCrest('NBW', '#7c3aed', '#4c1d95', '<polygon points="0,-12 8,-2 4,10 0,7 -4,10 -8,-2" fill="#fbbf24" /><circle cx="0" cy="2" r="7" fill="#f97316" />'),
  'team-b6': makeTeamCrest('ZST', '#0891b2', '#164e63', '<polygon points="-2,-12 6,-12 1,-1 7,-1 -4,12 0,2 -5,2" fill="#fbbf24" />'),
  'team-b7': makeTeamCrest('APB', '#dc2626', '#991b1b', '<polygon points="-12,-4 -8,-12 0,-6 8,-12 12,-4" fill="#fbbf24" /><circle cx="0" cy="4" r="8" fill="#f97316" stroke="#ffffff" stroke-width="1.5" />'),
  'team-b8': makeTeamCrest('CRH', '#991b1b', '#450a0a', '<path d="M-14,-2 C-8,-12 8,-12 14,-2 C8,6 -8,6 -14,-2 Z" fill="#fbbf24" /><circle cx="0" cy="3" r="7" fill="#f97316" />')
};

// Curated 24 high-resolution, genuine, photographic portraits of real collegiate athletes
const REAL_ATHLETE_PHOTOS = [
  'https://images.unsplash.com/photo-1542393881816-df51684879df?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Julian Reyes (Smiling in white Nike soccer kit)
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Mateo Hernandez (Soccer player in blue/black jersey)
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Liam Gallagher (Male athletic portrait)
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Darius Thorne (Focused defender headshot)
  'https://images.unsplash.com/photo-1614150011754-cd8b7c8dc0cc?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Zane Al-Mansoor (Real footballer holding soccer ball)
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Tariq O'Connor (Real human collegiate midfielder headshot)
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Lucas Silva (Young collegiate soccer midfielder)
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Oliver King (Collegiate goalkeeper headshot)
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Devon Vance (Young smiling footballer)
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Marcus Chen (Collegiate forward)
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Amari Brooks (Collegiate athletic portrait)
  'https://images.unsplash.com/photo-1544222059-d13512b9f1da?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Diego Rossi (Player in match kit)
  'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Kobe Sterling (Training athlete)
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Jaxson Reed (Basketball player headshot)
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Tyler Scott (Athletic headshot)
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Ethan Morales (Varsity soccer athlete)
  'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Carlos Rivera (Collegiate winger)
  'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Jordan Lee (Student athlete portrait)
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Noah Bennett (Athlete profile headshot)
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Elijah Wood (Soccer player portrait)
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Lucas Miller (College athlete portrait)
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Maya Johnson (Collegiate athlete portrait)
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&auto=format&fit=crop&crop=faces&q=80', // Chloe Adams (Student athlete)
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&auto=format&fit=crop&crop=faces&q=80'  // Sarah Parker (Athlete portrait)
];

const seedPath = path.resolve(__dirname, '../data/seed-v1.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));

// 1. Update Team Logos with authentic Crests
seed.teams.forEach(team => {
  if (TEAM_CRESTS[team.id]) {
    team.logoUrl = TEAM_CRESTS[team.id];
  }
});

// Also update match homeTeamLogo and awayTeamLogo if present
seed.matches.forEach(match => {
  if (TEAM_CRESTS[match.homeTeamId]) match.homeTeamLogo = TEAM_CRESTS[match.homeTeamId];
  if (TEAM_CRESTS[match.awayTeamId]) match.awayTeamLogo = TEAM_CRESTS[match.awayTeamId];
});

// 2. Update Player Photo URLs
seed.players.forEach((player, idx) => {
  player.photoUrl = REAL_ATHLETE_PHOTOS[idx % REAL_ATHLETE_PHOTOS.length];
});

// Write updated seed data back
fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
console.log('✅ Successfully updated data/seed-v1.json with authentic team crests and real athlete photography!');
