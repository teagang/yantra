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
      <div style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/')}>← Back</button>
        <h1 style={styles.title}>Statistics</h1>
      </div>

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
  );
}

const styles: Record<string, React.CSSProperties> = {
  screen: {
    height: '100%',
    overflowY: 'auto',
    backgroundColor: '#F2EDD7',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect x='2' y='2' width='20' height='20' rx='2' fill='%23B88870' opacity='0.07'/%3E%3Crect x='26' y='2' width='20' height='20' rx='2' fill='%23789090' opacity='0.06'/%3E%3Crect x='2' y='26' width='20' height='20' rx='2' fill='%23B8A068' opacity='0.07'/%3E%3Crect x='26' y='26' width='20' height='20' rx='2' fill='%239888A0' opacity='0.06'/%3E%3C/svg%3E\")",
    padding: '0 0 2rem',
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
  profileCard: {
    margin: '1rem',
    background: '#EDE4CC',
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
