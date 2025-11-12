import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Map from './pages/Map';
import Quests from './pages/Quests';
import QuestDetail from './pages/QuestDetail';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/"
        element={
          isAuthenticated ? <Layout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<Map />} />
        <Route path="quests" element={<Quests />} />
        <Route path="quests/:id" element={<QuestDetail />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="rewards" element={<Rewards />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
