import type { TileColour } from '@yantra/shared';

const COLOURS: { label: string; value: TileColour; bg: string }[] = [
  { label: 'Red', value: 'red', bg: '#B88870' },
  { label: 'Blue', value: 'blue', bg: '#789090' },
  { label: 'Yellow', value: 'yellow', bg: '#B8A068' },
  { label: 'Purple', value: 'purple', bg: '#9888A0' },
];

interface Props {
  onPick: (value: number, colour: TileColour) => void;
  onCancel: () => void;
}

export function BlankTilePicker({ onPick, onCancel }: Props) {
  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <h3 style={styles.title}>Assign Blank Tile</h3>
        <p style={styles.subtitle}>Pick a colour, then a value</p>
        {COLOURS.map((c) => (
          <div key={c.value} style={styles.colourRow}>
            <span style={{ ...styles.colourDot, background: c.bg }} />
            <span style={styles.colourLabel}>{c.label}</span>
            <div style={styles.values}>
              {[1, 2, 3, 4, 5, 6, 7].map((v) => (
                <button
                  key={v}
                  style={{ ...styles.valueBtn, background: c.bg }}
                  onClick={() => onPick(v, c.value)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
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
    zIndex: 90,
  },
  card: {
    background: '#EDE4CC',
    borderRadius: 4,
    border: '2px solid #A89878',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    maxWidth: 320,
    width: '90%',
    boxShadow: '4px 4px 0px #A89878',
  },
  title: {
    color: '#3B281B',
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    color: '#7A6A52',
    fontSize: '0.8rem',
    margin: 0,
  },
  colourRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  colourDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    flexShrink: 0,
  },
  colourLabel: {
    color: '#3B281B',
    fontSize: '0.8rem',
    fontWeight: 500,
    width: 48,
    flexShrink: 0,
  },
  values: {
    display: 'flex',
    gap: 4,
    flex: 1,
  },
  valueBtn: {
    width: 28,
    height: 28,
    borderRadius: 3,
    border: '1px solid #3B281B33',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  cancelBtn: {
    marginTop: 4,
    padding: '0.5rem',
    borderRadius: 4,
    border: '1px solid #A89878',
    background: 'transparent',
    color: '#7A6A52',
    fontWeight: 500,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
