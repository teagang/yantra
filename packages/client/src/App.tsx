import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSocketEvents } from './hooks/useSocket.js';
import { ThemeProvider } from './theme/ThemeContext.js';
import MenuPage from './pages/MenuPage.js';
import LobbyPage from './pages/LobbyPage.js';
import GamePage from './pages/GamePage.js';
import StatisticsPage from './pages/StatisticsPage.js';
import RulesPage from './pages/RulesPage.js';

export default function App() {
  useSocketEvents(); // single global registration for all server→client events

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuPage />} />
          <Route path="/lobby" element={<LobbyPage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
          <Route path="/stats" element={<StatisticsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
