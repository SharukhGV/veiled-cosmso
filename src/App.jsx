import React, { useState, useEffect } from 'react';
import { Observer, Body, Equator, SiderealTime } from 'astronomy-engine';
import mercuryImg from './assets/mercury.png';
import venusImg from './assets/venus.png';
import marsImg from './assets/mars.png';
import jupiterImg from './assets/jupiter.png';
import saturnImg from './assets/saturn.png';
import uranusImg from './assets/uranus.png';
import neptuneImg from './assets/neptune.png';

const MESSIER_DATA = [

  { "name": "M31", "common": "Andromeda Galaxy", "ra": 0.7123, "dec": 41.2687 },
  { "name": "M42", "common": "Orion Nebula", "ra": 5.5881, "dec": -5.3911 },
  { "name": "M45", "common": "Pleiades", "ra": 3.7836, "dec": 24.1167 },
  { "name": "M13", "common": "Hercules Cluster", "ra": 16.6949, "dec": 36.4613 },
  { "name": "M51", "common": "Whirlpool Galaxy", "ra": 13.4981, "dec": 47.1953 },
  { "name": "M57", "common": "Ring Nebula", "ra": 18.8921, "dec": 33.0292 },
  { "name": "M27", "common": "Dumbbell Nebula", "ra": 19.9935, "dec": 22.7211 },
  { "name": "M8", "common": "Lagoon Nebula", "ra": 18.06, "dec": -24.38 },
  { "name": "M20", "common": "Trifid Nebula", "ra": 18.04, "dec": -23.03 },
  { "name": "M16", "common": "Eagle Nebula", "ra": 18.31, "dec": -13.81 },
  { "name": "M17", "common": "Omega Nebula", "ra": 18.35, "dec": -16.18 },
  { "name": "M81", "common": "Bode's Galaxy", "ra": 9.93, "dec": 69.07 },
  { "name": "M82", "common": "Cigar Galaxy", "ra": 9.93, "dec": 69.68 },
  { "name": "M44", "common": "Beehive Cluster", "ra": 8.67, "dec": 19.67 },
  { "name": "M101", "common": "Pinwheel Galaxy", "ra": 14.05, "dec": 54.35 },
  { "name": "M11", "common": "Wild Duck Cluster", "ra": 18.85, "dec": -6.27 },
  { "name": "M4", "common": "Globular Cluster", "ra": 16.39, "dec": -26.53 },
  { "name": "M22", "common": "Sagittarius Cluster", "ra": 18.61, "dec": -23.90 },
  { "name": "M3", "common": "Canes Venatici Cluster", "ra": 13.70, "dec": 28.38 },
  { "name": "M5", "common": "Serpens Cluster", "ra": 15.31, "dec": 2.08 },
  { "name": "M92", "common": "Hercules Cluster", "ra": 17.28, "dec": 43.13 },
  { "name": "M33", "common": "Triangulum Galaxy", "ra": 1.56, "dec": 30.66 },
  { "name": "M1", "common": "Crab Nebula", "ra": 5.58, "dec": 22.01 },
  { "name": "M7", "common": "Ptolemy Cluster", "ra": 17.89, "dec": -34.82 },
  { "name": "M6", "common": "Butterfly Cluster", "ra": 17.67, "dec": -32.22 },
  { "name": "M35", "common": "Gemini Cluster", "ra": 6.15, "dec": 24.33 },
  { "name": "M41", "common": "Canis Major Cluster", "ra": 6.78, "dec": -20.74 },
  { "name": "M104", "common": "Sombrero Galaxy", "ra": 12.67, "dec": -11.62 },
  { "name": "M64", "common": "Black Eye Galaxy", "ra": 12.94, "dec": 21.68 },
  { "name": "M15", "common": "Pegasus Cluster", "ra": 21.50, "dec": 12.17 }
]
const PLANETS = [
  { id: Body.Moon, name: "Moon", img: "🌕", isEmoji: true }, // Keeping emoji for moon
  { id: Body.Mercury, name: "Mercury", img: mercuryImg },
  { id: Body.Venus, name: "Venus", img: venusImg },
  { id: Body.Mars, name: "Mars", img: marsImg },
  { id: Body.Jupiter, name: "Jupiter", img: jupiterImg },
  { id: Body.Saturn, name: "Saturn", img: saturnImg },
  { id: Body.Uranus, name: "Uranus", img: uranusImg },
  { id: Body.Neptune, name: "Neptune", img: neptuneImg }
];
// Curated list for Kids Mode (Top 10 visually impressive objects)
const KIDS_PICKS = [
  { id: Body.Moon, name: "Moon", img: "🌕", isEmoji: true, common: "Earth's Neighbor" },
  { id: Body.Jupiter, name: "Jupiter", img: jupiterImg, common: "King of Planets" },
  { id: Body.Saturn, name: "Saturn", img: saturnImg, common: "Ringed Giant" },
  { id: Body.Mars, name: "Mars", img: marsImg, common: "The Red Planet" },
  { id: Body.Venus, name: "Venus", img: venusImg, common: "Morning Star" },
  { name: "M45", common: "The Pleiades", ra: 3.7836, dec: 24.1167, img: "✨", isEmoji: true },
  { name: "M31", common: "Andromeda", ra: 0.7123, dec: 41.2687, img: "🌀", isEmoji: true },
  { name: "M42", common: "Orion Nebula", ra: 5.5881, dec: -5.3911, img: "☁️", isEmoji: true },
  { name: "M13", common: "Star Cluster", ra: 16.6949, dec: 36.4613, img: "🎆", isEmoji: true },
  { name: "M51", common: "Whirlpool", ra: 13.4981, dec: 47.1953, img: "🌪️", isEmoji: true }
];

