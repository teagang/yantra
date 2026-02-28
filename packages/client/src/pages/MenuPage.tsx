import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.js';
import { getSocket, useSocket } from '../hooks/useSocket.js';
import type { GameMode } from '@yantra/shared';

const COLOURS = { red: '#B55B4A', blue: '#4D7A8E', yellow: '#C8A840', purple: '#7A6A96' };

export default function MenuPage() {
  const navigate = useNavigate();
  const { username, setIdentity, setLobby } = useGameStore();
  const [name, setName] = useState(username);
  const [mode, setMode] = useState<GameMode>('unranked');
  const [speedPlay, setSpeedPlay] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [view, setView] = useState<'home' | 'new' | 'join'>('home');
  const socket = useSocket();

  function handleCreate() {
    if (!name.trim()) return;
    setIdentity(name.trim(), '');
    socket.emit('create:game', {
      username: name.trim(),
      mode,
      speedPlay,
      speedPlaySeconds: 60,
      maxPlayers: 4,
    });
    socket.once('game:created', (data: { gameId: string; joinCode: string; playerId: string }) => {
      setIdentity(name.trim(), data.playerId);
      setLobby(data.gameId, data.joinCode);
      navigate('/lobby');
    });
  }

  function handleJoin() {
    if (!name.trim() || !joinCode.trim()) return;
    setIdentity(name.trim(), '');
    socket.emit('join:game', { username: name.trim(), joinCode: joinCode.trim().toUpperCase() });
    socket.once('game:joined', (data: { gameId: string; playerId: string }) => {
      setIdentity(name.trim(), data.playerId);
      navigate('/lobby');
    });
    socket.once('error', (data: { message: string }) => {
      alert(data.message);
    });
  }

  // Organic decorative squares — clustered behind title and menu, not on a grid
  const deco = [
    // behind/around title
    { x: '43%', y: '27%', s: 44, c: '#B88870', o: 0.18 },
    { x: '56%', y: '30%', s: 28, c: '#789090', o: 0.13 },
    { x: '37%', y: '36%', s: 36, c: '#9888A0', o: 0.11 },
    { x: '61%', y: '33%', s: 52, c: '#B8A068', o: 0.09 },
    { x: '49%', y: '23%', s: 22, c: '#B88870', o: 0.20 },
    { x: '53%', y: '42%', s: 18, c: '#789090', o: 0.08 },
    { x: '40%', y: '22%', s: 30, c: '#B8A068', o: 0.14 },
    // behind/around menu box
    { x: '34%', y: '58%', s: 48, c: '#B88870', o: 0.12 },
    { x: '63%', y: '55%', s: 34, c: '#9888A0', o: 0.10 },
    { x: '38%', y: '70%', s: 26, c: '#789090', o: 0.09 },
    { x: '59%', y: '68%', s: 42, c: '#B8A068', o: 0.08 },
    { x: '32%', y: '75%', s: 20, c: '#B88870', o: 0.07 },
    { x: '66%', y: '73%', s: 30, c: '#789090', o: 0.07 },
    { x: '50%', y: '80%', s: 24, c: '#9888A0', o: 0.06 },
  ];

  return (
    <div style={styles.screen}>
      {/* Organic decorative squares */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {deco.map((d, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: d.s,
            height: d.s,
            background: d.c,
            opacity: d.o,
            borderRadius: 4,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
      </div>

      <h1 style={styles.title}>YANTRA</h1>
      <p style={styles.subtitle}>the game</p>

      {view === 'home' && (
        <div style={styles.menuBox}>
          <button style={styles.btn} onClick={() => setView('new')}>Start New Game</button>
          <button style={styles.btn} onClick={() => setView('join')}>Join Game</button>
          <button style={styles.btnSecondary} onClick={() => navigate('/stats')}>Statistics</button>
          <button style={styles.btnSecondary} onClick={() => navigate('/rules')}>Rules</button>
        </div>
      )}

      {view === 'new' && (
        <div style={styles.menuBox}>
          <h2 style={styles.sectionTitle}>New Game</h2>
          <input
            style={styles.input}
            placeholder="Your username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <div style={styles.row}>
            {(['ranked', 'unranked'] as GameMode[]).map((m) => (
              <button
                key={m}
                style={{ ...styles.modeBtn, ...(mode === m ? styles.modeBtnActive : {}) }}
                onClick={() => setMode(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          <label style={styles.checkRow}>
            <input type="checkbox" checked={speedPlay} onChange={(e) => setSpeedPlay(e.target.checked)} />
            Speed Play (60s per turn)
          </label>
          <button style={styles.btn} onClick={handleCreate}>Create Game</button>
          <button style={styles.btnSecondary} onClick={() => setView('home')}>Back</button>
        </div>
      )}

      {view === 'join' && (
        <div style={styles.menuBox}>
          <h2 style={styles.sectionTitle}>Join Game</h2>
          <input
            style={styles.input}
            placeholder="Your username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <input
            style={{ ...styles.input, textTransform: 'uppercase', letterSpacing: '0.15em' }}
            placeholder="6-character code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button style={styles.btn} onClick={handleJoin}>Join</button>
          <button style={styles.btnSecondary} onClick={() => setView('home')}>Back</button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    background: '#F2EDD7',
    position: 'relative',
    overflow: 'hidden',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    letterSpacing: '0.2em',
    color: '#3B281B',
    zIndex: 1,
    fontFamily: "'Pixelify Sans', sans-serif",
    textShadow: '2px 2px 0px #C8B896',
  },
  subtitle: { color: '#A89878', letterSpacing: '0.3em', marginBottom: '2rem', zIndex: 1, fontSize: '0.85rem' },
  menuBox: {
    background: '#D6CEBC',
    borderRadius: 4,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: 340,
    zIndex: 1,
    border: '2px solid #A89878',
    boxShadow: '4px 4px 0px #A89878',
  },
  sectionTitle: { color: '#3B281B', marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 700, fontFamily: "'Pixelify Sans', sans-serif" },
  btn: {
    padding: '0.85rem',
    borderRadius: 4,
    border: '2px solid #4A6040',
    background: '#5E7A52',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '2px 2px 0px #4A6040',
  },
  btnSecondary: {
    padding: '0.75rem',
    borderRadius: 4,
    border: '2px solid #A89878',
    background: 'transparent',
    color: '#7A6A52',
    fontWeight: 500,
    fontSize: '0.9rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  input: {
    padding: '0.75rem',
    borderRadius: 4,
    border: '2px solid #A89878',
    background: '#EDE4CC',
    color: '#3B281B',
    fontSize: '1rem',
    outline: 'none',
    fontFamily: 'inherit',
  },
  row: { display: 'flex', gap: '0.5rem' },
  modeBtn: {
    flex: 1,
    padding: '0.6rem',
    borderRadius: 4,
    border: '2px solid #A89878',
    background: '#EDE4CC',
    color: '#7A6A52',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
  },
  modeBtnActive: {
    background: '#B8AD9A',
    color: '#3B281B',
    border: '2px solid #7A6A52',
    fontWeight: 600,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#7A6A52',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};
