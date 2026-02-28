import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.js';
import { useSocket } from '../hooks/useSocket.js';
import { useGame } from '../hooks/useGame.js';
import { Board } from '../components/board/Board.js';
import { TileRack } from '../components/rack/TileRack.js';
import { ScorePanel } from '../components/ui/ScorePanel.js';
import { ActionBar } from '../components/ui/ActionBar.js';
import { PopupOverlay } from '../components/ui/PopupOverlay.js';
import { SpeedPlayTimer } from '../components/ui/SpeedPlayTimer.js';
import type { Tile, GamePlayer } from '@yantra/shared';

const SIDEBAR_W = 200;

export default function GamePage() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { gameState, hand, tilesRemaining, playerId, gameId } = useGameStore();
  const { resign } = useGame();
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const boardWrapRef = useRef<HTMLDivElement>(null);

  // Reconnect on mount if state missing
  useEffect(() => {
    if (!gameState && gameId && playerId) {
      socket.emit('request:state', { gameId, playerId });
    }
  }, [gameState, gameId, playerId, socket]);

  if (!gameState) {
    return <div style={styles.loading}><p>Loading game…</p></div>;
  }

  // Fit the board into the available centre space, leaving vertical padding
  const BOARD_V_PAD = 32;
  const centerW = window.innerWidth - SIDEBAR_W * 2;
  const centerH = window.innerHeight - BOARD_V_PAD * 2;
  const squareSize = Math.max(20, Math.floor(Math.min(centerW, centerH) / 15));

  const currentPlayer = gameState.players[gameState.currentTurnIndex] as GamePlayer & { playerId: string };
  const isMyTurn = currentPlayer?.playerId === playerId;

  return (
    <div style={styles.screen}>

      {/* ── Left sidebar ───────────────────────────────────────── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <span style={styles.logo}>YANTRA</span>
          <button style={styles.menuBtn} onClick={() => setShowMenu(v => !v)}>☰</button>
        </div>

        {showMenu && (
          <div style={styles.dropdown}>
            <button style={styles.dropItem} onClick={() => { navigate('/rules'); setShowMenu(false); }}>Rules</button>
            <button style={styles.dropItem} onClick={() => { if (confirm('Resign?')) { resign(); setShowMenu(false); } }}>Resign</button>
            <button style={styles.dropItem} onClick={() => { navigate('/'); setShowMenu(false); }}>Exit</button>
          </div>
        )}

        <ScorePanel
          players={gameState.players as (GamePlayer & { playerId: string })[]}
          currentTurnIndex={gameState.currentTurnIndex}
          myPlayerId={playerId}
          tilesRemaining={tilesRemaining}
        />
      </div>

      {/* ── Board ──────────────────────────────────────────────── */}
      <div ref={boardWrapRef} style={styles.boardWrap}>
        <Board
          board={gameState.board}
          squareSize={squareSize}
          selectedTile={selectedTile}
          onTileSelected={() => setSelectedTile(null)}
        />
      </div>

      {/* ── Right sidebar ──────────────────────────────────────── */}
      <div style={{ ...styles.sidebar, borderRight: 'none', borderLeft: '1px solid #D4C4A0' }}>
        <div style={styles.turnIndicator}>
          <span style={{ ...styles.turnDot, background: isMyTurn ? '#5E7A52' : '#8A9070' }} />
          <span style={{ color: isMyTurn ? '#5E7A52' : '#8A9070', fontWeight: 600, fontSize: '0.85rem' }}>
            {isMyTurn ? 'Your turn' : `${currentPlayer?.username}'s turn`}
          </span>
        </div>

        <SpeedPlayTimer />

        <div style={styles.rackLabel}>Your tiles</div>
        <div style={styles.rackWrap}>
          <TileRack
            hand={hand}
            selectedTile={selectedTile}
            onTileSelected={setSelectedTile}
          />
        </div>

        <ActionBar />
      </div>

      <PopupOverlay />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: '#D4CCBA',
  },
  sidebar: {
    width: SIDEBAR_W,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem 0.75rem',
    gap: '0.75rem',
    borderRight: '1px solid #D4C4A0',
    overflowY: 'auto',
    background: '#EDE8D8',
  },
  sidebarTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logo: {
    color: '#3B281B',
    fontWeight: 700,
    fontSize: '1rem',
    letterSpacing: '0.15em',
    fontFamily: "'Pixelify Sans', sans-serif",
  },
  menuBtn: {
    background: 'transparent',
    border: 'none',
    color: '#A89878',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '0.2rem 0.4rem',
    borderRadius: 4,
  },
  dropdown: {
    background: '#EDE8D8',
    border: '2px solid #A89878',
    borderRadius: 4,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '3px 3px 0px #A89878',
  },
  dropItem: {
    padding: '0.6rem 0.75rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #A8987866',
    color: '#3B281B',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
  },
  boardWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#D4CCBA',
  },
  turnIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  turnDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  rackLabel: {
    color: '#A89878',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginTop: 4,
  },
  rackWrap: {
    flex: 1,
  },
  loading: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#A89878',
    background: '#D4CCBA',
  },
};
