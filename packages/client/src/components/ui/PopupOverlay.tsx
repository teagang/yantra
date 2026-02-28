import { useGameStore } from '../../store/gameStore.js';

export function PopupOverlay() {
  const { popup, dismissPopup } = useGameStore();
  if (!popup.type) return null;

  const config = {
    win: { title: 'You Won!', bg: '#5E7A52', emoji: '🏆' },
    loss: { title: 'You Lost', bg: '#A75B47', emoji: '😔' },
    draw: { title: 'Draw!', bg: '#4D7A8E', emoji: '🤝' },
    invalid: { title: 'Invalid Move', bg: '#A75B47', emoji: '⚠️' },
    'speed-bonus': { title: `+${popup.bonusPoints} Speed Bonus!`, bg: '#C8A840', emoji: '⚡' },
  }[popup.type];

  if (!config) return null;

  return (
    <div style={styles.overlay} onClick={dismissPopup}>
      <div
        style={{ ...styles.card, borderColor: config.bg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.emoji}>{config.emoji}</div>
        <h2 style={{ ...styles.title, color: config.bg }}>{config.title}</h2>

        {popup.newRating !== undefined && (
          <p style={styles.rating}>New rating: <strong>{popup.newRating}</strong></p>
        )}

        {popup.reason && (
          <p style={styles.reason}>{popup.reason}</p>
        )}

        <button style={{ ...styles.btn, background: config.bg }} onClick={dismissPopup}>
          {popup.type === 'invalid' ? 'OK' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: '#3B281B88',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    background: '#D6CEBC',
    borderRadius: 4,
    border: '2px solid',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    maxWidth: 280,
    width: '90%',
    boxShadow: '4px 4px 0px #A89878',
  },
  emoji: { fontSize: '3rem' },
  title: { fontWeight: 700, fontSize: '1.5rem' },
  rating: { color: '#7A6A52', fontSize: '0.9rem' },
  reason: { color: '#A89878', fontSize: '0.85rem', textAlign: 'center' },
  btn: {
    marginTop: 8,
    padding: '0.75rem 2rem',
    borderRadius: 4,
    border: '2px solid #3B281B44',
    color: '#fff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '2px 2px 0px #3B281B44',
  },
};
