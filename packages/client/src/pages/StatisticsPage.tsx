import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore.js';

interface LeaderboardEntry {
  username: string;
  rating: number;
  wins: number;
  draws: number;
  losses: number;
}

interface HistoryEntry {
  rating_before: number;
  rating_after: number;
  games: { join_code: string; status: string; mode: string; winner_id: string | null };
  created_at: string;
}

const SERVER = import.meta.env['VITE_SERVER_URL'] ?? 'http://localhost:3001';

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

export default function StatisticsPage() {
  const navigate = useNavigate();
  const { username } = useGameStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [profile, setProfile] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [lbRes, profileRes] = await Promise.all([
          fetch(`${SERVER}/api/leaderboard`),
          username ? fetch(`${SERVER}/api/players/${username}`) : Promise.resolve(null),
        ]);
        const lb = await lbRes.json();
        setLeaderboard(lb);

        if (profileRes) {
          const p = await profileRes.json();
          if (!p.error) {
            setProfile(p);
            const histRes = await fetch(`${SERVER}/api/players/${username}/history`);
            const hist = await histRes.json();
            setHistory(hist);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

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
        <button style={styles.back} onClick={() => navigate('/')}>← Back</button>
        <h1 style={styles.title}>Statistics</h1>
      </div>

      <div style={styles.body}>
        {profile && (
          <div style={styles.profileCard}>
            <div style={styles.profileName}>{profile.username}</div>
            <div style={styles.profileRating}>Rating: <strong>{profile.rating}</strong></div>
            <div style={styles.wdl}>
              <span style={{ color: '#5E7A52' }}>W {profile.wins}</span>
              <span style={{ color: '#A89878' }}>D {profile.draws}</span>
              <span style={{ color: '#A75B47' }}>L {profile.losses}</span>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Recent Games</h2>
            {history.map((h, i) => {
              const delta = h.rating_after - h.rating_before;
              return (
                <div key={i} style={styles.histRow}>
                  <span style={styles.gameCode}>{h.games?.join_code ?? '—'}</span>
                  <span style={{ ...styles.delta, color: delta >= 0 ? '#5E7A52' : '#A75B47' }}>
                    {delta >= 0 ? '+' : ''}{delta}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Leaderboard</h2>
          {loading && <p style={styles.loading}>Loading…</p>}
          {leaderboard.map((p, i) => (
            <div key={p.username} style={{ ...styles.lbRow, background: p.username === username ? '#B8A06822' : undefined }}>
              <span style={styles.rank}>{i + 1}</span>
              <span style={{ ...styles.lbName, color: p.username === username ? '#7A6A52' : '#3B281B', fontWeight: p.username === username ? 600 : 400 }}>
                {p.username}
              </span>
              <span style={styles.lbRating}>{p.rating}</span>
              <span style={styles.lbWdl}>{p.wins}-{p.draws}-{p.losses}</span>
            </div>
          ))}
        </div>
      </div>
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
  body: {
    padding: '0 0 2rem',
    position: 'relative',
    zIndex: 1,
  },
  profileCard: {
    margin: '1rem',
    background: 'rgba(237, 228, 204, 0.85)',
    borderRadius: 4,
    padding: '1rem',
    border: '2px solid #C8B896',
    boxShadow: '3px 3px 0px #C8B896',
  },
  profileName: {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#3B281B',
    fontFamily: "'Pixelify Sans', sans-serif",
  },
  profileRating: { color: '#7A6A52', fontSize: '0.9rem', margin: '4px 0' },
  wdl: { display: 'flex', gap: 16, fontSize: '0.9rem', fontWeight: 600, marginTop: 4 },
  section: { margin: '1rem' },
  sectionTitle: {
    color: '#A89878',
    fontSize: '0.75rem',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
    fontWeight: 600,
  },
  histRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.4rem 0.5rem',
    borderBottom: '1px solid #D4C4A066',
  },
  gameCode: { color: '#7A6A52', letterSpacing: '0.1em', fontWeight: 500 },
  delta: { fontWeight: 700 },
  loading: { color: '#A89878', fontSize: '0.9rem' },
  lbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0.5rem 0.75rem',
    borderRadius: 3,
    borderBottom: '1px solid #D4C4A066',
  },
  rank: { color: '#A89878', width: 24, fontSize: '0.85rem' },
  lbName: { flex: 1 },
  lbRating: { color: '#3B281B', fontWeight: 600, width: 50, textAlign: 'right' },
  lbWdl: { color: '#A89878', fontSize: '0.8rem', width: 70, textAlign: 'right' },
};
