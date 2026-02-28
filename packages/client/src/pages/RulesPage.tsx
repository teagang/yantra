import { useNavigate } from 'react-router-dom';

export default function RulesPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.screen}>
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 style={styles.title}>Rules</h1>
      </div>

      <div style={styles.content}>
        <Section title="Overview">
          Yantra is a tile-based board game for 2–4 players. Players hold 7 tiles at a time and take
          turns placing sequences on the board to score points.
        </Section>

        <Section title="The Board">
          The circular board has 167 playing squares and 37 booster squares. The centre star
          doubles the value of the first sequence played on it. Booster squares:
          <ul style={styles.ul}>
            <li><strong style={{ color: '#4D7A42' }}>2×</strong> — doubles the covering tile's value</li>
            <li><strong style={{ color: '#2E5230' }}>3×</strong> — triples the covering tile's value</li>
            <li><strong style={{ color: '#8E5A52' }}>D</strong> — doubles the sequence total</li>
            <li><strong style={{ color: '#7A3830' }}>T</strong> — triples the sequence total</li>
            <li><strong style={{ color: '#B07820' }}>★</strong> — doubles the sequence total (first play only)</li>
          </ul>
        </Section>

        <Section title="The Tiles">
          86 tiles total: 4 colours (red, blue, yellow, purple), each with values 1–7 (20 per colour),
          plus 4 blank tiles and 2 eight-tiles.
          <br /><br />
          Tile counts per value: 1×6, 2×4, 3×3, 4×2, 5×2, 6×2, 7×1.
        </Section>

        <Section title="Valid Sequences">
          A sequence must be either:
          <ul style={styles.ul}>
            <li>Ascending or descending consecutive numbers (1-2-3…) in <strong>one colour</strong></li>
            <li>All the <strong>same number</strong> in any mix of colours</li>
          </ul>
          The 8-tile can extend any sequence containing a 7.
          Blank tiles can fill a missing number in a sequence.
        </Section>

        <Section title="Scoring">
          Score = sum of tile values in the sequence, modified by any booster squares the NEW tiles
          cover. Bonuses:
          <ul style={styles.ul}>
            <li>+20 pts for using all 7 tiles in one turn</li>
            <li>+20 pts for a 7-tile numerical sequence</li>
            <li>+40 pts total if both bonuses apply</li>
          </ul>
        </Section>

        <Section title="Turn">
          On your turn: place tiles, then refill your hand back to 7. Instead of placing, you may
          skip your turn or swap any number of tiles (costs your turn).
        </Section>

        <Section title="Blank Tiles">
          Play a blank as any missing number to complete a sequence. Blanks used at intersections
          become locked. You may spend a turn to swap a blank on the board for the tile it represents.
        </Section>

        <Section title="End of Game">
          The game ends when a player uses their last tile, or all players pass twice in a row.
          <ul style={styles.ul}>
            <li>Finishing player: adds remaining tile values from all opponents to their score</li>
            <li>Opponents: subtract their remaining tile values from their score</li>
            <li>If no one finishes: all players subtract their remaining tile values</li>
          </ul>
          Highest total wins.
        </Section>

        <Section title="Speed Play">
          With Speed Play enabled, each player has 60 seconds per turn. If time runs out, the opponent
          receives +5 bonus points.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: "'Pixelify Sans', sans-serif", color: '#3B281B', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
        {title}
      </h2>
      <div style={{ color: '#5A4A38', fontSize: '0.9rem', lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    height: '100%',
    overflowY: 'auto',
    backgroundColor: '#F2EDD7',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='2' y='2' width='20' height='20' rx='2' fill='%23B88870' opacity='0.07'/%3E%3Crect x='26' y='2' width='20' height='20' rx='2' fill='%23789090' opacity='0.06'/%3E%3Crect x='2' y='26' width='20' height='20' rx='2' fill='%23B8A068' opacity='0.07'/%3E%3Crect x='26' y='26' width='20' height='20' rx='2' fill='%239888A0' opacity='0.06'/%3E%3C/svg%3E\")",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '1rem',
    borderBottom: '1px solid #D4C4A0',
    position: 'sticky',
    top: 0,
    backgroundColor: '#EDE4CC',
    zIndex: 5,
  },
  back: {
    background: 'transparent',
    border: 'none',
    color: '#7A6A52',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  },
  title: {
    color: '#3B281B',
    fontWeight: 700,
    fontSize: '1.3rem',
    fontFamily: "'Pixelify Sans', sans-serif",
  },
  content: {
    padding: '1.5rem 1rem',
    maxWidth: 600,
    margin: '0 auto',
  },
  ul: { paddingLeft: '1.2rem', marginTop: '0.4rem' },
};
