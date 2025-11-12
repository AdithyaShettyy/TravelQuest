import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  MapIcon,
  TrophyIcon,
  GiftIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                🎯 TourQuest
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <div className="font-semibold">{user?.displayName || user?.username}</div>
                <div className="text-gray-500">{user?.totalPoints || 0} pts</div>
              </div>
              <Link to={`/profile/${user?.id}`}>
                <UserCircleIcon className="h-8 w-8 text-gray-600 hover:text-primary-600" />
              </Link>
              <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
        <div className="flex justify-around py-2">
          <Link to="/" className="flex flex-col items-center p-2">
            <MapIcon className="h-6 w-6 text-gray-600" />
            <span className="text-xs mt-1">Map</span>
          </Link>
          <Link to="/quests" className="flex flex-col items-center p-2">
            <TrophyIcon className="h-6 w-6 text-gray-600" />
            <span className="text-xs mt-1">Quests</span>
          </Link>
          <Link to="/leaderboard" className="flex flex-col items-center p-2">
            <TrophyIcon className="h-6 w-6 text-gray-600" />
            <span className="text-xs mt-1">Rankings</span>
          </Link>
          <Link to="/rewards" className="flex flex-col items-center p-2">
            <GiftIcon className="h-6 w-6 text-gray-600" />
            <span className="text-xs mt-1">Rewards</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
