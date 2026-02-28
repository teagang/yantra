import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.js';
import { useSocket } from '../hooks/useSocket.js';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { gameId, joinCode, lobbyPlayers, username, playerId } = useGameStore();
  const gameState = useGameStore((s) => s.gameState);
  const socket = useSocket();

  // Navigate to game when the global handler sets gameState (game:started)
  useEffect(() => {
    if (gameState && gameId) navigate(`/game/${gameId}`);
  }, [gameState, gameId, navigate]);

  function handleStart() {
    socket.emit('start:game', { gameId });
  }

  const isHost = lobbyPlayers[0]?.username === username;

  return (
    <div style={styles.screen}>
      {/* Decorative squares (same as landing page) */}
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

      <h1 style={styles.title}>Waiting Room</h1>

      <div style={styles.codeBox}>
        <p style={styles.codeLabel}>Share this code</p>
        <p style={styles.code}>{joinCode}</p>
      </div>

      <div style={styles.playerList}>
        <p style={styles.listLabel}>Players ({lobbyPlayers.length}/4)</p>
        {lobbyPlayers.map((p, i) => (
          <div key={i} style={styles.playerRow}>
            <span style={{ ...styles.dot, background: ['#B55B4A', '#4D7A8E', '#C8A840', '#7A6A96'][i % 4] }} />
            <span style={styles.playerName}>{p.username}</span>
            {i === 0 && <span style={styles.hostBadge}>host</span>}
          </div>
        ))}
        {lobbyPlayers.length < 2 && (
          <p style={styles.waiting}>Waiting for more players…</p>
        )}
      </div>

      {isHost && lobbyPlayers.length >= 2 && (
        <button style={styles.startBtn} onClick={handleStart}>
          Start Game
        </button>
      )}

      <button style={styles.backBtn} onClick={() => navigate('/')}>
        Leave
      </button>
    </div>
  );
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

const styles: Record<string, React.CSSProperties> = {
  screen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    gap: '1.5rem',
    background: '#F2EDD7',
    position: 'relative',
    overflow: 'hidden',
  },
  title: { color: '#3B281B', fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Pixelify Sans', sans-serif", zIndex: 1 },
  codeBox: {
    background: '#EDE4CC',
    borderRadius: 4,
    padding: '1rem 2rem',
    textAlign: 'center',
    border: '2px solid #C8B896',
    boxShadow: '3px 3px 0px #C8B896',
    zIndex: 1,
  },
  codeLabel: { color: '#7A6A52', fontSize: '0.8rem', marginBottom: '0.25rem' },
  code: { fontSize: '2.5rem', fontWeight: 300, letterSpacing: '0.3em', color: '#3B281B', fontFamily: "'DM Sans', system-ui, sans-serif" },
  playerList: {
    width: '100%',
    maxWidth: 340,
    background: '#EDE4CC',
    borderRadius: 4,
    padding: '1rem',
    border: '2px solid #C8B896',
    zIndex: 1,
  },
  listLabel: { color: '#7A6A52', fontSize: '0.85rem', marginBottom: '0.75rem' },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid #A8987866',
  },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  playerName: { flex: 1, color: '#3B281B', fontWeight: 500 },
  hostBadge: {
    background: '#B8A06833',
    color: '#7A6A52',
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: 3,
  },
  waiting: { color: '#A89878', fontSize: '0.85rem', marginTop: '0.5rem', fontStyle: 'italic' },
  startBtn: {
    width: '100%',
    maxWidth: 340,
    padding: '1rem',
    borderRadius: 4,
    border: '2px solid #4A6040',
    background: '#5E7A52',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1.1rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '3px 3px 0px #4A6040',
    zIndex: 1,
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #A89878',
    color: '#7A6A52',
    padding: '0.6rem 1.5rem',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
    zIndex: 1,
  },
};
