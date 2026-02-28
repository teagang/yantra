import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.js';
import { useSocket } from '../hooks/useSocket.js';
import { getSocket } from '../hooks/useSocket.js';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { gameId, joinCode, lobbyPlayers, username, playerId } = useGameStore();
  const socket = useSocket();

  useEffect(() => {
    // Navigate when game starts
    const handleStarted = () => {
      navigate(`/game/${gameId}`);
    };
    socket.on('game:started', handleStarted);
    return () => { socket.off('game:started', handleStarted); };
  }, [gameId, navigate, socket]);

  function handleStart() {
    socket.emit('start:game', { gameId });
  }

  const isHost = lobbyPlayers[0]?.username === username;

  return (
    <div style={styles.screen}>
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

const styles: Record<string, React.CSSProperties> = {
  screen: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '2rem 1rem',
    gap: '1.5rem',
    backgroundColor: '#F2EDD7',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='2' y='2' width='20' height='20' rx='2' fill='%23B88870' opacity='0.07'/%3E%3Crect x='26' y='2' width='20' height='20' rx='2' fill='%23789090' opacity='0.06'/%3E%3Crect x='2' y='26' width='20' height='20' rx='2' fill='%23B8A068' opacity='0.07'/%3E%3Crect x='26' y='26' width='20' height='20' rx='2' fill='%239888A0' opacity='0.06'/%3E%3C/svg%3E\")",
  },
  title: { color: '#3B281B', fontSize: '1.5rem', fontWeight: 700, fontFamily: "'Pixelify Sans', sans-serif" },
  codeBox: {
    background: '#EDE4CC',
    borderRadius: 4,
    padding: '1rem 2rem',
    textAlign: 'center',
    border: '2px solid #C8B896',
    boxShadow: '3px 3px 0px #C8B896',
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
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid #A89878',
    color: '#7A6A52',
    padding: '0.6rem 1.5rem',
    borderRadius: 4,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
