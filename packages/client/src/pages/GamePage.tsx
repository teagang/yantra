import { useEffect, useMemo, useState } from 'react';
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
import { PixelPlant, PixelCoffee } from '../components/ui/Decorations.js';
import { isValidSquare } from '@yantra/shared';
import type { Tile, GamePlayer } from '@yantra/shared';

const SIDEBAR_W = 200;
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export default function GamePage() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { gameState, hand, tilesRemaining, playerId, gameId, joinCode } = useGameStore();
  const { resign } = useGame();
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = useIsMobile();

  // Reconnect on mount if state missing
  useEffect(() => {
    if (!gameState && gameId && playerId) {
      socket.emit('request:state', { gameId, playerId });
    }
  }, [gameState, gameId, playerId, socket]);

  if (!gameState) {
    return <div style={styles.loading}><p>Loading game…</p></div>;
  }

  const currentPlayer = gameState.players[gameState.currentTurnIndex] as GamePlayer & { playerId: string };
  const isMyTurn = currentPlayer?.playerId === playerId;

  // Board sizing — on mobile, cap so bottom bar stays visible
  const squareSize = isMobile
    ? (() => {
        const topBarH = 42;     // top bar
        const scoresH = 44;     // scores row
        const bottomBarH = 120; // rack + action buttons
        const padding = 16;
        const availH = window.innerHeight - topBarH - scoresH - bottomBarH - padding;
        const fromWidth = Math.floor((window.innerWidth - 16) / 15);
        const fromHeight = Math.floor(availH / 15);
        return Math.max(16, Math.min(fromWidth, fromHeight));
      })()
    : (() => {
        const BOARD_V_PAD = 32;
        const centerW = window.innerWidth - SIDEBAR_W * 2;
        const centerH = window.innerHeight - BOARD_V_PAD * 2;
        return Math.max(20, Math.floor(Math.min(centerW, centerH) / 15));
      })();

  if (isMobile) {
    return <MobileLayout
      gameState={gameState}
      currentPlayer={currentPlayer}
      isMyTurn={isMyTurn}
      squareSize={squareSize}
      selectedTile={selectedTile}
      setSelectedTile={setSelectedTile}
      hand={hand}
      tilesRemaining={tilesRemaining}
      playerId={playerId}
      joinCode={joinCode}
      navigate={navigate}
      resign={resign}
      showMenu={showMenu}
      setShowMenu={setShowMenu}
    />;
  }

  return <DesktopLayout
    gameState={gameState}
    currentPlayer={currentPlayer}
    isMyTurn={isMyTurn}
    squareSize={squareSize}
    selectedTile={selectedTile}
    setSelectedTile={setSelectedTile}
    hand={hand}
    tilesRemaining={tilesRemaining}
    playerId={playerId}
    joinCode={joinCode}
    navigate={navigate}
    resign={resign}
    showMenu={showMenu}
    setShowMenu={setShowMenu}
  />;
}

// Shared props type
interface LayoutProps {
  gameState: any;
  currentPlayer: GamePlayer & { playerId: string };
  isMyTurn: boolean;
  squareSize: number;
  selectedTile: Tile | null;
  setSelectedTile: (t: Tile | null) => void;
  hand: Tile[];
  tilesRemaining: number;
  playerId: string;
  joinCode: string;
  navigate: (path: string) => void;
  resign: () => void;
  showMenu: boolean;
  setShowMenu: (v: boolean | ((prev: boolean) => boolean)) => void;
}

function NoMovesBanner({ gameState, isMyTurn }: { gameState: any; isMyTurn: boolean }) {
  const hasPlacementSpots = useMemo(() => {
    const board = gameState.board;
    const hasAnyTile = Object.values(board).some((sq: any) => sq.placedTile);
    if (!hasAnyTile) return true;
    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const sq of Object.values(board) as any[]) {
      if (!sq.placedTile) continue;
      for (const [dr, dc] of dirs) {
        const nr = sq.row + dr;
        const nc = sq.col + dc;
        const k = `${nr},${nc}`;
        if (isValidSquare(nr, nc) && board[k] && !board[k].placedTile) return true;
      }
    }
    return false;
  }, [gameState.board]);

  const [dismissed, setDismissed] = useState(false);
  const turnIndex = gameState.currentTurnIndex;
  useEffect(() => { setDismissed(false); }, [turnIndex]);

  if (!isMyTurn || hasPlacementSpots || dismissed) return null;

  return (
    <div style={styles.noMovesBanner}>
      <span>No placement spots available. You can skip or swap tiles.</span>
      <button style={styles.noMovesDismiss} onClick={() => setDismissed(true)}>OK</button>
    </div>
  );
}

