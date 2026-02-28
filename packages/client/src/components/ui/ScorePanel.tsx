import type { GamePlayer } from '@yantra/shared';

interface Props {
  players: (GamePlayer & { playerId: string })[];
  currentTurnIndex: number;
  myPlayerId: string;
  tilesRemaining: number;
}

const PLAYER_COLOURS = ['#B88870', '#789090', '#B8A068', '#9888A0'];

export function ScorePanel({ players, currentTurnIndex, myPlayerId, tilesRemaining }: Props) {
  return (
    <div style={styles.panel}>
      {players.map((p, i) => {
        const isActive = i === currentTurnIndex;
        const isMe = p.playerId === myPlayerId;
        return (
          <div
            key={p.playerId}
            style={{
              ...styles.playerCard,
              borderColor: isActive ? PLAYER_COLOURS[i] : '#C8B89666',
              background: isActive ? `${PLAYER_COLOURS[i]}22` : 'transparent',
            }}
          >
            <div style={{ ...styles.dot, background: PLAYER_COLOURS[i] }} />
            <div style={styles.info}>
              <span style={{ ...styles.name, color: isMe ? '#B07820' : '#3B281B' }}>
                {p.username}{isMe ? ' (you)' : ''}
              </span>
              {isActive && (
                <span style={{ ...styles.turnBadge, color: isMe ? '#5E7A52' : '#A89878' }}>
                  {isMe ? '▶ your turn' : '▶ their turn'}
                </span>
              )}
            </div>
            <span style={styles.score}>{p.score}</span>
          </div>
        );
      })}
      <div style={styles.pool}>
        <span style={styles.poolLabel}>Tiles left</span>
        <span style={styles.poolCount}>{tilesRemaining}</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '0.75rem',
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.5rem 0.75rem',
    borderRadius: 3,
    border: '1px solid',
    transition: 'border-color 0.2s, background 0.2s',
  },
  dot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  info: { flex: 1, display: 'flex', flexDirection: 'column' },
  name: { fontWeight: 500, fontSize: '0.85rem' },
  turnBadge: { fontSize: '0.65rem', color: '#aaa' },
  score: { fontWeight: 700, fontSize: '1.1rem', color: '#3B281B' },
  pool: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.4rem 0.75rem',
    marginTop: 2,
    borderTop: '1px solid #C8B89666',
  },
  poolLabel: { color: '#A89878', fontSize: '0.8rem' },
  poolCount: { color: '#7A6A52', fontWeight: 600 },
};
