import { useGameStore } from '../../store/gameStore.js';
import { useGame } from '../../hooks/useGame.js';

export function ActionBar() {
  const { pendingPlacements, swapMode, selectedForSwap, previewScore, previewValid, previewReason } =
    useGameStore();
  const { submitMove, skipTurn, swapTiles, undoAll, isMyTurn } = useGame();
  const myTurn = isMyTurn();

  if (!myTurn) return null;

  if (swapMode) {
    return (
      <div style={styles.bar}>
        <p style={styles.hint}>Tap tiles to select for swap</p>
        <div style={styles.btnRow}>
          <button style={{ ...styles.btn, flex: 1, opacity: selectedForSwap.length === 0 ? 0.5 : 1 }} onClick={swapTiles} disabled={selectedForSwap.length === 0}>
            Swap ({selectedForSwap.length})
          </button>
          <button
            style={{ ...styles.btnSecondary, flex: 1 }}
            onClick={() => useGameStore.getState().setSwapMode(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.bar}>
      <div style={styles.btnRow}>
        {pendingPlacements.length > 0 ? (
          <>
            {/* Score preview inline */}
            <div style={styles.preview}>
              {previewValid ? (
                <span style={styles.previewScore}>+{previewScore?.finalScore ?? '…'}</span>
              ) : (
                <span style={styles.previewInvalid}>{previewReason || 'Invalid'}</span>
              )}
            </div>
            <button
              style={{ ...styles.btn, flex: 1, background: previewValid ? '#5E7A52' : '#C8B896', color: previewValid ? '#fff' : '#A89878', border: previewValid ? '2px solid #4A6040' : '2px solid #A89878', boxShadow: previewValid ? '2px 2px 0px #4A6040' : 'none' }}
              onClick={submitMove}
              disabled={!previewValid}
            >
              Submit
            </button>
            <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={undoAll}>
              Undo
            </button>
          </>
        ) : (
          <>
            <button style={{ ...styles.btnSecondary, flex: 1 }} onClick={skipTurn}>
              Skip
            </button>
            <button
              style={{ ...styles.btnSecondary, flex: 1 }}
              onClick={() => useGameStore.getState().setSwapMode(true)}
            >
              Swap Tiles
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginTop: 4,
  },
  hint: { color: '#A89878', fontSize: '0.75rem', margin: 0 },
  preview: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  previewScore: { color: '#5E7A52', fontWeight: 700, fontSize: '0.85rem' },
  previewInvalid: { color: '#A75B47', fontSize: '0.7rem', lineHeight: 1.2, maxWidth: 80 },
  btnRow: { display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'center' },
  btn: {
    padding: '0.45rem 0.5rem',
    borderRadius: 4,
    border: '2px solid #4A6040',
    background: '#5E7A52',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '2px 2px 0px #4A6040',
  },
  btnSecondary: {
    padding: '0.45rem 0.5rem',
    borderRadius: 4,
    border: '1px solid #A89878',
    background: 'transparent',
    color: '#7A6A52',
    fontWeight: 500,
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
