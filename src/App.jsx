import React, { useState, useEffect } from 'react';
import { Observer, Body, Equator, SiderealTime } from 'astronomy-engine';
import { BRIGHT_STARS } from './starCatalog';
import mercuryImg from './assets/mercury.png';
import venusImg from './assets/venus.png';
import marsImg from './assets/mars.png';
import jupiterImg from './assets/jupiter.png';
import saturnImg from './assets/saturn.png';
import uranusImg from './assets/uranus.png';
import neptuneImg from './assets/neptune.png';
import moon from './assets/moon.png';
import andromedaImg from './assets/andromeda.png';
import orionImg from './assets/orionnebula.png';
import pleiadesImg from './assets/pleiades.png';
import m13Img from './assets/m13starcluster.png';
import m51Img from './assets/m51whirpool.jpg';
import siriusImg from './assets/sirius.png';
import betelgeuseImg from './assets/betelgeuse.png';
import hyadesImg from './assets/hyades.png';
import m35Img from './assets/m35.png';
import beehiveImg from './assets/m44.png';
import mizarImg from './assets/mizar.png';
import albireoImg from './assets/albireo.png';
import lagoonImg from './assets/lagoon.png';
import corCaroliImg from './assets/corcaroli.png';
import { useMemo } from 'react';

const MESSIER_DATA = [
  { "name": "M31", "common": "Andromeda Galaxy", "ra": 0.7123, "dec": 41.2687, img: andromedaImg },
  { "name": "M42", "common": "Orion Nebula", "ra": 5.5881, "dec": -5.3911, img: orionImg },
  { "name": "M45", "common": "Pleiades", "ra": 3.7836, "dec": 24.1167, img: pleiadesImg },
  { "name": "M13", "common": "Hercules Cluster", "ra": 16.6949, "dec": 36.4613, img: m13Img },
  { "name": "M51", "common": "Whirlpool Galaxy", "ra": 13.4981, "dec": 47.1953, img: m51Img },
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
];

const PLANETS = [
  { id: Body.Moon, name: "Moon", img: moon },
  { id: Body.Mercury, name: "Mercury", img: mercuryImg },
  { id: Body.Venus, name: "Venus", img: venusImg },
  { id: Body.Mars, name: "Mars", img: marsImg },
  { id: Body.Jupiter, name: "Jupiter", img: jupiterImg },
  { id: Body.Saturn, name: "Saturn", img: saturnImg },
  { id: Body.Uranus, name: "Uranus", img: uranusImg },
  { id: Body.Neptune, name: "Neptune", img: neptuneImg }
];

const WINTER_PICKS = [
  { id: Body.Moon, name: "Moon", img: moon, common: "Earth's Neighbor" },
  { id: Body.Mars, name: "Mars", img: marsImg, common: "The Red Planet" },
  { name: "M42", common: "Orion Nebula", ra: 5.5881, dec: -5.3911, img: orionImg },
  { name: "M45", common: "The Pleiades", ra: 3.7836, dec: 24.1167, img: pleiadesImg },
  { name: "Sirius", common: "The Brightest Star", ra: 6.7525, dec: -16.7161, img: siriusImg },
  { name: "M31", common: "Andromeda Galaxy", ra: 0.7123, dec: 41.2687, img: andromedaImg },
  { name: "Betelgeuse", common: "The Red Giant", ra: 5.9195, dec: 7.4073, img: betelgeuseImg },
  { id: Body.Jupiter, name: "Jupiter", img: jupiterImg, common: "King of Planets" },
  { name: "Hyades", common: "The V-Shape Cluster", ra: 4.45, dec: 15.95, img: hyadesImg },
  { name: "M35", common: "Starry Patch", ra: 6.148, dec: 24.33, img: m35Img }
];