function DesktopLayout({ gameState, currentPlayer, isMyTurn, squareSize, selectedTile, setSelectedTile, hand, tilesRemaining, playerId, joinCode, navigate, resign, showMenu, setShowMenu }: LayoutProps) {
  return (
    <div style={styles.screen}>
      {/* Left sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <span style={styles.logo}>YANTRA</span>
          <button style={styles.menuBtn} onClick={() => setShowMenu((v: boolean) => !v)}>☰</button>
        </div>

        {showMenu && (
          <div style={styles.dropdown}>
            {joinCode && (
              <div style={styles.dropCodeItem}>
                <span style={{ color: '#7A6A52', fontSize: '0.75rem' }}>Room Code</span>
                <span style={{ color: '#3B281B', fontWeight: 700, letterSpacing: '0.15em', fontSize: '1rem' }}>{joinCode}</span>
              </div>
            )}
            <button style={styles.dropItem} onClick={() => { navigate('/rules'); setShowMenu(false); }}>Rules</button>
            <button style={styles.dropItem} onClick={() => { if (confirm('Resign this game?')) { resign(); setShowMenu(false); navigate('/'); } }}>Resign</button>
            <button style={styles.dropItem} onClick={() => { if (confirm('Leave this game?')) { navigate('/'); setShowMenu(false); } }}>Exit</button>
          </div>
        )}

        <ScorePanel
          players={gameState.players as (GamePlayer & { playerId: string })[]}
          currentTurnIndex={gameState.currentTurnIndex}
          myPlayerId={playerId}
          tilesRemaining={tilesRemaining}
        />

        {/* Cozy decorations (desktop only) */}
        <div style={styles.decoRow}>
          <PixelPlant />
          <PixelCoffee />
        </div>
      </div>

      {/* Board */}
      <div style={styles.boardWrap}>
        <Board
          board={gameState.board}
          squareSize={squareSize}
          selectedTile={selectedTile}
          onTileSelected={() => setSelectedTile(null)}
        />
      </div>

      {/* Right sidebar */}
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

      <NoMovesBanner gameState={gameState} isMyTurn={isMyTurn} />
      <PopupOverlay />
    </div>
  );
}