export default function TelescopeApp() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('SYSTEM ONLINE');
  const [location, setLocation] = useState({ lat: 40.71, lon: -73.93 });
  const [nightMode, setNightMode] = useState(false);
  const [kidsMode, setKidsMode] = useState(false); // New State
  const [isSlewing, setIsSlewing] = useState(false);

  // ... (Keep your existing useEffect and sendCommand logic)

  const displayList = kidsMode ? KIDS_PICKS : [...PLANETS, ...MESSIER_DATA].filter(o => 
    o.name.toLowerCase().includes(search.toLowerCase()) || 
    (o.common && o.common.toLowerCase().includes(search.toLowerCase()))
  );

  const theme = {
    bg: nightMode ? '#0a0a0a' : '#050505',
    card: nightMode ? '#1a1a1a' : '#141414',
    cardHover: nightMode ? '#2a2a2a' : '#202020',
    text: nightMode ? '#ff4444' : '#ffffff',
    textSecondary: nightMode ? '#ff8888' : '#a0a0a0',
    accent: nightMode ? '#ff4444' : '#ff6666',
    border: nightMode ? '#330000' : '#2a2a2a'
  };

  return (
    <div style={{
      ...ui.container,
      background: theme.bg,
      color: theme.text
    }}>
      <div style={ui.header}>
        <div>
          <h1 style={{...ui.title, color: theme.accent}}>🔭 VEILED COSMOS</h1>
          <p style={ui.subtitle}>Control Your Telescope to the Stars</p>
        </div>
        <div style={{...ui.statusBox, background: isSlewing ? '#ffaa00' : theme.accent}}>
          <span style={ui.statusDot}></span>
          {status}
        </div>
      </div>

      <div style={ui.mainGrid}>
        <div style={ui.controls}>
          {!kidsMode && (
            <div style={ui.searchWrapper}>
              <span style={ui.searchIcon}>🔍</span>
              <input 
                style={{...ui.search, background: theme.card, color: theme.text, borderColor: theme.border}} 
                placeholder="Search galaxies, nebulae, planets..." 
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
          
          <div style={kidsMode ? ui.kidsGrid : ui.scrollGrid}>
            {displayList.map(obj => (
              <div 
                key={obj.name} 
                style={{
                  ...(kidsMode ? ui.kidsCard : ui.card), 
                  background: theme.card,
                  borderColor: kidsMode ? theme.accent : theme.border,
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => sendCommand(obj)}
              >
                <div style={kidsMode ? ui.kidsIconContainer : ui.iconContainer}>
                  {obj.isEmoji || !obj.img ? (
                    <span style={kidsMode ? ui.kidsIconText : ui.iconText}>{obj.img || "🔭"}</span>
                  ) : (
                    <img src={obj.img} alt={obj.name} style={kidsMode ? ui.kidsPlanetImage : ui.planetImage} />
                  )}
                </div>
                <div style={kidsMode ? ui.kidsCardName : ui.cardName}>{obj.name}</div>
                <div style={kidsMode ? ui.kidsCardCommon : ui.cardCommon}>{obj.common || (obj.id ? 'Planet' : 'Deep Space Object')}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={ui.sidebar}>
          <div style={ui.buttonGroup}>
            <button 
              style={{...ui.actionBtn, background: kidsMode ? '#2196F3' : '#333'}}
              onClick={() => setKidsMode(!kidsMode)}
            >
              <span style={ui.btnIcon}>{kidsMode ? '🚀' : '🧒'}</span>
              {kidsMode ? 'ADVANCED MODE' : 'KIDS MODE'}
            </button>
            
            <button 
              style={{...ui.actionBtn, background: nightMode ? '#7a1f1f' : '#333'}}
              onClick={() => setNightMode(!nightMode)}
            >
              <span style={ui.btnIcon}>{nightMode ? '☀️' : '🌙'}</span>
              {nightMode ? 'NORMAL VISION' : 'NIGHT VISION'}
            </button>
          </div>

          <button 
            style={{...ui.stopBtn}}
            onClick={() => sendCommand(null, 'stop')}
          >
            <span style={ui.btnIcon}>🛑</span>
            STOP MOUNT
          </button>

          <div style={{...ui.infoBox, background: theme.card, borderColor: theme.border}}>
            <h3 style={{margin: '0 0 10px 0', color: theme.accent}}>⚙️ Calibration</h3>
            <ol style={ui.infoList}>
              <li>Level Mount</li>
              <li>Aim at Polaris</li>
              <li>Restart ESP32</li>
            </ol>
            <div style={ui.infoFooter}>
              <span>📍 Current Location</span>
              <span style={{fontFamily: 'monospace'}}>{location.lat}°, {location.lon}°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ui = {
  container: { 
    minHeight: '100vh', 
    padding: 'clamp(16px, 4vw, 32px)', 
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif", 
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column'
  },
  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 'clamp(24px, 6vw, 40px)',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: { 
    fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', 
    letterSpacing: '2px', 
    margin: 0,
    fontWeight: 700
  },
  subtitle: {
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
    opacity: 0.7,
    marginTop: '4px'
  },
  statusBox: { 
    color: '#000', 
    padding: '8px 16px', 
    borderRadius: '20px', 
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#00ff00',
    display: 'inline-block',
    animation: 'pulse 2s infinite'
  },
  mainGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 300px', 
    gap: 'clamp(16px, 4vw, 24px)', 
    flex: 1,
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  controls: { 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden',
    minWidth: 0
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: '20px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.1rem',
    opacity: 0.6
  },
  search: { 
    width: '100%', 
    padding: '12px 12px 12px 40px', 
    borderRadius: '12px', 
    border: '1px solid',
    fontSize: 'clamp(0.9rem, 3vw, 1rem)',
    outline: 'none',
    transition: 'all 0.2s'
  },
  scrollGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
    gap: 'clamp(12px, 3vw, 16px)', 
    overflowY: 'auto',
    padding: '4px'
  },
  card: { 
    borderRadius: '16px', 
    padding: 'clamp(16px, 4vw, 20px)', 
    textAlign: 'center', 
    cursor: 'pointer', 
    border: '1px solid',
    transition: 'all 0.2s ease'
  },
  iconContainer: {
    height: '60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '10px'
  },
  iconText: {
    fontSize: 'clamp(2rem, 6vw, 2.5rem)'
  },
  planetImage: {
    width: 'clamp(40px, 8vw, 50px)',
    height: 'clamp(40px, 8vw, 50px)',
    objectFit: 'contain',
    filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.2))' 
  },
  cardName: { 
    fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', 
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  cardCommon: { 
    fontSize: 'clamp(0.65rem, 2vw, 0.7rem)', 
    opacity: 0.7 
  },
  kidsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 'clamp(16px, 4vw, 24px)',
    padding: '4px'
  },
  kidsCard: {
    borderRadius: '24px',
    padding: 'clamp(20px, 5vw, 30px)',
    textAlign: 'center',
    cursor: 'pointer',
    border: '3px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  kidsIconContainer: { marginBottom: 'clamp(12px, 3vw, 20px)' },
  kidsIconText: { fontSize: 'clamp(3rem, 10vw, 5rem)' },
  kidsPlanetImage: {
    width: 'clamp(80px, 20vw, 120px)',
    height: 'clamp(80px, 20vw, 120px)',
    objectFit: 'contain',
    filter: 'drop-shadow(0px 0px 15px rgba(255,255,255,0.4))'
  },
  kidsCardName: { 
    fontSize: 'clamp(1.2rem, 4vw, 2rem)', 
    fontWeight: '900', 
    textTransform: 'uppercase',
    marginBottom: '4px'
  },
  kidsCardCommon: { 
    fontSize: 'clamp(0.9rem, 3vw, 1.2rem)', 
    opacity: 0.9, 
    marginTop: '5px' 
  },
  sidebar: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 'clamp(12px, 3vw, 16px)' 
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'column'
  },
  actionBtn: { 
    padding: 'clamp(12px, 3vw, 15px)', 
    borderRadius: '12px', 
    border: 'none', 
    color: '#fff', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
    transition: 'transform 0.1s, opacity 0.2s',
    ':active': {
      transform: 'scale(0.98)'
    }
  },
  stopBtn: {
    padding: 'clamp(12px, 3vw, 15px)',
    borderRadius: '12px',
    border: '2px solid #ff4444',
    background: '#1a0000',
    color: '#ff4444',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
    transition: 'all 0.2s'
  },
  btnIcon: {
    fontSize: '1.1rem'
  },
  infoBox: { 
    padding: 'clamp(16px, 4vw, 20px)', 
    borderRadius: '16px', 
    border: '1px solid',
    marginTop: 'auto'
  },
  infoList: {
    margin: '0',
    paddingLeft: '20px',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.85rem)',
    lineHeight: '1.6'
  },
  infoFooter: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    fontSize: '0.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    opacity: 0.7
  }
};

// Add this to your global CSS or component
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @media (max-width: 768px) {
    .main-grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(styleSheet);