const SUMMER_PICKS = [
  { id: Body.Moon, name: "Moon", img: moon, common: "Earth's Neighbor" },
  { id: Body.Venus, name: "Venus", img: venusImg, common: "The Evening Star" },
  { id: Body.Jupiter, name: "Jupiter", img: jupiterImg, common: "King of Planets" },
  { name: "M13", common: "Great Cluster", ra: 16.6949, dec: 36.4613, img: m13Img },
  { name: "M44", common: "The Beehive", ra: 8.6667, dec: 19.6667, img: beehiveImg },
  { name: "Mizar", common: "Double Star", ra: 13.3986, dec: 54.9253, img: mizarImg },
  { name: "M51", common: "Whirlpool Galaxy", ra: 13.4981, dec: 47.1953, img: m51Img },
  { name: "Albireo", common: "Blue & Gold Stars", ra: 19.5126, dec: 27.9597, img: albireoImg },
  { name: "M8", common: "Lagoon Nebula", ra: 18.062, dec: -24.38, img: lagoonImg },
  { name: "Cor Caroli", common: "Heart of Charles", ra: 12.9372, dec: 38.3175, img: corCaroliImg }
];

export default function TelescopeApp() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('READY');
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [nightMode, setNightMode] = useState(false);
  const [kidsMode, setKidsMode] = useState(false);
  const [isSlewing, setIsSlewing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showIntro, setShowIntro] = useState(false);
  const [showCalGuide, setShowCalGuide] = useState(false);
  const [selectedCalStar, setSelectedCalStar] = useState(BRIGHT_STARS[0]?.name || '');
  const [starRef1, setStarRef1] = useState(null);
  const [starRef2, setStarRef2] = useState(null);
  const [calibrationData, setCalibrationData] = useState(null);
  const [calibrationMessage, setCalibrationMessage] = useState('');
  const [tracking, setTracking] = useState(false);
  const [mountPosition, setMountPosition] = useState({ ra: 0, dec: 0 });
  const [extraStarData, setExtraStarData] = useState([]);
  const [isSummer, setIsSummer] = useState(true);

  useEffect(() => {
    fetch('/starData.json')
      .then(res => res.json())
      .then(data => {
        const formattedStars = data
          .filter(star => star.proper)
          .map(star => ({
            name: star.proper,
            common: `${star.con || ''} Star (Mag: ${star.mag})`,
            ra: star.ra,
            dec: star.dec,
            isStar: true
          }));
        setExtraStarData(formattedStars);
      })
      .catch(err => console.error("Error loading starData.json:", err));
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('veiledCosmosSeenIntro')) {
      setShowIntro(true);
    }
  }, []);

  const closeIntro = () => {
    localStorage.setItem('veiledCosmosSeenIntro', 'true');
    setShowIntro(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://192.168.4.1/status')
        .then(response => response.json())
        .then(data => {
          setIsSlewing(data.moving);
          setTracking(data.tracking);
          let newStatus = 'READY';
          if (data.moving) newStatus = 'SLEWING...';
          else if (data.tracking) newStatus = 'TRACKING';
          setStatus(newStatus);
          setMountPosition({ ra: data.ra_steps, dec: data.dec_steps });
        })
        .catch(() => {
          setStatus('CONNECTION ERROR');
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setLocation({ lat: 40.71, lon: -73.93 });
          setCalibrationMessage("Could not get your location. Using default coordinates (New York).");
        }
      );
    } else {
      setLocation({ lat: 40.71, lon: -73.93 });
      setCalibrationMessage("Geolocation not supported. Using default coordinates (New York).");
    }
  }, []);

  const normalizeHours = (hours) => {
    let value = hours % 24;
    if (value < 0) value += 24;
    return value;
  };

  const deltaHours = (a, b) => {
    let diff = a - b;
    while (diff > 12) diff -= 24;
    while (diff < -12) diff += 24;
    return diff;
  };

  const computeCalibration = (refA, refB) => {
    const raDelta = deltaHours(refB.lha, refA.lha);
    if (Math.abs(raDelta) < 0.1) {
      setCalibrationMessage('Stars too close together. Choose stars at least 30° apart in RA.');
      return null;
    }
    const decDelta = refB.dec - refA.dec;
    if (Math.abs(decDelta) < 5) {
      setCalibrationMessage('Stars too close in declination. Choose stars at least 10° apart in Dec.');
      return null;
    }
    const raScale = (refB.raSteps - refA.raSteps) / raDelta;
    const raOffset = refA.raSteps - raScale * refA.lha;
    const decScale = (refB.decSteps - refA.decSteps) / decDelta;
    const decOffset = refA.decSteps - decScale * refA.dec;
    return { raScale, raOffset, decScale, decOffset };
  };

  const sendCalibrationToEsp32 = async (calibration) => {
    if (!calibration) return;
    try {
      const response = await fetch('http://192.168.4.1/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calibration)
      });
      if (!response.ok) throw new Error('Calibration upload failed');
      setCalibrationMessage('Calibration successful! Mount mapping updated.');
    } catch (error) {
      setCalibrationMessage('Unable to send calibration to mount.');
      console.error(error);
    }
  };

  const saveCalibrationReference = async () => {
    if (location.lon === null) {
      setCalibrationMessage("Waiting for location...");
      return;
    }
    const star = BRIGHT_STARS.find(s => s.name === selectedCalStar);
    if (!star) {
      setCalibrationMessage('Please select a bright star.');
      return;
    }
    try {
      const statusResponse = await fetch('http://192.168.4.1/status');
      if (!statusResponse.ok) throw new Error('Status request failed');
      const statusData = await statusResponse.json();
      const time = new Date();
      const lst = SiderealTime(time, location.lon);
      let lha = normalizeHours(lst - star.ra);
      const reference = {
        name: star.name,
        ra: star.ra,
        dec: star.dec,
        lha,
        raSteps: statusData.ra_steps,
        decSteps: statusData.dec_steps
      };
      if (!starRef1) {
        setStarRef1(reference);
        setStarRef2(null);
        setCalibrationData(null);
        setCalibrationMessage(`Saved ${star.name} as reference 1. Now select a different star for reference 2.`);
        return;
      }
      if (!starRef2 && starRef1.name !== star.name) {
        setStarRef2(reference);
        const calibration = computeCalibration(starRef1, reference);
        setCalibrationData(calibration);
        if (calibration) {
          await sendCalibrationToEsp32(calibration);
        }
        return;
      }
      setCalibrationMessage('Please select a different star for reference 2.');
    } catch (error) {
      setCalibrationMessage('Unable to read mount position. Check connection.');
      console.error(error);
    }
  };

  const setStarAsHome = async () => {
    if (location.lon === null) {
      setCalibrationMessage("Waiting for location...");
      return;
    }
    const star = BRIGHT_STARS.find(s => s.name === selectedCalStar);
    if (!star) {
      setCalibrationMessage('Please select a bright star.');
      return;
    }
    try {
      const statusResponse = await fetch('http://192.168.4.1/status');
      if (!statusResponse.ok) throw new Error('Status request failed');
      const statusData = await statusResponse.json();
      const time = new Date();
      const lst = SiderealTime(time, location.lon);
      let lha = normalizeHours(lst - star.ra);
      const payload = {
        lha: lha,
        dec: star.dec,
        ra_steps: statusData.ra_steps,
        dec_steps: statusData.dec_steps
      };
      const response = await fetch('http://192.168.4.1/set_star_home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setCalibrationMessage(`${star.name} set as home reference.`);
        setStarRef1(null);
        setStarRef2(null);
        setCalibrationData(null);
      } else {
        setCalibrationMessage('Failed to set home reference on mount.');
      }
    } catch (error) {
      setCalibrationMessage('Unable to set home. Check connection.');
      console.error(error);
    }
  };

  const resetCalibration = async () => {
    setStarRef1(null);
    setStarRef2(null);
    setCalibrationData(null);
    setCalibrationMessage('Calibration reset.');
    try {
      await fetch('http://192.168.4.1/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true })
      });
    } catch {
      setCalibrationMessage('Unable to reset mount calibration.');
    }
  };

  const toggleTracking = async () => {
    const newTracking = !tracking;
    try {
      const response = await fetch('http://192.168.4.1/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: newTracking })
      });
      if (response.ok) {
        setTracking(newTracking);
        setStatus(newTracking ? 'TRACKING' : 'READY');
      } else {
        setStatus('TRACKING ERROR');
      }
    } catch (error) {
      setStatus('CONNECTION ERROR');
      console.error(error);
    }
  };

  const displayList = useMemo(() => {
    if (kidsMode) {
      return isSummer ? SUMMER_PICKS : WINTER_PICKS;
    }
    if (!search.trim()) {
      return [...PLANETS, ...MESSIER_DATA];
    }
    const searchTerm = search.toLowerCase();
    const combinedSource = [...PLANETS, ...MESSIER_DATA, ...extraStarData];
    return combinedSource
      .filter(obj => 
        obj.name.toLowerCase().includes(searchTerm) || 
        (obj.common && obj.common.toLowerCase().includes(searchTerm))
      )
      .slice(0, 50);
  }, [search, kidsMode, isSummer, extraStarData]);

  const theme = {
    bg: nightMode ? '#0a0a0a' : '#050505',
    card: nightMode ? '#1a1a1a' : '#141414',
    cardHover: nightMode ? '#2a2a2a' : '#202020',
    text: nightMode ? '#ff4444' : '#ffffff',
    textSecondary: nightMode ? '#ff8888' : '#a0a0a0',
    accent: nightMode ? '#ff4444' : '#ff6666',
    border: nightMode ? '#330000' : '#2a2a2a',
    radius: '12px'
  };

  const sendCommand = (obj, action = 'goto') => {
    if (location.lat === null || location.lon === null) {
      setStatus("WAITING FOR LOCATION...");
      return;
    }
    if (action === 'stop') {
      fetch('http://192.168.4.1/stop', { method: 'POST' })
        .then(() => setStatus('STOPPING...'))
        .catch(() => setStatus('CONNECTION ERROR'));
      return;
    }
    if (action === 'home') {
      fetch('http://192.168.4.1/home', { method: 'POST' })
        .then(() => setStatus('HOMING...'))
        .catch(() => setStatus('CONNECTION ERROR'));
      return;
    }
    const observer = new Observer(location.lat, location.lon, 0);
    const time = new Date();
    const lst = SiderealTime(time, location.lon);
    let ra, dec;
    if (obj.id !== undefined) {
      const eq = Equator(obj.id, time, observer, true, true);
      ra = eq.ra;
      dec = eq.dec;
    } else {
      ra = obj.ra;
      dec = obj.dec;
    }
    let ha = normalizeHours(lst - ra);
    fetch('http://192.168.4.1/slew', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lha: ha, dec: dec })
    })
    .then(response => {
      if (response.ok) {
        setStatus('SLEWING...');
        if (tracking) toggleTracking();
      } else {
        setStatus('SLEW ERROR');
      }
    })
    .catch(() => setStatus('CONNECTION ERROR'));
  };

  const moveRelative = async (axis, steps) => {
    const endpoint = axis === 'ra' ? '/move_ra' : '/move_dec';
    try {
      await fetch(`http://192.168.4.1${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps })
      });
      setStatus('MOVING...');
    } catch (error) {
      setStatus('CONNECTION ERROR');
    }
  };

  return (
    <div style={{
      ...ui.container,
      background: theme.bg,
      color: theme.text,
      filter: nightMode ? 'sepia(100%) saturate(300%) hue-rotate(-50deg)' : 'none'
    }}>
      <div style={ui.header}>
        <h1 style={{...ui.title, color: theme.accent}}>🔭 VEILED COSMOS</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            ...ui.statusBox,
            background: status === 'TRACKING' ? '#004400' : theme.accent,
            borderRadius: theme.radius
          }}>
            {status}
          </div>
          <button onClick={() => setSidebarVisible(!sidebarVisible)} style={{ background: 'none', border: 'none', color: theme.accent, fontSize: '1.5rem', cursor: 'pointer', padding: '8px' }}>☰</button>
        </div>
      </div>

      {showIntro && (
        <div style={ui.modalOverlay}>
          <div style={ui.modalBox}>
            <h2 style={ui.modalTitle}>Welcome to Veiled Cosmos</h2>
            <p style={ui.modalText}>This interface helps you move the ESP32 telescope mount to planets and deep sky objects using simple controls.</p>
            <h3 style={ui.modalSubTitle}>Setup Instructions</h3>
            <ol style={ui.modalList}>
              <li><strong>Hardware Setup</strong>: Connect NEMA 17 motors to RA and DEC axes of your Orion StarBlast mount. Wire to ESP32 pins (RA: 12/14, DEC: 27/26). Power the ESP32 and motors.</li>
              <li><strong>Upload ESP32 Code</strong>: Flash the <code>esp32_code.ino</code> file to your ESP32 using Arduino IDE. Ensure WiFi AP "VeiledCosmos_Mount" is created.</li>
              <li><strong>Start the App</strong>: Run <code>npm run dev</code> in the project folder. Open the app in your browser.</li>
              <li><strong>Connect to Mount</strong>: Connect your device to the ESP32's WiFi network. The app will poll for status.</li>
              <li><strong>Calibrate</strong>: Level the mount, aim at Polaris, then use the calibration panel to set home and save two star references for accurate pointing.</li>
              <li><strong>Use the Interface</strong>: Click objects to slew, use stop/home, and enjoy stargazing!</li>
            </ol>
            <h3 style={ui.modalSubTitle}>Interface Guide</h3>
            <ul style={ui.modalList}>
              <li><strong>Object Grid</strong>: click any planet or nebula to send the mount there.</li>
              <li><strong>Search</strong>: type a name to filter stars, galaxies, and nebulae.</li>
              <li><strong>Kids Mode</strong>: simpler cards and fun names for younger users.</li>
              <li><strong>Night Vision</strong>: toggles the darker, easier-to-read display.</li>
              <li><strong>Stop</strong>: halts motion immediately via the ESP32 stop command.</li>
              <li><strong>Home</strong>: returns the mount to the parking position.</li>
              <li><strong>Tracking</strong>: enable sidereal tracking to follow celestial objects as Earth rotates.</li>
            </ul>
            <button style={ui.modalBtn} onClick={closeIntro}>Got it, continue</button>
          </div>
        </div>
      )}

      {showCalGuide && (
        <div style={ui.modalOverlay}>
          <div style={ui.modalBox}>
            <h2 style={ui.modalTitle}>Calibration Guide</h2>
            <p style={ui.modalText}>Follow these steps to calibrate your mount for accurate pointing. This uses a two-star alignment method.</p>
            <ol style={ui.modalList}>
              <li><strong>Prepare the Mount</strong>: Level your Orion StarBlast mount on a stable surface. Aim the telescope roughly at Polaris (North Star) using the manual knobs.</li>
              <li><strong>Set Home Reference</strong>: In the app, select "Polaris" from the star dropdown. Manually align the telescope to Polaris. Click "Set selected star as home" to record this position as the mount's zero point.</li>
              <li><strong>Choose First Reference Star</strong>: Select a bright star (e.g., Vega) from the dropdown. Manually slew the mount to center that star in your eyepiece. Click "Save star reference" to record reference 1.</li>
              <li><strong>Choose Second Reference Star</strong>: Select a different bright star (e.g., Altair) from the dropdown. Manually align to it. Click "Save star reference" again to record reference 2 and compute calibration.</li>
              <li><strong>Verify Calibration</strong>: The app will show computed RA/DEC scales. Test by clicking objects in the grid — the mount should now point accurately.</li>
              <li><strong>Reset if Needed</strong>: If calibration seems off, click "Reset calibration" and repeat steps 2-4.</li>
            </ol>
            <p style={ui.modalText}>Tip: Use stars at least 45° apart for best results. Calibration improves pointing accuracy across the sky.</p>
            <button style={ui.modalBtn} onClick={() => setShowCalGuide(false)}>Close Guide</button>
          </div>
        </div>
      )}

      <div style={{...ui.mainGrid, gridTemplateColumns: sidebarVisible ? '1fr 300px' : '1fr'}}>
        <div style={ui.controls}>
          <input 
            style={{...ui.search, background: theme.card, color: theme.text, borderRadius: theme.radius, borderColor: theme.border}} 
            placeholder="Search stars, nebulae, planets..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={ui.scrollGrid}>
            {displayList.map(obj => (
              <button 
                key={`${obj.name}-${obj.ra || obj.id}`}
                onClick={() => sendCommand(obj)}
                style={{
                  ...ui.cardButton,
                  background: theme.card,
                  borderColor: theme.border,
                  color: theme.text,
                  borderRadius: theme.radius
                }}
              >
                {obj.img ? (
                  <img src={obj.img} style={ui.objectImage} alt={obj.name} />
                ) : (
                  <span style={ui.fallbackIcon}>{obj.isStar ? '⭐' : '🌌'}</span>
                )}
                <div style={ui.cardContent}>
                  <div style={ui.cardName}>{obj.name}</div>
                  <div style={ui.cardCommon}>{obj.common || (obj.isStar ? 'Star' : 'Deep Sky Object')}</div>
                </div>
                <div style={ui.cardAction}>SLEW 🔭</div>
              </button>
            ))}
          </div>
        </div>

        {sidebarVisible && <div style={ui.sidebar}>
          {kidsMode && (
            <div style={{...ui.calibBox, background: theme.accent, marginBottom: '15px', borderRadius: theme.radius}}>
              <h3 style={{margin: '0 0 10px 0', color: '#000'}}>📅 Season Select</h3>
              <button 
                style={{...ui.actionBtn, background: '#fff', color: '#000', borderRadius: theme.radius}}
                onClick={() => setIsSummer(!isSummer)}
              >
                <span style={ui.btnIcon}>{isSummer ? '☀️' : '❄️'}</span>
                SWITCH TO {isSummer ? 'WINTER' : 'SUMMER'}
              </button>
              <p style={{fontSize: '0.8rem', color: '#000', marginTop: '5px', fontWeight: 'bold'}}>
                Currently showing: {isSummer ? 'Summer Stars' : 'Winter Stars'}
              </p>
            </div>
          )}

          <div style={ui.buttonGroup}>
            <button 
              style={{...ui.actionBtn, background: kidsMode ? '#2196F3' : '#333', borderRadius: theme.radius}}
              onClick={() => setKidsMode(!kidsMode)}
            >
              <span style={ui.btnIcon}>{kidsMode ? '🚀' : '🧒'}</span>
              {kidsMode ? 'ADVANCED MODE' : 'KIDS MODE'}
            </button>
            <button 
              style={{...ui.actionBtn, background: nightMode ? '#7a1f1f' : '#333', borderRadius: theme.radius}}
              onClick={() => setNightMode(!nightMode)}
            >
              <span style={ui.btnIcon}>{nightMode ? '☀️' : '🌙'}</span>
              {nightMode ? 'NORMAL VISION' : 'NIGHT VISION'}
            </button>
          </div>

          <button 
            style={{...ui.stopBtn, borderRadius: theme.radius}}
            onClick={() => sendCommand(null, 'stop')}
          >
            <span style={ui.btnIcon}>🛑</span>
            STOP MOUNT
          </button>

          <div style={{...ui.calibBox, background: theme.card, borderColor: theme.border, borderRadius: theme.radius}}>
            <h3 style={{margin: '0 0 10px 0', color: theme.accent}}>🕹️ Manual Fine Moves</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('ra', 200)}>RA +200</button>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('ra', -200)}>RA -200</button>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('dec', 200)}>DEC +200</button>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('dec', -200)}>DEC -200</button>
            </div>
            <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('ra', 20)}>RA +20</button>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('ra', -20)}>RA -20</button>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('dec', 20)}>DEC +20</button>
              <button style={{...ui.smallBtn, borderRadius: theme.radius}} onClick={() => moveRelative('dec', -20)}>DEC -20</button>
            </div>
          </div>

          <button 
            style={{...ui.actionBtn, background: '#333', borderRadius: theme.radius}}
            onClick={() => sendCommand(null, 'home')}
          >
            <span style={ui.btnIcon}>🏠</span>
            HOME MOUNT
          </button>

          <button 
            style={{...ui.actionBtn, background: tracking ? '#ffaa00' : '#333', borderRadius: theme.radius}}
            onClick={toggleTracking}
          >
            <span style={ui.btnIcon}>{tracking ? '⏸️' : '▶️'}</span>
            {tracking ? 'DISABLE TRACKING' : 'ENABLE TRACKING'}
          </button>

          <div style={{...ui.calibBox, background: theme.card, borderColor: theme.border, borderRadius: theme.radius}}>
            <h3 style={{margin: '0 0 10px 0', color: theme.accent}}>🧭 Star Calibration</h3>
            <p style={ui.calibText}>Align the mount to a bright star, choose it below, then save two different star references for better accuracy.</p>
            <select
              value={selectedCalStar}
              onChange={e => setSelectedCalStar(e.target.value)}
              style={{...ui.select, background: theme.card, color: theme.text, borderColor: theme.border, borderRadius: theme.radius}}
            >
              {BRIGHT_STARS.map(star => (
                <option key={star.name} value={star.name}>{star.name}</option>
              ))}
            </select>
            <button style={{...ui.calibBtn, borderRadius: theme.radius}} onClick={saveCalibrationReference}>Save star reference</button>
            <button style={{...ui.calibBtnSecondary, borderRadius: theme.radius}} onClick={setStarAsHome}>Set selected star as home</button>
            <button style={{...ui.calibBtnSecondary, borderRadius: theme.radius}} onClick={() => setShowCalGuide(true)}>Show Calibration Guide</button>
            <div style={ui.calibRow}>Reference 1: {starRef1 ? starRef1.name : 'None'}</div>
            <div style={ui.calibRow}>Reference 2: {starRef2 ? starRef2.name : 'None'}</div>
            <button style={{...ui.calibBtnSecondary, borderRadius: theme.radius}} onClick={resetCalibration}>Reset calibration</button>
            {calibrationData && (
              <div style={ui.calibRow}>
                RA scale: {calibrationData.raScale.toFixed(1)}, DEC scale: {calibrationData.decScale.toFixed(1)}
              </div>
            )}
            <div style={ui.calibMessage}>{calibrationMessage}</div>
          </div>

          <div style={{...ui.infoBox, background: theme.card, borderColor: theme.border, borderRadius: theme.radius}}>
            <h3 style={{margin: '0 0 10px 0', color: theme.accent}}>⚙️ Calibration</h3>
            <ol style={ui.infoList}>
              <li>Level Mount</li>
              <li>Aim at Polaris</li>
              <li>Restart ESP32</li>
            </ol>
            <div style={ui.infoFooter}>
              <span>📍 Current Location</span>
              <span>{location.lat !== null ? location.lat.toFixed(2) : "?"}°, {location.lon !== null ? location.lon.toFixed(2) : "?"}°</span>
            </div>
          </div>
        </div>}
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
  statusBox: { 
    color: '#fff', 
    padding: '8px 16px', 
    fontWeight: 'bold',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
  },
  mainGrid: { 
    display: 'grid', 
    gap: 'clamp(16px, 4vw, 24px)', 
    flex: 1
  },
  controls: { 
    display: 'flex', 
    flexDirection: 'column', 
    overflow: 'hidden',
    minWidth: 0,
    gap: '20px'
  },
  search: { 
    width: '100%', 
    padding: '12px 16px', 
    border: '1px solid',
    fontSize: 'clamp(0.9rem, 3vw, 1rem)',
    outline: 'none'
  },
  scrollGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
    gap: '12px', 
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 200px)',
    padding: '4px'
  },
  cardButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    border: '1px solid',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'transform 0.1s ease',
    fontFamily: 'inherit'
  },
  objectImage: {
    width: '48px',
    height: '48px',
    objectFit: 'contain',
    borderRadius: '50%',
    flexShrink: 0
  },
  fallbackIcon: {
    fontSize: '2rem',
    width: '48px',
    textAlign: 'center',
    flexShrink: 0
  },
  cardContent: {
    flex: 1,
    minWidth: 0
  },
  cardName: {
    fontWeight: 'bold',
    fontSize: '1rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cardCommon: {
    fontSize: '0.75rem',
    opacity: 0.8,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  cardAction: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    background: '#3b82f6',
    color: 'white',
    padding: '6px 10px',
    borderRadius: '20px',
    whiteSpace: 'nowrap'
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
    border: 'none', 
    color: '#fff', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
  },
  stopBtn: {
    padding: 'clamp(12px, 3vw, 15px)',
    border: '2px solid #ff4444',
    background: '#1a0000',
    color: '#ff4444',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
  },
  btnIcon: {
    fontSize: '1.1rem'
  },
  smallBtn: {
    padding: '8px 12px',
    border: 'none',
    background: '#444',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  infoBox: { 
    padding: 'clamp(16px, 4vw, 20px)', 
    border: '1px solid',
    marginTop: 'auto'
  },
  infoList: {
    margin: 0,
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
  },
  calibBox: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid'
  },
  calibText: {
    margin: 0,
    opacity: 0.8,
    lineHeight: 1.6,
    fontSize: '0.95rem'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid',
    fontSize: '0.95rem',
    outline: 'none'
  },
  calibBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    background: '#2196F3',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '700'
  },
  calibBtnSecondary: {
    width: '100%',
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
    background: '#222',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '700'
  },
  calibRow: {
    fontSize: '0.9rem',
    opacity: 0.85,
    lineHeight: 1.5
  },
  calibMessage: {
    marginTop: '8px',
    fontSize: '0.9rem',
    color: '#ffcc66'
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 'clamp(10px, 5vw, 20px)',
    zIndex: 999
  },
  modalBox: {
    width: '100%',
    maxWidth: 'min(520px, 90vw)',
    background: '#111',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: 'clamp(16px, 4vw, 28px)',
    boxShadow: '0 22px 60px rgba(0,0,0,0.45)',
    maxHeight: '80vh',
    overflowY: 'auto'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.6rem',
    marginBottom: '12px',
    color: '#ffcc66'
  },
  modalSubTitle: {
    margin: '20px 0 10px 0',
    fontSize: '1.3rem',
    color: '#ffcc66'
  },
  modalText: {
    fontSize: '1rem',
    lineHeight: '1.7',
    opacity: 0.9,
    marginBottom: '16px'
  },
  modalList: {
    paddingLeft: '20px',
    marginBottom: '20px',
    lineHeight: '1.8',
    color: '#ddd'
  },
  modalBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '14px',
    borderRadius: '14px',
    background: '#ff6666',
    color: '#fff',
    border: 'none',
    fontWeight: '700',
    cursor: 'pointer'
  }
};

// Add global animation for status dot (if needed elsewhere, but we removed the dot)
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  button:hover {
    opacity: 0.9;
    transform: scale(0.98);
  }
`;
document.head.appendChild(styleSheet);