function MobileLayout({ gameState, currentPlayer, isMyTurn, squareSize, selectedTile, setSelectedTile, hand, tilesRemaining, playerId, joinCode, navigate, resign, showMenu, setShowMenu }: LayoutProps) {
  return (
    <div style={mobileStyles.screen}>
      {/* Top bar: player info + turn */}
      <div style={mobileStyles.topBar}>
        <div style={mobileStyles.topLeft}>
          <span style={styles.logo}>YANTRA</span>
          <button style={styles.menuBtn} onClick={() => setShowMenu((v: boolean) => !v)}>☰</button>
        </div>
        <div style={mobileStyles.turnInfo}>
          <span style={{ ...styles.turnDot, background: isMyTurn ? '#5E7A52' : '#8A9070' }} />
          <span style={{ color: isMyTurn ? '#5E7A52' : '#8A9070', fontWeight: 600, fontSize: '0.8rem' }}>
            {isMyTurn ? 'Your turn' : `${currentPlayer?.username}'s turn`}
          </span>
        </div>
      </div>

      {showMenu && (
        <div style={{ ...styles.dropdown, margin: '0 0.5rem', zIndex: 50 }}>
          {joinCode && (
            <div style={styles.dropCodeItem}>
              <span style={{ color: '#7A6A52', fontSize: '0.75rem' }}>Room Code</span>
              <span style={{ color: '#3B281B', fontWeight: 700, letterSpacing: '0.15em', fontSize: '1rem' }}>{joinCode}</span>
            </div>
          )}
          <button style={styles.dropItem} onClick={() => { navigate('/rules'); setShowMenu(false); }}>Rules</button>
          <button style={styles.dropItem} onClick={() => { if (confirm('Resign this game?')) { resign(); setShowMenu(false); navigate('/'); } }}>Resign</button>
          <button style={styles.dropItem} onClick={() => { if (confirm('Leave this game?')) { navigate('/'); setShowMenu(false); } }}>Exit</button>
        </div>
      )}

      {/* Player scores compact row */}
      <div style={mobileStyles.scoresRow}>
        {gameState.players.map((p: GamePlayer & { playerId: string }, i: number) => {
          const isActive = i === gameState.currentTurnIndex;
          const isMe = p.playerId === playerId;
          const dotColor = ['#B88870', '#789090', '#B8A068', '#9888A0'][i];
          return (
            <div key={p.playerId} style={{
              ...mobileStyles.scoreChip,
              borderColor: isActive ? dotColor : '#C8B89644',
              background: isActive ? `${dotColor}22` : 'transparent',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              <span style={{ fontSize: '0.75rem', color: isMe ? '#B07820' : '#3B281B', fontWeight: 500 }}>
                {p.username}{isMe ? '' : ''}
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#3B281B', marginLeft: 'auto' }}>{p.score}</span>
            </div>
          );
        })}
        <div style={mobileStyles.tilesLeft}>
          <span style={{ color: '#A89878', fontSize: '0.7rem' }}>Left</span>
          <span style={{ color: '#7A6A52', fontWeight: 600, fontSize: '0.8rem' }}>{tilesRemaining}</span>
        </div>
      </div>

      <SpeedPlayTimer />

      {/* Board centered */}
      <div style={mobileStyles.boardWrap}>
        <Board
          board={gameState.board}
          squareSize={squareSize}
          selectedTile={selectedTile}
          onTileSelected={() => setSelectedTile(null)}
        />
      </div>

      {/* Bottom: tiles + actions */}
      <div style={mobileStyles.bottomBar}>
        <TileRack
          hand={hand}
          selectedTile={selectedTile}
          onTileSelected={setSelectedTile}
        />
        <ActionBar />
      </div>

      <NoMovesBanner gameState={gameState} isMyTurn={isMyTurn} />
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
    background: '#EAE4D6',
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
    background: '#EAE4D6',
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
    background: '#EAE4D6',
    border: '2px solid #A89878',
    borderRadius: 4,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '3px 3px 0px #A89878',
  },
  dropCodeItem: {
    padding: '0.6rem 0.75rem',
    borderBottom: '1px solid #A8987866',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
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
    background: '#EAE4D6',
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
    background: '#EAE4D6',
  },
  noMovesBanner: {
    position: 'fixed',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#A75B47',
    color: '#fff',
    padding: '0.6rem 1.2rem',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.85rem',
    fontWeight: 500,
    zIndex: 100,
    boxShadow: '0 4px 12px #3B281B44',
  },
  noMovesDismiss: {
    background: '#fff3',
    border: 'none',
    color: '#fff',
    padding: '0.25rem 0.6rem',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: '0.8rem',
  },
  decoRow: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '0.25rem',
    marginTop: 'auto',
    opacity: 0.75,
    paddingBottom: '0.25rem',
  },
};

const mobileStyles: Record<string, React.CSSProperties> = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: '#EAE4D6',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.75rem',
    borderBottom: '1px solid #D4C4A0',
    flexShrink: 0,
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  turnInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  scoresRow: {
    display: 'flex',
    gap: 4,
    padding: '0.4rem 0.5rem',
    overflowX: 'auto',
    flexShrink: 0,
    alignItems: 'center',
  },
  scoreChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '0.25rem 0.5rem',
    borderRadius: 3,
    border: '1px solid',
    minWidth: 0,
    flexShrink: 0,
  },
  tilesLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 'auto',
    flexShrink: 0,
  },
  boardWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
    padding: '0.25rem',
  },
  bottomBar: {
    flexShrink: 0,
    borderTop: '1px solid #D4C4A0',
    padding: '0.35rem 0.5rem',
    background: '#EAE4D6',
  },
};
