import { useNavigate } from 'react-router-dom';

const deco = [
  { x: '43%', y: '27%', s: 44, c: '#B88870', o: 0.18 },
  { x: '56%', y: '30%', s: 28, c: '#789090', o: 0.13 },
  { x: '37%', y: '36%', s: 36, c: '#9888A0', o: 0.11 },
  { x: '61%', y: '33%', s: 52, c: '#B8A068', o: 0.09 },
  { x: '49%', y: '23%', s: 22, c: '#B88870', o: 0.20 },
  { x: '53%', y: '42%', s: 18, c: '#789090', o: 0.08 },
  { x: '40%', y: '22%', s: 30, c: '#B8A068', o: 0.14 },
  { x: '34%', y: '58%', s: 48, c: '#B88870', o: 0.12 },
  { x: '63%', y: '55%', s: 34, c: '#9888A0', o: 0.10 },
  { x: '38%', y: '70%', s: 26, c: '#789090', o: 0.09 },
  { x: '59%', y: '68%', s: 42, c: '#B8A068', o: 0.08 },
  { x: '32%', y: '75%', s: 20, c: '#B88870', o: 0.07 },
  { x: '66%', y: '73%', s: 30, c: '#789090', o: 0.07 },
  { x: '50%', y: '80%', s: 24, c: '#9888A0', o: 0.06 },
  { x: '8%',  y: '18%', s: 52, c: '#B8A068', o: 0.11 },
  { x: '5%',  y: '45%', s: 38, c: '#789090', o: 0.09 },
  { x: '12%', y: '68%', s: 28, c: '#B88870', o: 0.08 },
  { x: '18%', y: '85%', s: 44, c: '#9888A0', o: 0.07 },
  { x: '22%', y: '10%', s: 20, c: '#789090', o: 0.10 },
  { x: '88%', y: '15%', s: 40, c: '#9888A0', o: 0.10 },
  { x: '92%', y: '42%', s: 30, c: '#B88870', o: 0.09 },
  { x: '85%', y: '62%', s: 48, c: '#789090', o: 0.08 },
  { x: '78%', y: '82%', s: 22, c: '#B8A068', o: 0.07 },
  { x: '72%', y: '10%', s: 34, c: '#B88870', o: 0.10 },
  { x: '30%', y: '5%',  s: 32, c: '#B8A068', o: 0.09 },
  { x: '60%', y: '8%',  s: 20, c: '#789090', o: 0.11 },
  { x: '45%', y: '92%', s: 36, c: '#B88870', o: 0.06 },
  { x: '75%', y: '95%', s: 24, c: '#9888A0', o: 0.07 },
];

export default function RulesPage() {
  const navigate = useNavigate();

  return (
    <div style={styles.screen}>
      {/* Fixed decorative background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {deco.map((d, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: d.x, top: d.y,
            width: d.s, height: d.s,
            background: d.c, opacity: d.o,
            borderRadius: 4,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
      </div>

      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate(-1)}>← Back</button>
        <h1 style={styles.title}>Rules</h1>
      </div>

      <div style={styles.content}>

        <Section title="Overview">
          Yantra is a tile-placement game for 2–4 players. Take turns placing tiles on the board
          to form valid sequences and score points. The player with the highest score when the
          game ends wins.
        </Section>

        <Section title="Tiles">
          86 tiles total: 4 colours (red, blue, yellow, purple) with values 1–7, plus 4 blank
          tiles and 2 eight-tiles. Each player holds 7 tiles and draws back up to 7 after each turn.
          Lower-value tiles are more common than higher-value ones.
        </Section>

        <Section title="The Board">
          A diamond-shaped grid. Booster squares multiply your score — only new tiles trigger them:
          <ul style={styles.ul}>
            <li><strong style={{ color: '#4D7A42' }}>2×</strong> / <strong style={{ color: '#2E5230' }}>3×</strong> — multiply that single tile's value</li>
            <li><strong style={{ color: '#8E5A52' }}>D</strong> / <strong style={{ color: '#7A3830' }}>T</strong> — double or triple the whole sequence total</li>
            <li><strong style={{ color: '#B07820' }}>★</strong> centre star — doubles the sequence (first play only)</li>
          </ul>
        </Section>

        <Section title="Valid Sequences">
          Every group of tiles you place must form one of:
          <ul style={styles.ul}>
            <li>Consecutive numbers in <strong>one colour</strong> — e.g. red 3-4-5</li>
            <li>The <strong>same number</strong> in any colours — e.g. four 6s</li>
          </ul>
          New tiles must connect to existing tiles on the board and must form a valid sequence
          in every line they touch.
        </Section>

        <Section title="Special Tiles">
          <strong>Blank</strong> — substitutes for any missing number in a sequence. You can
          spend a turn to swap a blank on the board for the real tile it represents.
          <br /><br />
          <strong>Eight</strong> — extends any sequence that already contains a 7.
        </Section>

        <Section title="Scoring">
          Add up the values of the tiles you placed, multiplied by any boosters they land on.
          <br /><br />
          Bonuses (stack if both apply):
          <ul style={styles.ul}>
            <li><strong>+20</strong> for playing all 7 tiles in one turn</li>
            <li><strong>+20</strong> for a 7-tile consecutive sequence</li>
          </ul>
        </Section>

        <Section title="Your Turn">
          Choose one of:
          <ul style={styles.ul}>
            <li><strong>Place</strong> — play one or more tiles, then draw back to 7</li>
            <li><strong>Swap</strong> — discard any tiles and draw the same number of new ones</li>
            <li><strong>Skip</strong> — pass your turn</li>
          </ul>
        </Section>

        <Section title="End of Game">
          The game ends when a player uses their last tile, or all players pass twice in a row.
          <ul style={styles.ul}>
            <li>Player who finishes: gains the sum of all opponents' remaining tile values</li>
            <li>All others: lose the sum of their own remaining tile values</li>
            <li>If no one finishes: everyone loses their remaining tile values</li>
          </ul>
        </Section>

        <Section title="Speed Play">
          Each turn has a 60-second timer. If time runs out before you play, your opponent
          receives +5 bonus points.
        </Section>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h2 style={{ fontFamily: "'Pixelify Sans', sans-serif", color: '#3B281B', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
        {title}
      </h2>
      <div style={{ color: '#5A4A38', fontSize: '0.9rem', lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    height: '100%',
    overflowY: 'auto',
    background: '#F2EDD7',
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '1rem',
    borderBottom: '1px solid #D4C4A0',
    position: 'sticky',
    top: 0,
    background: 'rgba(242, 237, 215, 0.92)',
    backdropFilter: 'blur(4px)',
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
    position: 'relative',
    zIndex: 1,
  },
  ul: { paddingLeft: '1.2rem', marginTop: '0.4rem' },
};
