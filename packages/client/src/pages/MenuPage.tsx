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

  const deco = [
    // around title
    { x: '43%', y: '27%', s: 44, c: '#B88870', o: 0.18 },
    { x: '56%', y: '30%', s: 28, c: '#789090', o: 0.13 },
    { x: '37%', y: '36%', s: 36, c: '#9888A0', o: 0.11 },
    { x: '61%', y: '33%', s: 52, c: '#B8A068', o: 0.09 },
    { x: '49%', y: '23%', s: 22, c: '#B88870', o: 0.20 },
    { x: '53%', y: '42%', s: 18, c: '#789090', o: 0.08 },
    { x: '40%', y: '22%', s: 30, c: '#B8A068', o: 0.14 },
    // around menu
    { x: '34%', y: '58%', s: 48, c: '#B88870', o: 0.12 },
    { x: '63%', y: '55%', s: 34, c: '#9888A0', o: 0.10 },
    { x: '38%', y: '70%', s: 26, c: '#789090', o: 0.09 },
    { x: '59%', y: '68%', s: 42, c: '#B8A068', o: 0.08 },
    { x: '32%', y: '75%', s: 20, c: '#B88870', o: 0.07 },
    { x: '66%', y: '73%', s: 30, c: '#789090', o: 0.07 },
    { x: '50%', y: '80%', s: 24, c: '#9888A0', o: 0.06 },
    // left edge
    { x: '8%',  y: '18%', s: 52, c: '#B8A068', o: 0.11 },
    { x: '5%',  y: '45%', s: 38, c: '#789090', o: 0.09 },
    { x: '12%', y: '68%', s: 28, c: '#B88870', o: 0.08 },
    { x: '18%', y: '85%', s: 44, c: '#9888A0', o: 0.07 },
    { x: '22%', y: '10%', s: 20, c: '#789090', o: 0.10 },
    { x: '15%', y: '52%', s: 16, c: '#B8A068', o: 0.07 },
    // right edge
    { x: '88%', y: '15%', s: 40, c: '#9888A0', o: 0.10 },
    { x: '92%', y: '42%', s: 30, c: '#B88870', o: 0.09 },
    { x: '85%', y: '62%', s: 48, c: '#789090', o: 0.08 },
    { x: '78%', y: '82%', s: 22, c: '#B8A068', o: 0.07 },
    { x: '72%', y: '10%', s: 34, c: '#B88870', o: 0.10 },
    { x: '94%', y: '75%', s: 26, c: '#9888A0', o: 0.06 },
    // top / bottom extras
    { x: '30%', y: '5%',  s: 32, c: '#B8A068', o: 0.09 },
    { x: '60%', y: '8%',  s: 20, c: '#789090', o: 0.11 },
    { x: '45%', y: '92%', s: 36, c: '#B88870', o: 0.06 },
    { x: '75%', y: '95%', s: 24, c: '#9888A0', o: 0.07 },
  ];

  return (
    <div style={styles.screen}>
      <style>{`
        .y-btn {
          padding: 0.85rem;
          border-radius: 4px;
          border: 2px solid #4A6040;
          background: transparent;
          color: #3B281B;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          font-family: inherit;
          width: 100%;
          transition: background 0.15s, color 0.15s;
          letter-spacing: 0.02em;
        }
        .y-btn:hover { background: #3A4E32; color: #fff; border-color: #3A4E32; }
        .y-btn-primary { background: rgba(94, 122, 82, 0.32); font-weight: 700; }
        .y-btn-primary:hover { background: #3A4E32; color: #fff; border-color: #3A4E32; }
        .y-btn-sm {
          padding: 0.75rem;
          border-radius: 4px;
          border: 2px solid #4A6040;
          background: transparent;
          color: #3B281B;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          font-family: inherit;
          width: 100%;
          transition: background 0.15s, color 0.15s;
        }
        .y-btn-sm:hover { background: #3A4E32; color: #fff; border-color: #3A4E32; }
      `}</style>

      {/* Decorative squares */}
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
          <button className="y-btn y-btn-primary" onClick={() => setView('new')}>New Game</button>
          <button className="y-btn" onClick={() => setView('join')}>Join Game</button>
          <button className="y-btn" onClick={() => navigate('/stats')}>Statistics</button>
          <button className="y-btn" onClick={() => navigate('/rules')}>Rules</button>
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
          <button className="y-btn y-btn-primary" onClick={handleCreate}>Create Game</button>
          <button className="y-btn-sm" onClick={() => setView('home')}>Back</button>
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
          <button className="y-btn y-btn-primary" onClick={handleJoin}>Join</button>
          <button className="y-btn-sm" onClick={() => setView('home')}>Back</button>
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
    borderRadius: 4,
    padding: '0.5rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: 300,
    zIndex: 1,
  },
  sectionTitle: { color: '#3B281B', marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 700, fontFamily: "'Pixelify Sans', sans-serif" },
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
    background: 'transparent',
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
