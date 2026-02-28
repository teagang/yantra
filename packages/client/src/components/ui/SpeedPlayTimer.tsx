import { useGameStore } from '../../store/gameStore.js';

export function SpeedPlayTimer() {
  const { speedPlaySecondsLeft, gameState, playerId } = useGameStore();
  if (!gameState?.speedPlay) return null;

  const currentPlayer = gameState.players[gameState.currentTurnIndex];
  const isMyTurn = currentPlayer?.playerId === playerId;
  const pct = (speedPlaySecondsLeft / gameState.speedPlaySeconds) * 100;
  const urgent = speedPlaySecondsLeft <= 10;

  return (
    <div style={styles.wrap}>
      <div
        style={{
          ...styles.bar,
          width: `${pct}%`,
          background: urgent ? '#A75B47' : '#C8A840',
          transition: 'width 1s linear, background 0.3s',
        }}
      />
      <span style={{ ...styles.label, color: urgent ? '#A75B47' : '#B07820' }}>
        {isMyTurn ? `Your turn: ${speedPlaySecondsLeft}s` : `${currentPlayer?.username}: ${speedPlaySecondsLeft}s`}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    height: 6,
    background: '#D4C4A0',
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    margin: '0 0.5rem',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: 3,
  },
  label: {
    position: 'absolute',
    right: 4,
    top: -18,
    fontSize: '0.7rem',
    fontWeight: 600,
  },
};
